import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ws = require('ws');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Check SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env'
  );
}

// Node 20 does not have native WebSocket — pass the ws package as transport
const realtimeOptions = { transport: ws };

/**
 * Public client – respects Row Level Security.
 * Use for all user-facing operations after injecting the user's JWT.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: realtimeOptions,
});

/**
 * Admin client – bypasses RLS.
 * Use only for server-side operations that must reach across user boundaries
 * (e.g. running the matching algorithm, computing scores from a cron job).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth:     { autoRefreshToken: false, persistSession: false },
  realtime: realtimeOptions,
});
