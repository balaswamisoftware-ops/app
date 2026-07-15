import { getSupabaseClient } from './supabaseClient';
import { APP_VERSION, PLAY_STORE_URL } from '../config/version';

export interface AppConfig {
  /** Latest published version — below this shows an optional update prompt. */
  latestVersion: string;
  /** Minimum supported version — below this forces an update. */
  minVersion: string;
  /** Store URL the update button opens. */
  updateUrl: string;
}

/**
 * Fetch the remote version config (public — works before login). Falls back to
 * a permissive "no update needed" config if the backend isn't reachable, so a
 * failed check never blocks the app.
 */
export async function fetchAppConfig(): Promise<AppConfig> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { latestVersion: APP_VERSION, minVersion: '0.0.0', updateUrl: PLAY_STORE_URL };
  }
  const { data, error } = await supabase.rpc('app_config');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Partial<AppConfig>;
  return {
    latestVersion: d.latestVersion || APP_VERSION,
    minVersion: d.minVersion || '0.0.0',
    updateUrl: d.updateUrl || PLAY_STORE_URL,
  };
}
