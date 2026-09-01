import { getSupabaseClient } from './supabaseClient';
import { APP_VERSION, PLAY_STORE_URL } from '../config/version';
import { DEFAULT_LEVELS, ceilingOf, sanitizeLevels } from '../constants/levels';
import type { ChantLevel } from '../types/mission';

export interface AppConfig {
  /** Latest published version — below this shows an optional update prompt. */
  latestVersion: string;
  /** Minimum supported version — below this forces an update. */
  minVersion: string;
  /** Store URL the update button opens. */
  updateUrl: string;
  /** Admin broadcast banner shown on Home ('' = no banner). */
  announcement: string;
  /** When false the mission is paused and chanting is disabled. */
  missionActive: boolean;
  /** Admin cap on a single submission. `enabled: false` = devotee's choice. */
  chantLimit: {
    enabled: boolean;
    max: number;
  };
  /** AdMob config managed from the admin portal. */
  ads: {
    /** Master switch — while false the app shows no ads at all. */
    enabled: boolean;
    androidBanner: string;
    androidInterstitial: string;
    iosBanner: string;
    iosInterstitial: string;
  };
  /** Admin-managed devotional audio clip. */
  audio: {
    enabled: boolean;
    url: string;
    title: string;
  };
  /** The chant-level ladder, ascending. */
  levels: ChantLevel[];
  /** Hard ceiling — the end of the last level. No chants are accepted past it. */
  chantCeiling: number;
}

// Ads default to OFF everywhere: an unreachable backend, an older server
// without the flag, or a malformed response must never switch ads on.
const EMPTY_ADS = {
  enabled: false,
  androidBanner: '',
  androidInterstitial: '',
  iosBanner: '',
  iosInterstitial: '',
};

const EMPTY_AUDIO = { enabled: false, url: '', title: '' };

// The mission stays ACTIVE and the banner stays empty when anything goes wrong:
// a backend hiccup must never stop a devotee from chanting.
const EMPTY_NOTICE = { announcement: '', missionActive: true };

// Matches the old hardcoded behaviour, so an older server or a failed fetch
// leaves the app exactly as it was rather than silently uncapping input.
const DEFAULT_CHANT_LIMIT = { enabled: true, max: 5000 };

/**
 * Fetch the remote version config (public — works before login). Falls back to
 * a permissive "no update needed" config if the backend isn't reachable, so a
 * failed check never blocks the app.
 */
export async function fetchAppConfig(): Promise<AppConfig> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      latestVersion: APP_VERSION,
      minVersion: '0.0.0',
      updateUrl: PLAY_STORE_URL,
      ...EMPTY_NOTICE,
      chantLimit: DEFAULT_CHANT_LIMIT,
      ads: EMPTY_ADS,
      audio: EMPTY_AUDIO,
      levels: DEFAULT_LEVELS,
      chantCeiling: ceilingOf(DEFAULT_LEVELS),
    };
  }
  const { data, error } = await supabase.rpc('app_config');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Partial<AppConfig>;
  // A malformed ladder must never stop a devotee chanting, so it is repaired
  // rather than rejected; the ceiling always comes from the ladder we settled
  // on, so the two can't disagree even if the server sent an odd `chantCeiling`.
  const levels = sanitizeLevels(d.levels);
  return {
    latestVersion: d.latestVersion || APP_VERSION,
    minVersion: d.minVersion || '0.0.0',
    updateUrl: d.updateUrl || PLAY_STORE_URL,
    announcement: typeof d.announcement === 'string' ? d.announcement : '',
    // Only an explicit `false` pauses the mission; a missing field means the
    // server predates this flag and the mission is running.
    missionActive: d.missionActive !== false,
    chantLimit: {
      // Only an explicit `false` removes the cap; anything malformed keeps it.
      enabled: d.chantLimit?.enabled !== false,
      max: Math.max(1, Number(d.chantLimit?.max) || DEFAULT_CHANT_LIMIT.max),
    },
    // `enabled` is coerced explicitly so a missing/odd value can only ever
    // resolve to false, never to a truthy string.
    ads: { ...EMPTY_ADS, ...(d.ads ?? {}), enabled: d.ads?.enabled === true },
    audio: { ...EMPTY_AUDIO, ...(d.audio ?? {}), enabled: d.audio?.enabled === true },
    levels,
    chantCeiling: ceilingOf(levels),
  };
}
