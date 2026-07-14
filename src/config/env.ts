/**
 * Backend configuration.
 *
 * React Native does not load a `.env` at runtime out of the box. The cleanest
 * options are `react-native-config` or inlining via Babel. For now, drop your
 * Supabase project credentials here (or wire them to your env tooling).
 *
 * While these are empty, the app automatically uses a local mock backend
 * (AsyncStorage) so the full auth flow works end-to-end during development.
 * As soon as you fill them in, the Supabase-backed services take over — no
 * other code changes needed.
 */

// Supabase project URL + PUBLISHABLE (anon) key. The publishable key is safe to
// ship in client apps. NEVER put the secret key here — it belongs only in a
// trusted server / Edge Function.
export const SUPABASE_URL = 'https://rtvajgoixrwnwtrlhzcn.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_9n4ej6ZDVqS8WpT4lLL7Ig_l-YnmTlQ';

/** Table that stores devotee profiles (shared with the admin portal). */
export const DEVOTEES_TABLE = 'devotees';

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
