import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getSupabaseClient } from './supabaseClient';

/**
 * Consent-gated location sharing. The devotee opts in from the Profile screen
 * (or the one-time launch prompt); only then do we request the OS permission,
 * read the position, resolve it to a place name, and save it to their devotee
 * row (for the admin world map). They can withdraw it anytime.
 */

export interface SharedPlace {
  country: string | null;
  state: string | null;
  district: string | null;
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    {
      title: 'Share your location',
      message:
        'Sri Vidya Peetam shows where devotees are joining from on a community world map. Your location is only used for that map and you can remove it anytime.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

type Fix = { lat: number; lng: number };

function once(opts: object): Promise<Fix> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        // A provider can hand back a "success" with no usable fix. Treat that
        // as a failure so the caller falls through to the next attempt rather
        // than sending NaN to the server.
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          reject(new Error('No usable position.'));
          return;
        }
        resolve({ lat: lat as number, lng: lng as number });
      },
      err => reject(new Error(err?.message ?? 'Could not read your location.')),
      opts,
    );
  });
}

/**
 * Read the device position, robustly.
 *
 * Android very often fails the FIRST request made right after the permission
 * dialog is accepted — the location provider has no fix yet, so the request
 * simply times out. So we try three ways, cheapest first:
 *   1. any recent cached fix (instant, works indoors)
 *   2. a fresh coarse fix with a generous timeout
 *   3. a high-accuracy fix as a last resort
 * Only if all three fail do we give up.
 */
async function getPosition(): Promise<Fix> {
  const attempts = [
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
  ];
  let last: Error = new Error('Could not read your location.');
  for (const opts of attempts) {
    try {
      return await once(opts);
    } catch (e) {
      last = e instanceof Error ? e : last;
    }
  }
  throw last;
}

/**
 * Turn coordinates into country / state / district so the admin can group
 * devotees by region without re-geocoding on every page load.
 *
 * Best-effort ONLY: this is a free, key-less endpoint and it may fail or be
 * blocked. A failure must never stop the coordinates themselves being saved,
 * so every error resolves to empty names.
 */
async function reverseGeocode(lat: number, lng: number): Promise<SharedPlace> {
  const empty: SharedPlace = { country: null, state: null, district: null };
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: ctl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return empty;
    const j = (await res.json()) as Record<string, unknown>;
    const str = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : '';
      return s.length > 0 ? s : null;
    };
    return {
      country: str(j.countryName),
      // `principalSubdivision` is the state/province (e.g. "Andhra Pradesh").
      state: str(j.principalSubdivision),
      // Prefer the finer-grained locality, falling back to the city.
      district: str(j.locality) ?? str(j.city),
    };
  } catch {
    return empty;
  }
}

export const locationService = {
  /** True when location permission is already granted (no prompt shown). */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
  },

  /**
   * True when coordinates are actually STORED for this devotee.
   *
   * This is deliberately separate from `hasPermission()`: the OS permission
   * being granted says nothing about whether the save ever succeeded, and the
   * UI must key off the saved row so a failed save stays retryable.
   */
  async hasSavedLocation(): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return false;
    const { data, error } = await supabase
      .from('devotees')
      .select('latitude,longitude')
      .eq('user_id', uid)
      .maybeSingle();
    if (error || !data) return false;
    return data.latitude != null && data.longitude != null;
  },

  /**
   * True when coordinates are stored AND were resolved to a place name.
   *
   * A row can hold perfectly good coordinates with no names — it was saved by a
   * build older than reverse geocoding, or the lookup failed that once (it is
   * best-effort by design). Such a row would otherwise stay "Unknown" on the
   * admin map forever, because every path that could re-save it sees the
   * coordinates and skips. The launch prompt uses this to re-save silently.
   */
  async hasResolvedLocation(): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return false;
    const { data, error } = await supabase
      .from('devotees')
      .select('latitude,longitude,country')
      .eq('user_id', uid)
      .maybeSingle();
    if (error || !data) return false;
    return (
      data.latitude != null &&
      data.longitude != null &&
      typeof data.country === 'string' &&
      data.country.trim().length > 0
    );
  },

  /**
   * Ask permission, read the position, resolve the place, save it.
   * Returns false only when the devotee DECLINED permission; every other
   * failure throws so the caller can show it and offer a retry.
   */
  async shareLocation(): Promise<boolean> {
    const granted = await requestPermission();
    if (!granted) return false;
    const { lat, lng } = await getPosition();
    const place = await reverseGeocode(lat, lng);
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Not connected.');
    const { error } = await supabase.rpc('save_my_location', {
      lat,
      lng,
      p_country: place.country,
      p_state: place.state,
      p_district: place.district,
    });
    if (error) throw new Error(error.message);
    return true;
  },

  /** Withdraw the shared location (right to delete). */
  async clearLocation(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.rpc('clear_my_location');
    if (error) throw new Error(error.message);
  },
};
