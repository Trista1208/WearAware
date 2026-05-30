import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

export async function listItems(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const query_params = req.query as Record<string, unknown>;
    const limitNum  = Number(query_params.limit  ?? 50);
    const offsetNum = Number(query_params.offset ?? 0);
    const category  = query_params.category as string | undefined;
    const color     = query_params.color    as string | undefined;
    const material  = query_params.material as string | undefined;

    let q = supabaseAdmin
      .from('clothing_items')
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (category) q = q.eq('category', category);
    if (color)    q = q.ilike('color', `%${color}%`);
    if (material) q = q.eq('material', material);

    const { data, error, count } = await q;

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data, meta: { total: count, limit: limitNum, offset: offsetNum } });
  } catch (err) {
    console.error('[wardrobe.listItems]', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
}

export async function createItem(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('clothing_items')
    .insert({ ...req.body, owner_id: userId })
    .select()
    .single();

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  res.status(201).json({ success: true, data });
}

export async function getItem(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;

  const { data, error } = await supabaseAdmin
    .from('clothing_items')
    .select(`
      *,
      wear_logs(id, worn_on, occasion, created_at)
    `)
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Item not found' });
    return;
  }

  res.json({ success: true, data });
}

export async function updateItem(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;

  const { data, error } = await supabaseAdmin
    .from('clothing_items')
    .update(req.body)
    .eq('id', id)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Item not found or not yours' });
    return;
  }

  res.json({ success: true, data });
}

export async function deleteItem(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;

  const { error } = await supabaseAdmin
    .from('clothing_items')
    .update({ is_active: false })
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data: { message: 'Item removed from wardrobe' } });
}

export async function logWear(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;
  const { worn_on, occasion } = req.body as { worn_on?: string; occasion?: string };

  // Verify item belongs to user
  const { data: item } = await supabaseAdmin
    .from('clothing_items')
    .select('id')
    .eq('id', id)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .single();

  if (!item) {
    res.status(404).json({ success: false, error: 'Item not found' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('wear_logs')
    .insert({ item_id: id, user_id: userId, worn_on: worn_on || new Date().toISOString().split('T')[0], occasion })
    .select()
    .single();

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  res.status(201).json({ success: true, data });
}

export async function getWearHistory(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;

  const { data, error } = await supabaseAdmin
    .from('wear_logs')
    .select('*')
    .eq('item_id', id)
    .eq('user_id', userId)
    .order('worn_on', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data, meta: { total_wears: (data || []).length } });
}

export async function getRecentItems(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  // Most recently worn (last 30 days)
  const { data: recentWears } = await supabaseAdmin
    .from('wear_logs')
    .select('item_id, worn_on, clothing_items(id, name, category, color, image_urls)')
    .eq('user_id', userId)
    .gte('worn_on', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('worn_on', { ascending: false })
    .limit(20);

  // Most frequently worn (by count over all time)
  const { data: freqData } = await supabaseAdmin
    .rpc('get_frequently_worn_items', { p_user_id: userId, p_limit: 10 })
    .select('*');

  res.json({
    success: true,
    data: {
      recently_worn:   recentWears  || [],
      frequently_worn: freqData     || [],
    },
  });
}
