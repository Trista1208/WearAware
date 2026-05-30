import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

export async function getMyProfile(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const [{ data: profile, error: profileError }, { data: scores }] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
    supabaseAdmin.from('sustainability_scores').select('score, grade, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
  ]);

  if (profileError || !profile) {
    res.status(404).json({ success: false, error: 'Profile not found' });
    return;
  }

  res.json({ success: true, data: { ...profile, sustainability_scores: scores || [] } });
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
    .select('id, name, gender, profession, sustainable_goal, fashion_style, sustainability_scores(score, grade)')
    .eq('name', username)
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
      user_a:user_a_id(id, name),
      user_b:user_b_id(id, name)
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
