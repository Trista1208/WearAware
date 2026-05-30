import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*, sustainability_scores(score, grade, updated_at)')
    .eq('id', userId)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  res.json({ success: true, data });
}

export async function updateMyProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(req.body)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data });
}

export async function getPublicProfile(req: AuthRequest, res: Response): Promise<void> {
  const { username } = req.params;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, style_tags, location_city, location_country, sustainability_scores(score, grade)')
    .eq('username', username)
    .single();

  if (error || !data) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({ success: true, data });
}

export async function getMyConnections(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('user_connections')
    .select(`
      id,
      connected_at,
      match_id,
      user_a:user_a_id(id, username, display_name, avatar_url),
      user_b:user_b_id(id, username, display_name, avatar_url)
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order('connected_at', { ascending: false });

  if (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }

  // Normalise: always return the "other" user in a `partner` field
  const connections = (data || []).map((c: Record<string, unknown>) => {
    const partner = (c.user_a as { id: string })?.id === userId ? c.user_b : c.user_a;
    return { id: c.id, connected_at: c.connected_at, match_id: c.match_id, partner };
  });

  res.json({ success: true, data: connections });
}
