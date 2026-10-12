import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Information regarding the active database connection
 */
export function getDatabaseConnectionInfo() {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : 'Local Database Engine (Offline/Dev Mode)',
    mode: isSupabaseConfigured ? ('supabase_cloud' as const) : ('local_storage_engine' as const),
    notes: isSupabaseConfigured 
      ? 'Connected to live Supabase PostgreSQL instance with Row Level Security.' 
      : 'Running in Local Storage Engine mode. Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to link your cloud PostgreSQL database.'
  };
}
