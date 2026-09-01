import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getSupabaseClient } from './supabaseClient';

/**
 * Consent-gated location sharing. The devotee opts in from the Profile screen;
 * only then do we request the OS permission, read the position, and save it to
 * their devotee row (for the admin world map). They can withdraw it anytime.
 */

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

function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(err?.message ?? 'Could not read your location.')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export const locationService = {
  /** True when location permission is already granted (no prompt shown). */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    return PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
  },

  /** Ask permission, read the position, save it. Returns false if declined. */
  async shareLocation(): Promise<boolean> {
    const granted = await requestPermission();
    if (!granted) return false;
    const { lat, lng } = await getPosition();
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Not connected.');
    const { error } = await supabase.rpc('save_my_location', { lat, lng });
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
