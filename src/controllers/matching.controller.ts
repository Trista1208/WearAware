import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';
import * as matchingService from '../services/matching.service';

// ─── Ready to part with ───────────────────────────────────────────────────────

export async function listMyRtpw(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('ready_to_part_with')
    .select('*, clothing_items(id, name, category, color, condition, image_urls)')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
}

export async function addToRtpw(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { item_id, preference, notes } = req.body as {
    item_id: string;
    preference: string[];
    notes?: string;
  };

  // Verify ownership
  const { data: item } = await supabaseAdmin
    .from('clothing_items')
    .select('id')
    .eq('id', item_id)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .single();

  if (!item) { res.status(404).json({ success: false, error: 'Item not found' }); return; }

  const { data, error } = await supabaseAdmin
    .from('ready_to_part_with')
    .insert({ item_id, user_id: userId, preference, notes })
    .select()
    .single();

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }
  res.status(201).json({ success: true, data });
}

export async function removeFromRtpw(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;

  const { error } = await supabaseAdmin
    .from('ready_to_part_with')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data: { message: 'Removed from ready-to-part-with' } });
}

export async function listAllRtpw(req: AuthRequest, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const city     = req.query.city     as string | undefined;

  let query = supabaseAdmin
    .from('ready_to_part_with')
    .select(`
      id, preference, notes, added_at,
      clothing_items(id, name, category, color, condition, material, image_urls),
      profiles:user_id(username, display_name, location_city)
    `)
    .eq('is_matched', false)
    .limit(100);

  if (category) query = query.eq('clothing_items.category', category);

  const { data, error } = await query;
  if (error) { res.status(500).json({ success: false, error: error.message }); return; }

  // Filter by city if requested (done in-app since nested column filter is tricky)
  const filtered = city
    ? (data || []).filter((r: Record<string, unknown>) => {
        const profile = r.profiles as { location_city?: string } | null;
        return profile?.location_city?.toLowerCase().includes(city.toLowerCase());
      })
    : data;

  res.json({ success: true, data: filtered });
}

// ─── Wanted items ─────────────────────────────────────────────────────────────

export async function listMyWanted(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from('wanted_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_fulfilled', false)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
}

export async function addWanted(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from('wanted_items')
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }
  res.status(201).json({ success: true, data });
}

export async function removeWanted(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id }  = req.params;
  const { error } = await supabaseAdmin
    .from('wanted_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) { res.status(400).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data: { message: 'Wanted item removed' } });
}

// ─── Matching engine ──────────────────────────────────────────────────────────

export async function searchMatches(req: AuthRequest, res: Response): Promise<void> {
  const userId       = req.user!.id;
  const wantedItemId = req.params.wanted_id as string;

  try {
    const candidates = await matchingService.findMatches(userId, wantedItemId);
    res.json({ success: true, data: candidates });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
}

export async function proposeMatch(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { rtpw_id, wanted_item_id, receiving_user_id, match_score } = req.body as {
    rtpw_id:           string;
    wanted_item_id?:   string;
    receiving_user_id: string;
    match_score:       number;
  };

  // Verify the RTPW item belongs to this user
  const { data: rtpw } = await supabaseAdmin
    .from('ready_to_part_with')
    .select('id, user_id')
    .eq('id', rtpw_id)
    .single();

  if (!rtpw || rtpw.user_id !== userId) {
    res.status(403).json({ success: false, error: 'You can only propose matches for your own RTPW items' });
    return;
  }

  try {
    const matchId = await matchingService.createMatch(
      rtpw_id, wanted_item_id || null, userId, receiving_user_id, match_score,
    );
    res.status(201).json({ success: true, data: { match_id: matchId } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
}

export async function listMyMatches(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('clothing_matches')
    .select(`
      *,
      offering_item:offering_item_id(id, preference, notes,
        clothing_items(name, category, color, image_urls)
      ),
      offering_user:offering_user_id(username, display_name, avatar_url),
      receiving_user:receiving_user_id(username, display_name, avatar_url)
    `)
    .or(`offering_user_id.eq.${userId},receiving_user_id.eq.${userId}`)
    .order('matched_at', { ascending: false });

  if (error) { res.status(500).json({ success: false, error: error.message }); return; }
  res.json({ success: true, data });
}

export async function acceptMatch(req: AuthRequest, res: Response): Promise<void> {
  const userId  = req.user!.id;
  const matchId = req.params.id as string;

  try {
    await matchingService.acceptMatch(matchId, userId);
    res.json({ success: true, data: { message: 'Match accepted! Both users earned a sustainability boost.' } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
}

export async function rejectMatch(req: AuthRequest, res: Response): Promise<void> {
  const userId  = req.user!.id;
  const matchId = req.params.id;

  const { data: match } = await supabaseAdmin
    .from('clothing_matches')
    .select('receiving_user_id, status')
    .eq('id', matchId)
    .single();

  if (!match || match.receiving_user_id !== userId) {
    res.status(403).json({ success: false, error: 'Not authorised' });
    return;
  }
  if (match.status !== 'pending') {
    res.status(409).json({ success: false, error: `Match is already ${match.status}` });
    return;
  }

  await supabaseAdmin
    .from('clothing_matches')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('id', matchId);

  res.json({ success: true, data: { message: 'Match rejected' } });
}
