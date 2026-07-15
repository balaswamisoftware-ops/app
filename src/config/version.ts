/**
 * App version shown to users and used for the update gate.
 *
 * IMPORTANT: bump this on every release, in sync with the native version:
 *   - android/app/build.gradle  → versionName (and versionCode)
 *   - ios build settings         → CFBundleShortVersionString
 * Then raise `latest_version` (and `min_version` for a forced update) in the
 * Supabase `settings` row so existing users get prompted to update.
 */
export const APP_VERSION = '1.0.0';

/** Where the update button sends users when no URL is configured server-side. */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.srividyapitam';

/**
 * Compare two dot-separated versions (e.g. "1.2.0" vs "1.10").
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Missing parts count as 0.
 */
export function compareVersions(a: string, b: string): number {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}
