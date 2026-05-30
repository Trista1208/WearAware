import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';
import * as aiService from '../services/ai.service';

// ── GET /api/ai/health ────────────────────────────────────────────────────────
export async function healthCheck(_req: AuthRequest, res: Response): Promise<void> {
  const result = await aiService.testConnection();
  res.status(result.ok ? 200 : 503).json({ success: result.ok, data: result });
}

// ── POST /api/ai/analyze ──────────────────────────────────────────────────────
// Core visual analysis endpoint — uses the Sustainable Fashion Visual Analyzer
// system prompt. Accepts an image URL or base64, plus optional wardrobe context.
export async function analyzeGarment(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { image_url, description, include_wardrobe = true } = req.body as {
    image_url?:        string;
    description?:      string;
    include_wardrobe?: boolean;
  };

  if (!image_url && !description) {
    res.status(400).json({ success: false, error: 'Provide either image_url or description' });
    return;
  }

  try {
    // Optionally fetch the user's wardrobe for similarity analysis
    let wardrobeItems: aiService.WardrobeItem[] = [];
    if (include_wardrobe) {
      const { data } = await supabaseAdmin
        .from('clothing_items')
        .select('name, category, color, material')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .limit(50);
      wardrobeItems = (data || []) as aiService.WardrobeItem[];
    }

    let analysis: string;
    let model = 'gpt-4o-mini';
    let tokens_used = 0;

    if (image_url) {
      const result = await aiService.analyzeGarmentImage({ image_url, wardrobe_items: wardrobeItems });
      analysis     = result.analysis;
      model        = result.model;
      tokens_used  = result.tokens_used;
    } else {
      analysis = await aiService.analyzeGarmentText(description!, wardrobeItems);
    }

    res.json({
      success: true,
      data: {
        analysis,
        model,
        tokens_used,
        wardrobe_items_compared: wardrobeItems.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ── GET /api/ai/wardrobe-insights ─────────────────────────────────────────────
export async function wardrobeInsights(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const { data: items } = await supabaseAdmin
      .from('clothing_items')
      .select('category, wear_count, brand, is_active')
      .eq('owner_id', userId)
      .eq('is_active', true);

    const { data: score } = await supabaseAdmin
      .from('sustainability_scores')
      .select('score, grade')
      .eq('user_id', userId)
      .single();

    if (!items || items.length === 0) {
      res.json({ success: true, data: { insights: ['Add items to your wardrobe to get AI insights!'] } });
      return;
    }

    const never_worn = items.filter(i => (i.wear_count ?? 0) === 0).length;
    const avg_wears  = items.reduce((s, i) => s + (i.wear_count ?? 0), 0) / items.length;

    const catCount: Record<string, number> = {};
    items.forEach(i => { catCount[i.category] = (catCount[i.category] || 0) + 1; });
    const top_categories = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));

    const FF_BRANDS = ['zara','h&m','shein','forever21','primark','asos','topshop','gap','uniqlo','mango'];
    const fast_fashion_count = items.filter(i => FF_BRANDS.includes((i.brand || '').toLowerCase())).length;

    const snapshot: aiService.WardrobeSnapshot = {
      total_items:          items.length,
      never_worn,
      avg_wears,
      top_categories,
      fast_fashion_count,
      sustainability_score: score?.score ?? 50,
      grade:                score?.grade ?? 'C',
    };

    const insights = await aiService.getWardrobeInsights(snapshot);
    res.json({ success: true, data: { insights, snapshot } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ── POST /api/ai/trade-insight ────────────────────────────────────────────────
// Evaluates a proposed swap and returns a structured AI verdict
export async function tradeInsight(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { wanted_item, offered_item } = req.body as {
    wanted_item:  { name: string; category: string; brand?: string; tag?: string }
    offered_item: { name: string; category: string; brand?: string; wears?: number; tag?: string }
  };

  try {
    const { data: score } = await supabaseAdmin
      .from('sustainability_scores')
      .select('score')
      .eq('user_id', userId)
      .single();

    const result = await aiService.getTradeInsight({
      wanted_item,
      offered_item,
      user_score: score?.score ?? 50,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
export async function chat(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { message, history } = req.body as {
    message:  string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  };

  try {
    const { data: items } = await supabaseAdmin
      .from('clothing_items')
      .select('name, category, brand, wear_count')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .limit(20);

    const wardrobeContext = items && items.length > 0
      ? `User has ${items.length} items including: ${items.slice(0, 6).map(i => `${i.name} (${i.category})`).join(', ')}${items.length > 6 ? ` and ${items.length - 6} more` : ''}.`
      : 'User wardrobe is empty.';

    const reply = await aiService.styleChat(message, wardrobeContext, history || []);
    res.json({ success: true, data: { reply } });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}
