import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';
import { applyDelta, SCORE_DELTAS } from '../services/sustainability.service';

export async function listStores(req: AuthRequest, res: Response): Promise<void> {
  const { city, country, limit, offset } = req.query as {
    city?: string;
    country?: string;
    limit: string;
    offset: string;
  };

  let query = supabaseAdmin
    .from('partner_stores')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (city)    query = query.ilike('city', `%${city}%`);
  if (country) query = query.ilike('country', `%${country}%`);

  const { data, error, count } = await query;
  if (error) { res.status(500).json({ success: false, error: error.message }); return; }

  res.json({ success: true, data, meta: { total: count, limit: Number(limit), offset: Number(offset) } });
}

export async function getStore(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('partner_stores')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) { res.status(404).json({ success: false, error: 'Store not found' }); return; }
  res.json({ success: true, data });
}

export async function createDonation(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { store_id, item_id, listed_price } = req.body as {
    store_id:      string;
    item_id:       string;
    listed_price?: number;
  };

  // Verify item belongs to user
  const { data: item } = await supabaseAdmin
    .from('clothing_items')
    .select('id')
    .eq('id', item_id)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .single();

  if (!item) { res.status(404).json({ success: false, error: 'Item not found' }); return; }

  // Verify store exists
  const { data: store } = await supabaseAdmin
    .from('partner_stores')
    .select('id, name')
    .eq('id', store_id)
    .eq('is_active', true)
    .single();

  if (!store) { res.status(404).json({ success: false, error: 'Partner store not found' }); return; }

  const { data: donation, error } = await supabaseAdmin
    .from('store_donations')
    .insert({ user_id: userId, store_id, item_id, listed_price })
    .select()
    .single();

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }

  // Boost sustainability score immediately for the donation intent
  await applyDelta(
    userId,
    'store_donation',
    SCORE_DELTAS.STORE_DONATION,
    donation.id,
    `Donated item to ${store.name}`,
  );

  // Soft-remove item from wardrobe (it's leaving the user's possession)
  await supabaseAdmin
    .from('clothing_items')
    .update({ is_active: false })
    .eq('id', item_id);

  res.status(201).json({
    success: true,
    data: {
      donation,
      message: `Donation logged! Your sustainability score has been boosted by +${SCORE_DELTAS.STORE_DONATION} points.`,
    },
  });
}

export async function myDonations(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('store_donations')
    .select(`
      *,
      partner_stores(name, city, country),
      clothing_items(name, category, image_urls)
    `)
    .eq('user_id', userId)
    .order('donated_at', { ascending: false });

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
}

export async function updateDonation(req: AuthRequest, res: Response): Promise<void> {
  const { id }    = req.params;
  const { status, sold_price, listed_price } = req.body as {
    status:        string;
    sold_price?:   number;
    listed_price?: number;
  };

  const updates: Record<string, unknown> = { status };
  if (sold_price   !== undefined) updates.sold_price   = sold_price;
  if (listed_price !== undefined) updates.listed_price = listed_price;
  if (status === 'sold') updates.sold_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('store_donations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
}
