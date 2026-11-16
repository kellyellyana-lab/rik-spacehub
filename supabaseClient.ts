import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables securely without exposing secrets
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate credentials to ensure they are real URLs and not template placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('example.com') &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseAnonKey.length > 20
);

export const connectionMode: 'supabase_live' | 'demo_local' = isSupabaseConfigured
  ? 'supabase_live'
  : 'demo_local';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'rik_spacehub_auth_session',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Debug log for developer transparency (only displaying host, never secret keys)
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    try {
      const parsed = new URL(supabaseUrl);
      console.log(`[RIK SpaceHub] 🟢 Connected to Supabase backend: ${parsed.host}`);
    } catch {
      console.log('[RIK SpaceHub] 🟢 Connected to Supabase backend.');
    }
  } else {
    console.info(
      '[RIK SpaceHub] 🟡 Running in Demo Mode (Local Simulation). Configure VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in .env for live multi-user backend.'
    );
  }
}
