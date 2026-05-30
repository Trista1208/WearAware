import { supabaseAdmin } from '../config/supabase';
import { applyDelta, SCORE_DELTAS } from './sustainability.service';

interface MatchCandidate {
  rtpw_id: string;
  item_id: string;
  offering_user_id: string;
  category: string;
  color: string | null;
  material: string | null;
  ai_tags: string[];
  match_score: number;
}

/**
 * Score two items against a wanted-item description.
 * Simple keyword/attribute overlap scoring — the AI teammate will enhance this.
 */
function scoreCandidate(
  candidate: { category: string; color?: string | null; material?: string | null; ai_tags: string[] },
  wanted:    { category?: string | null; preferred_colors: string[]; preferred_brands: string[] },
): number {
  let score = 0;

  if (wanted.category && candidate.category === wanted.category) score += 40;

  if (candidate.color && wanted.preferred_colors.length > 0) {
    const colorMatch = wanted.preferred_colors.some(
      (c) => candidate.color?.toLowerCase().includes(c.toLowerCase()),
    );
    if (colorMatch) score += 30;
  }

  if (candidate.ai_tags.length > 0 && wanted.preferred_brands.length > 0) {
    const tagMatch = wanted.preferred_brands.some((b) =>
      candidate.ai_tags.some((t) => t.toLowerCase().includes(b.toLowerCase())),
    );
    if (tagMatch) score += 20;
  }

  return Math.min(100, score);
}

/**
 * Find the best matches from all ready-to-part-with items for a given wanted item.
 */
export async function findMatches(
  requestingUserId: string,
  wantedItemId: string,
): Promise<MatchCandidate[]> {
  // Fetch the wanted item
  const { data: wanted, error: wErr } = await supabaseAdmin
    .from('wanted_items')
    .select('*')
    .eq('id', wantedItemId)
    .eq('user_id', requestingUserId)
    .single();

  if (wErr || !wanted) throw new Error('Wanted item not found');

  // Fetch all unmatched ready-to-part-with items (from other users)
  const { data: rtpwList, error: rErr } = await supabaseAdmin
    .from('ready_to_part_with')
    .select(`
      id,
      user_id,
      item_id,
      clothing_items(id, category, color, material, ai_tags)
    `)
    .eq('is_matched', false)
    .neq('user_id', requestingUserId);

  if (rErr) throw new Error('Failed to fetch available items');

  const candidates: MatchCandidate[] = (rtpwList || []).map((r: Record<string, unknown>) => {
    const item = r.clothing_items as {
      id: string;
      category: string;
      color: string | null;
      material: string | null;
      ai_tags: string[];
    };

    return {
      rtpw_id:          r.id as string,
      item_id:          item.id,
      offering_user_id: r.user_id as string,
      category:         item.category,
      color:            item.color,
      material:         item.material,
      ai_tags:          item.ai_tags || [],
      match_score:      scoreCandidate(item, {
        category:          wanted.category,
        preferred_colors:  wanted.preferred_colors || [],
        preferred_brands:  wanted.preferred_brands || [],
      }),
    };
  });

  // Return top matches with score > 0, sorted best-first
  return candidates
    .filter((c) => c.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);
}

/**
 * Create a formal match record between two users.
 */
export async function createMatch(
  offeringRtpwId:    string,
  wantedItemId:      string | null,
  offeringUserId:    string,
  receivingUserId:   string,
  matchScore:        number,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('clothing_matches')
    .insert({
      offering_item_id:  offeringRtpwId,
      wanted_item_id:    wantedItemId,
      offering_user_id:  offeringUserId,
      receiving_user_id: receivingUserId,
      match_score:       matchScore,
      status:            'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * Accept a match — marks it complete, connects users, boosts scores.
 */
export async function acceptMatch(matchId: string, acceptingUserId: string): Promise<void> {
  const { data: match, error } = await supabaseAdmin
    .from('clothing_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error || !match) throw new Error('Match not found');
  if (match.receiving_user_id !== acceptingUserId) throw new Error('Not authorised to accept this match');
  if (match.status !== 'pending') throw new Error(`Match is already ${match.status}`);

  // Update match status
  await supabaseAdmin
    .from('clothing_matches')
    .update({ status: 'completed', resolved_at: new Date().toISOString() })
    .eq('id', matchId);

  // Mark the offering item as matched
  await supabaseAdmin
    .from('ready_to_part_with')
    .update({ is_matched: true })
    .eq('id', match.offering_item_id);

  // Mark wanted item fulfilled
  if (match.wanted_item_id) {
    await supabaseAdmin
      .from('wanted_items')
      .update({ is_fulfilled: true })
      .eq('id', match.wanted_item_id);
  }

  // Create user connection
  const [userA, userB] = [match.offering_user_id, match.receiving_user_id].sort();
  await supabaseAdmin
    .from('user_connections')
    .upsert({ user_a_id: userA, user_b_id: userB, match_id: matchId });

  // Boost sustainability scores for both users
  await applyDelta(
    match.offering_user_id, 'clothing_swap',
    SCORE_DELTAS.CLOTHING_SWAP, matchId,
    'Clothing swap completed — item found a new home',
  );
  await applyDelta(
    match.receiving_user_id, 'clothing_swap',
    SCORE_DELTAS.CLOTHING_SWAP, matchId,
    'Clothing swap completed — received a pre-loved item',
  );
}
