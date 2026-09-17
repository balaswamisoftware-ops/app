import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION } from '../config/version';
import { locationService } from '../services/locationService';

/** Remembers the app version whose location question is already settled. */
const KEY = '@sv/location-prompt-version';

/**
 * Ask for location permission ONCE per app version — i.e. once when the devotee
 * first enters the app after an update.
 *
 * We mark the version as settled only when the question is genuinely answered:
 * either the location was SAVED, or the devotee DECLINED. A technical failure
 * (no GPS fix yet, offline, RPC error) deliberately leaves it unmarked so the
 * next launch tries again — previously the version was recorded *before* the
 * attempt, so a single failure meant the devotee's location was never captured
 * for that entire release with nothing to indicate it.
 *
 * Retrying is silent: `shareLocation` only throws once permission is already
 * granted, so a retry never re-shows the OS dialog.
 */
export function useLocationPrompt() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settled = await AsyncStorage.getItem(KEY);
        if (settled === APP_VERSION) return;
        if (cancelled) return;

        // Already stored AND named — nothing left to do. Checking the resolved
        // form (not just coordinates) lets a row saved without place names heal
        // itself: permission is already granted, so this re-save is silent.
        if (await locationService.hasResolvedLocation()) {
          await AsyncStorage.setItem(KEY, APP_VERSION);
          return;
        }
        if (cancelled) return;

        // Saved, or explicitly declined — either way the question is answered.
        await locationService.shareLocation();
        await AsyncStorage.setItem(KEY, APP_VERSION);
      } catch {
        // Technical failure: leave the version unmarked so we retry next launch.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
