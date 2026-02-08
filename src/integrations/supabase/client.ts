import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let _supabase: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase URL and key are required. Check your environment configuration.');
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _supabase;
};

// For backward compat — will throw if env vars missing
export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : (null as unknown as SupabaseClient);
