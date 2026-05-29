import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest, MaterialType } from '../types';
import * as sustainabilityService from '../services/sustainability.service';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sustainability/score
// ─────────────────────────────────────────────────────────────────────────────
export async function getScore(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('sustainability_scores')
    .select('score, grade, items_analysed, updated_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    res.status(404).json({
      success: false,
      error:   'Score not found. Call POST /api/sustainability/compute first.',
    });
    return;
  }

  res.json({ success: true, data });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sustainability/breakdown
// Returns the full penalty/bonus breakdown for maximum transparency.
// ─────────────────────────────────────────────────────────────────────────────
export async function getBreakdown(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  // Try the stored breakdown first (fast path)
  const { data: stored } = await supabaseAdmin
    .from('sustainability_scores')
    .select('breakdown, updated_at')
    .eq('user_id', userId)
    .single();

  if (stored?.breakdown) {
    res.json({ success: true, data: stored.breakdown, computed_at: stored.updated_at });
    return;
  }

  // If not computed yet, compute it now (first time)
  try {
    const breakdown = await sustainabilityService.computeAndSaveScore(userId);
    res.json({ success: true, data: breakdown, computed_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sustainability/compute
// (Re-)compute the score — call after uploading/editing wardrobe items.
// ─────────────────────────────────────────────────────────────────────────────
export async function computeScore(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const breakdown = await sustainabilityService.computeAndSaveScore(userId);
    res.json({
      success: true,
      data: {
        score:          breakdown.final_score,
        grade:          breakdown.grade,
        items_analysed: breakdown.items_analysed,
        total_penalty:  breakdown.total_penalty,
        total_bonus:    breakdown.total_bonus,
        summary:        breakdown.summary,
        breakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sustainability/history
// ─────────────────────────────────────────────────────────────────────────────
export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const limit  = Math.min(Number(req.query.limit) || 50, 200);

  try {
    const data = await sustainabilityService.getScoreHistory(userId, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sustainability/fast-fashion-brands
// Exposes the brand list publicly so the frontend can warn users while typing.
// ─────────────────────────────────────────────────────────────────────────────
export async function getFastFashionBrands(_req: Request, res: Response): Promise<void> {
  const brands = Array.from(sustainabilityService.FAST_FASHION_BRANDS).sort();
  res.json({
    success: true,
    data:    { brands, count: brands.length },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sustainability/advice
// ─────────────────────────────────────────────────────────────────────────────
export async function getPurchaseAdvice(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const {
    item_description,
    image_url,
    brand,
    material,
    is_second_hand,
    is_local_brand,
  } = req.body as {
    item_description?: string;
    image_url?:        string;
    brand?:            string;
    material?:         MaterialType;
    is_second_hand:    boolean;
    is_local_brand:    boolean;
  };

  const { delta, verdict, reasons } = sustainabilityService.estimatePurchaseDelta({
    brand,
    material,
    isSecondHand: is_second_hand,
    isLocalBrand: is_local_brand,
  });

  const isFf    = sustainabilityService.isFastFashionBrand(brand);
  const reasoning = reasons.join('. ');

  // Persist advice log
  const { data: logEntry, error } = await supabaseAdmin
    .from('purchase_advice_log')
    .insert({
      user_id:               userId,
      item_description:      item_description || null,
      image_url:             image_url        || null,
      ai_verdict:            verdict,
      ai_reasoning:          reasoning,
      sustainability_impact: delta,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to save advice log' });
    return;
  }

  res.json({
    success: true,
    data: {
      advice_log_id:          logEntry.id,
      verdict,
      reasons,
      estimated_score_delta:  delta,
      fast_fashion_warning:   isFf ? `"${brand}" is on the fast-fashion brand list. This item will add to your fast-fashion penalty on your next wardrobe rescore.` : null,
      tip: verdict === 'not_recommended'
        ? 'Consider looking for this item second-hand or in a partner store near you.'
        : verdict === 'recommended'
        ? 'Great choice! This item aligns well with sustainable fashion.'
        : 'This item has a moderate sustainability profile.',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sustainability/decision
// ─────────────────────────────────────────────────────────────────────────────
export async function recordPurchaseDecision(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { advice_log_id, decision } = req.body as {
    advice_log_id: string;
    decision:      'purchased' | 'skipped';
  };

  const { data: logEntry, error: fetchError } = await supabaseAdmin
    .from('purchase_advice_log')
    .select('*')
    .eq('id', advice_log_id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !logEntry) {
    res.status(404).json({ success: false, error: 'Advice log not found' });
    return;
  }

  if (logEntry.user_decision) {
    res.status(409).json({ success: false, error: 'Decision already recorded' });
    return;
  }

  await supabaseAdmin
    .from('purchase_advice_log')
    .update({ user_decision: decision })
    .eq('id', advice_log_id);

  let scoreMessage = `Decision "${decision}" recorded.`;

  if (decision === 'purchased' && logEntry.sustainability_impact !== null) {
    const impact   = logEntry.sustainability_impact as number;
    const eventType = impact >= 0 ? 'purchase_sustainable' : 'purchase_unsustainable';

    await sustainabilityService.applyDelta(
      userId,
      eventType,
      impact,
      advice_log_id,
      `Purchase decision: ${logEntry.ai_verdict}`,
    );

    scoreMessage += ` Score adjusted by ${impact >= 0 ? '+' : ''}${impact} points.`;
    scoreMessage += ` Call POST /api/sustainability/compute to fully rescore your wardrobe.`;
  }

  res.json({ success: true, data: { message: scoreMessage } });
}
