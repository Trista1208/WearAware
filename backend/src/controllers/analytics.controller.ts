import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';
import * as analyticsService from '../services/analytics.service';

export async function wardrobeStats(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  try {
    const data = await analyticsService.getWardrobeStats(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export async function scoreTrend(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const days   = Number(req.query.days) || 90;

  try {
    const data = await analyticsService.getScoreTrend(userId, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export async function insights(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  try {
    const data = await analyticsService.getSustainabilityInsights(userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export async function dashboardSummary(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const [wardrobeStats, scoreTrend, insightsData, scoreRow] = await Promise.all([
      analyticsService.getWardrobeStats(userId),
      analyticsService.getScoreTrend(userId, 30),
      analyticsService.getSustainabilityInsights(userId),
      supabaseAdmin
        .from('sustainability_scores')
        .select('score, grade, updated_at')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => data),
    ]);

    res.json({
      success: true,
      data: {
        score:         scoreRow,
        wardrobe:      wardrobeStats,
        score_trend:   scoreTrend,
        insights:      insightsData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}
