import { supabaseAdmin } from '../config/supabase';
import { ScoreEventType, MaterialType } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// FAST FASHION BRAND LIST
// Case-insensitive, partial-match checked (so "H&M Studio" still matches "h&m")
// Sources: Good On You, Fashion Revolution, Business of Fashion fast-fashion lists
// ─────────────────────────────────────────────────────────────────────────────
export const FAST_FASHION_BRANDS = new Set([
  'shein', 'zara', 'h&m', 'hm', 'h & m',
  'primark', 'penneys',
  'forever 21', 'forever21',
  'boohoo', 'boohooMAN',
  'prettylittlething', 'pretty little thing',
  'missguided',
  'fashion nova',
  'romwe', 'zaful',
  'asos',
  'topshop',
  'new look',
  'river island',
  'charlotte russe',
  'nasty gal',
  'select fashion',
  'joe browns',
  'kiabi',
  'camaieu',
  'peacocks',
  'matalan',
  'george at asda', 'george',
  'f21', 'f&f',
  'terranova',
  'stradivarius',
  'bershka',
  'pull&bear', 'pull & bear',
  'mango',            // borderline – included for completeness
  'uniqlo',           // borderline – higher quality but mass-market
  'gap',
  'old navy',
  'banana republic',
  'express',
  'wet seal',
  'rue21',
  'rainbow apparel',
  'cider',
  'temu fashion',
  'lc waikiki',
  'koton',
]);

/**
 * Returns true if the brand string matches any fast fashion brand.
 * Uses case-insensitive partial matching so slight variations still catch.
 */
export function isFastFashionBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const normalised = brand.trim().toLowerCase();
  for (const ff of FAST_FASHION_BRANDS) {
    if (normalised === ff || normalised.includes(ff) || ff.includes(normalised)) {
      return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Every item in the wardrobe beyond this threshold costs 1 point. */
const WARDROBE_SIZE_THRESHOLD = 100;

/** Every item from a fast-fashion brand costs 1 point. */
const FAST_FASHION_PENALTY_PER_ITEM = 1;

/**
 * Items in the same (category + primary colour) group are considered "similar".
 * Having more than this many similar items → each excess item costs 1 point.
 */
const SIMILARITY_THRESHOLD = 5;

/** Items worn ≤ this many times are considered "barely used" → 1 point each. */
const LOW_WEAR_THRESHOLD = 2;

/**
 * Items added to the wardrobe within this many days are exempt from the
 * low-wear penalty — it's not fair to penalise brand-new additions.
 */
const NEW_ITEM_GRACE_DAYS = 60;

/** An item worn this many times or more earns a small bonus. */
const HIGH_WEAR_THRESHOLD = 10;
const HIGH_WEAR_BONUS_PER_ITEM = 0.5;
const HIGH_WEAR_BONUS_CAP = 10;

// ─────────────────────────────────────────────────────────────────────────────
// SCORE BREAKDOWN TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PenaltyItem {
  item_id: string;
  name: string;
  reason: string;
  points: number;
}

export interface SimilarityGroup {
  category: string;
  colour: string;
  total_count: number;
  excess_count: number;     // items beyond the threshold
  penalty: number;
  example_items: string[];  // item names for display
}

export interface ScoreBreakdown {
  base_score: number;

  penalties: {
    wardrobe_size: {
      total_items:          number;
      threshold:            number;
      items_over_threshold: number;
      penalty:              number;
      description:          string;
    };
    fast_fashion: {
      items_count:  number;
      brands_found: string[];
      items:        PenaltyItem[];
      penalty:      number;
      description:  string;
    };
    similar_items: {
      groups:      SimilarityGroup[];
      penalty:     number;
      description: string;
    };
    low_utilisation: {
      items_count:     number;
      items:           PenaltyItem[];
      grace_days:      number;
      wear_threshold:  number;
      penalty:         number;
      description:     string;
    };
  };

  bonuses: {
    high_wear: {
      items_count: number;
      bonus:       number;
      description: string;
    };
  };

  total_penalty:   number;
  total_bonus:     number;
  net_adjustment:  number;       // total_bonus - total_penalty
  final_score:     number;       // max(0, base + net_adjustment)
  grade:           string;
  items_analysed:  number;

  // Human-readable summary for the transparency panel
  summary: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADE HELPER
// ─────────────────────────────────────────────────────────────────────────────
export function scoreToGrade(score: number): string {
  if (score >= 85) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 65) return 'B+';
  if (score >= 55) return 'B';
  if (score >= 45) return 'C+';
  if (score >= 35) return 'C';
  if (score >= 25) return 'D';
  return 'F';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCORING ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the full sustainability score for a user's wardrobe.
 *
 * Algorithm:
 *   base = 100
 *   penalty_1: –1 per item over WARDROBE_SIZE_THRESHOLD (100)
 *   penalty_2: –1 per item from a fast-fashion brand
 *   penalty_3: –1 per item over SIMILARITY_THRESHOLD (5) in same category+colour
 *   penalty_4: –1 per item worn ≤ LOW_WEAR_THRESHOLD (2) times (excl. new items)
 *   bonus_1:   +0.5 per item worn ≥ HIGH_WEAR_THRESHOLD (10) times (capped at +10)
 *
 *   final = max(0, base – penalties + bonuses)
 *
 * Returns a full breakdown so the frontend can show users exactly why
 * they have their score (transparency requirement).
 */
export async function computeWardrobeScore(userId: string): Promise<ScoreBreakdown> {
  // ── 1. Fetch all active wardrobe items ──────────────────────────────────
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('clothing_items')
    .select('id, name, brand, category, color, created_at')
    .eq('owner_id', userId)
    .eq('is_active', true);

  if (itemsErr) throw new Error(`Failed to fetch wardrobe: ${itemsErr.message}`);

  const allItems = items || [];
  const totalItems = allItems.length;

  // ── 2. Fetch wear counts per item ────────────────────────────────────────
  const itemIds = allItems.map((i) => i.id as string);

  const wearCountMap: Record<string, number> = {};
  if (itemIds.length > 0) {
    const { data: wears } = await supabaseAdmin
      .from('wear_logs')
      .select('item_id')
      .eq('user_id', userId)
      .in('item_id', itemIds);

    (wears || []).forEach((w: { item_id: string }) => {
      wearCountMap[w.item_id] = (wearCountMap[w.item_id] || 0) + 1;
    });
  }

  const graceDate = new Date();
  graceDate.setDate(graceDate.getDate() - NEW_ITEM_GRACE_DAYS);

  // ──────────────────────────────────────────────────────────────────────────
  // PENALTY 1 – Wardrobe size (overconsumption)
  // ──────────────────────────────────────────────────────────────────────────
  const itemsOverThreshold = Math.max(0, totalItems - WARDROBE_SIZE_THRESHOLD);
  const sizePenalty        = itemsOverThreshold;   // –1 per excess item

  // ──────────────────────────────────────────────────────────────────────────
  // PENALTY 2 – Fast fashion brands
  // ──────────────────────────────────────────────────────────────────────────
  const ffItems: PenaltyItem[]  = [];
  const ffBrandsFound           = new Set<string>();

  for (const item of allItems) {
    const brand = item.brand as string | null;
    if (isFastFashionBrand(brand)) {
      ffBrandsFound.add(brand!.trim());
      ffItems.push({
        item_id: item.id as string,
        name:    item.name as string,
        reason:  `Brand "${brand}" is a fast-fashion label`,
        points:  FAST_FASHION_PENALTY_PER_ITEM,
      });
    }
  }

  const fastFashionPenalty = ffItems.length * FAST_FASHION_PENALTY_PER_ITEM;

  // ──────────────────────────────────────────────────────────────────────────
  // PENALTY 3 – Duplicate / similar items
  // Groups by (category + normalised primary colour).
  // Items in a group beyond SIMILARITY_THRESHOLD each cost 1 point.
  // ──────────────────────────────────────────────────────────────────────────
  const groupMap: Record<string, Array<{ id: string; name: string }>> = {};

  for (const item of allItems) {
    const cat    = (item.category as string).toLowerCase();
    const colour = ((item.color as string | null) || 'unknown').toLowerCase().trim();
    const key    = `${cat}::${colour}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push({ id: item.id as string, name: item.name as string });
  }

  const similarityGroups: SimilarityGroup[] = [];
  let similarityPenalty = 0;

  for (const [key, groupItems] of Object.entries(groupMap)) {
    if (groupItems.length > SIMILARITY_THRESHOLD) {
      const [cat, colour] = key.split('::');
      const excess        = groupItems.length - SIMILARITY_THRESHOLD;
      const penalty       = excess;

      similarityGroups.push({
        category:      cat,
        colour,
        total_count:   groupItems.length,
        excess_count:  excess,
        penalty,
        example_items: groupItems.slice(0, 3).map((i) => i.name),
      });

      similarityPenalty += penalty;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PENALTY 4 – Low utilisation
  // Items worn ≤ LOW_WEAR_THRESHOLD times AND added more than NEW_ITEM_GRACE_DAYS ago.
  // ──────────────────────────────────────────────────────────────────────────
  const lowWearItems: PenaltyItem[] = [];

  for (const item of allItems) {
    const addedAt  = new Date(item.created_at as string);
    const isNewish = addedAt >= graceDate;
    if (isNewish) continue;                         // within grace period, skip

    const wearCount = wearCountMap[item.id as string] || 0;
    if (wearCount <= LOW_WEAR_THRESHOLD) {
      const wornLabel = wearCount === 0 ? 'never worn' : `only worn ${wearCount}×`;
      lowWearItems.push({
        item_id: item.id as string,
        name:    item.name as string,
        reason:  `${wornLabel} (threshold: >${LOW_WEAR_THRESHOLD}× to avoid penalty)`,
        points:  1,
      });
    }
  }

  const lowWearPenalty = lowWearItems.length;

  // ──────────────────────────────────────────────────────────────────────────
  // BONUS – High utilisation
  // Items worn ≥ HIGH_WEAR_THRESHOLD get a small reward.
  // ──────────────────────────────────────────────────────────────────────────
  const highWearItemsList: string[] = [];

  for (const item of allItems) {
    const wearCount = wearCountMap[item.id as string] || 0;
    if (wearCount >= HIGH_WEAR_THRESHOLD) {
      highWearItemsList.push(item.name as string);
    }
  }

  const rawHighWearBonus  = highWearItemsList.length * HIGH_WEAR_BONUS_PER_ITEM;
  const highWearBonus     = Math.min(HIGH_WEAR_BONUS_CAP, rawHighWearBonus);

  // ──────────────────────────────────────────────────────────────────────────
  // FINAL SCORE CALCULATION
  // ──────────────────────────────────────────────────────────────────────────
  const BASE_SCORE  = 100;
  const totalPenalty = sizePenalty + fastFashionPenalty + similarityPenalty + lowWearPenalty;
  const totalBonus   = highWearBonus;
  const netAdj       = totalBonus - totalPenalty;
  const rawScore     = BASE_SCORE + netAdj;
  const finalScore   = Math.max(0, Math.min(100, rawScore));

  // ──────────────────────────────────────────────────────────────────────────
  // TRANSPARENCY SUMMARY (human-readable bullet points)
  // ──────────────────────────────────────────────────────────────────────────
  const summary: string[] = [];

  summary.push(`Your wardrobe has ${totalItems} active items (threshold: ${WARDROBE_SIZE_THRESHOLD}).`);

  if (sizePenalty > 0) {
    summary.push(
      `Wardrobe too large: ${itemsOverThreshold} item${itemsOverThreshold !== 1 ? 's' : ''} over the ${WARDROBE_SIZE_THRESHOLD}-item threshold → –${sizePenalty} pts`,
    );
  }

  if (fastFashionPenalty > 0) {
    summary.push(
      `Fast-fashion brands: ${ffItems.length} item${ffItems.length !== 1 ? 's' : ''} from brands like ${[...ffBrandsFound].slice(0, 3).join(', ')} → –${fastFashionPenalty} pts`,
    );
  }

  if (similarityPenalty > 0) {
    const groupDescriptions = similarityGroups.map(
      (g) => `${g.excess_count} extra ${g.colour} ${g.category}`,
    );
    summary.push(
      `Too many similar items: ${groupDescriptions.join(', ')} → –${similarityPenalty} pts`,
    );
  }

  if (lowWearPenalty > 0) {
    summary.push(
      `${lowWearItems.length} item${lowWearItems.length !== 1 ? 's' : ''} barely used (worn ≤${LOW_WEAR_THRESHOLD}× and owned for 60+ days) → –${lowWearPenalty} pts`,
    );
  }

  if (highWearBonus > 0) {
    summary.push(
      `${highWearItemsList.length} item${highWearItemsList.length !== 1 ? 's' : ''} worn frequently (${HIGH_WEAR_THRESHOLD}+ times) → +${highWearBonus.toFixed(1)} pts`,
    );
  }

  summary.push(
    `Final score: ${BASE_SCORE} (base) – ${totalPenalty} (penalties) + ${totalBonus.toFixed(1)} (bonuses) = ${finalScore} → Grade ${scoreToGrade(finalScore)}`,
  );

  // ──────────────────────────────────────────────────────────────────────────
  // ASSEMBLE BREAKDOWN OBJECT
  // ──────────────────────────────────────────────────────────────────────────
  const breakdown: ScoreBreakdown = {
    base_score: BASE_SCORE,

    penalties: {
      wardrobe_size: {
        total_items:          totalItems,
        threshold:            WARDROBE_SIZE_THRESHOLD,
        items_over_threshold: itemsOverThreshold,
        penalty:              sizePenalty,
        description:
          itemsOverThreshold > 0
            ? `You have ${itemsOverThreshold} more items than the recommended maximum of ${WARDROBE_SIZE_THRESHOLD}.`
            : `Your wardrobe is within the recommended size of ${WARDROBE_SIZE_THRESHOLD} items. No penalty.`,
      },

      fast_fashion: {
        items_count:  ffItems.length,
        brands_found: [...ffBrandsFound],
        items:        ffItems,
        penalty:      fastFashionPenalty,
        description:
          ffItems.length > 0
            ? `${ffItems.length} of your items are from fast-fashion brands, which have poor environmental and ethical records.`
            : 'None of your items are from known fast-fashion brands.',
      },

      similar_items: {
        groups:      similarityGroups,
        penalty:     similarityPenalty,
        description:
          similarityGroups.length > 0
            ? `You have groups of more than ${SIMILARITY_THRESHOLD} similar items (same category + colour), suggesting impulse buying.`
            : `No over-duplicated item groups detected (threshold: ${SIMILARITY_THRESHOLD} per category/colour).`,
      },

      low_utilisation: {
        items_count:    lowWearItems.length,
        items:          lowWearItems,
        grace_days:     NEW_ITEM_GRACE_DAYS,
        wear_threshold: LOW_WEAR_THRESHOLD,
        penalty:        lowWearPenalty,
        description:
          lowWearItems.length > 0
            ? `${lowWearItems.length} items have been owned for over ${NEW_ITEM_GRACE_DAYS} days but worn ≤${LOW_WEAR_THRESHOLD} times — wasted resources.`
            : `All your items are being worn regularly. Great wardrobe utilisation!`,
      },
    },

    bonuses: {
      high_wear: {
        items_count: highWearItemsList.length,
        bonus:       highWearBonus,
        description:
          highWearItemsList.length > 0
            ? `${highWearItemsList.length} items have been worn ${HIGH_WEAR_THRESHOLD}+ times — you're maximising value and reducing waste.`
            : `No items have reached the ${HIGH_WEAR_THRESHOLD}-wear bonus threshold yet.`,
      },
    },

    total_penalty:  totalPenalty,
    total_bonus:    totalBonus,
    net_adjustment: netAdj,
    final_score:    finalScore,
    grade:          scoreToGrade(finalScore),
    items_analysed: totalItems,
    summary,
  };

  return breakdown;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSIST SCORE TO DATABASE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the algorithm, saves the result to sustainability_scores,
 * and records a 'wardrobe_init' event in the audit log.
 */
export async function computeAndSaveScore(userId: string): Promise<ScoreBreakdown> {
  const breakdown = await computeWardrobeScore(userId);

  // Fetch previous score for the delta event
  const { data: existing } = await supabaseAdmin
    .from('sustainability_scores')
    .select('score')
    .eq('user_id', userId)
    .single();

  const previousScore = (existing?.score as number) ?? 50;

  // Upsert the score row with full breakdown stored as JSONB
  await supabaseAdmin
    .from('sustainability_scores')
    .upsert({
      user_id:        userId,
      score:          breakdown.final_score,
      breakdown:      breakdown,
      items_analysed: breakdown.items_analysed,
      updated_at:     new Date().toISOString(),
    });

  // Write audit event
  await supabaseAdmin.from('sustainability_events').insert({
    user_id:      userId,
    event_type:   'wardrobe_init',
    delta:        breakdown.final_score - previousScore,
    score_before: previousScore,
    score_after:  breakdown.final_score,
    description:  `Wardrobe score computed: ${breakdown.items_analysed} items analysed. Grade: ${breakdown.grade}`,
  });

  return breakdown;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELTA EVENTS (swaps, donations, purchases)
// These are applied ON TOP of the base wardrobe score whenever a user
// takes an action after their initial score has been set.
// ─────────────────────────────────────────────────────────────────────────────

export const SCORE_DELTAS = {
  CLOTHING_SWAP:          +12,
  STORE_DONATION:         +8,
  PURCHASE_SUSTAINABLE:   +3,
  PURCHASE_UNSUSTAINABLE: -5,
  HIGH_WEAR_FREQUENCY:    +2,
  LOW_WEAR_FREQUENCY:     -1,
} as const;

/**
 * Apply an event-based delta. Delegates to the Postgres function
 * `apply_sustainability_delta` which atomically updates the score
 * and inserts an audit row.
 */
export async function applyDelta(
  userId:      string,
  eventType:   ScoreEventType,
  delta:       number,
  referenceId?: string,
  description?: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('apply_sustainability_delta', {
    p_user_id:      userId,
    p_event_type:   eventType,
    p_delta:        delta,
    p_reference_id: referenceId || null,
    p_description:  description || null,
  });

  if (error) throw new Error(`Failed to apply delta: ${error.message}`);
  return data as number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PURCHASE ADVICE (kept from original, uses the delta constants above)
// ─────────────────────────────────────────────────────────────────────────────

export function estimatePurchaseDelta(opts: {
  brand?:       string;
  material?:    MaterialType;
  isSecondHand: boolean;
  isLocalBrand: boolean;
}): { delta: number; verdict: 'recommended' | 'neutral' | 'not_recommended'; reasons: string[] } {
  let delta = 0;
  const reasons: string[] = [];

  // Fast fashion check
  if (isFastFashionBrand(opts.brand)) {
    delta -= 5;
    reasons.push(`"${opts.brand}" is a fast-fashion brand — buying from them adds to your fast-fashion penalty on your next wardrobe rescore`);
  }

  if (opts.isSecondHand) {
    delta += 8;
    reasons.push('Second-hand purchase: no new manufacturing emissions, avoids new fast-fashion penalty');
  }

  if (opts.isLocalBrand) {
    delta += 3;
    reasons.push('Local brand: reduced transport emissions');
  }

  // Material weight
  const MATERIAL_WEIGHTS: Partial<Record<MaterialType, number>> = {
    linen: 4, wool: 3, cotton: 2, silk: 2, viscose: 1, natural_blend: 2,
    denim: 0, leather: -1, synthetic_blend: -2, acrylic: -3, nylon: -3, polyester: -4,
  };

  if (opts.material) {
    const w = MATERIAL_WEIGHTS[opts.material] ?? 0;
    delta += w;
    if (w > 0)  reasons.push(`${opts.material} is a relatively sustainable material`);
    if (w < 0)  reasons.push(`${opts.material} has a high environmental footprint`);
    if (w === 0) reasons.push(`${opts.material} has a neutral environmental profile`);
  }

  const verdict =
    delta >= 5  ? 'recommended'     :
    delta <= -3 ? 'not_recommended' :
    'neutral';

  return { delta, verdict, reasons };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function getScoreHistory(userId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('sustainability_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
