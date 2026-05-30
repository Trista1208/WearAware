import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, username } = req.body as {
    email: string;
    password: string;
    username: string;
  };

  // Check username uniqueness before creating auth user
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    res.status(409).json({ success: false, error: 'Username already taken' });
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    res.status(400).json({ success: false, error: error?.message || 'Registration failed' });
    return;
  }

  // Create profile row (id matches auth.users id)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({ id: data.user.id, username });

  if (profileError) {
    // Roll back auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    res.status(500).json({ success: false, error: 'Failed to create user profile' });
    return;
  }

  // Create initial sustainability score row
  await supabaseAdmin
    .from('sustainability_scores')
    .insert({ user_id: data.user.id, score: 50 });

  res.status(201).json({
    success: true,
    data: {
      user:    { id: data.user.id, email: data.user.email },
      session: data.session,
      message: 'Registration successful. Check your email for confirmation.',
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    res.status(401).json({ success: false, error: error?.message || 'Invalid credentials' });
    return;
  }

  res.json({
    success: true,
    data: {
      user:    { id: data.user.id, email: data.user.email },
      session: data.session,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    await supabase.auth.admin?.signOut(token).catch(() => null);
  }
  res.json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refresh_token } = req.body as { refresh_token: string };

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    res.status(401).json({ success: false, error: error?.message || 'Could not refresh session' });
    return;
  }

  res.json({ success: true, data: { session: data.session } });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3001/reset-password',
  });

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return;
  }

  res.json({ success: true, data: { message: 'Password reset email sent' } });
}
