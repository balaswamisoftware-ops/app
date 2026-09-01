import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from '../config/version';
import { locationService } from '../services/locationService';

/** Remembers the app version we last auto-asked for location at. */
const KEY = '@sv/location-prompt-version';

/**
 * Ask for location permission ONCE per app version — i.e. once when the devotee
 * first enters the app after an update. We record the version BEFORE prompting,
 * so a decline (or an interrupted run) is never re-prompted for that version.
 *
 * If permission is already granted this quietly refreshes the saved location
 * (no dialog); if the OS has "don't ask again", the request returns silently.
 * Either way, the devotee can always opt in later from Profile → Community Map.
 */
export function useLocationPrompt() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asked = await AsyncStorage.getItem(KEY);
        if (asked === APP_VERSION) return; // already handled for this version
        await AsyncStorage.setItem(KEY, APP_VERSION);
        if (cancelled) return;
        await locationService.shareLocation();
      } catch {
        /* never block the app on the location prompt */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
