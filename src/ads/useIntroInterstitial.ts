import { useEffect, useRef } from 'react';
import { NativeModules } from 'react-native';
import { AD_UNITS } from '../config/ads';
import { getInterstitialUnitId } from '../store/useAdConfigStore';

/**
 * Full-screen video interstitial shown after the splash screen on EVERY app
 * cold-start (a fresh app open). It preloads while the splash is on screen and
 * appears the moment the splash finishes.
 *
 * It only fires on a cold start (when this navigator mounts) — not when the app
 * simply returns from the background — which is exactly "after the splash".
 *
 * In debug builds it always uses Google's TEST interstitial (safe). Real revenue
 * ads are only served in release builds with a configured ad-unit id.
 */

// The AdMob native module only exists after a native rebuild. Guard on it so an
// old binary / Metro reload is a graceful no-op instead of a crash.
const ADS_AVAILABLE = Boolean(NativeModules.RNGoogleMobileAdsModule);

let InterstitialAd: any;
let AdEventType: any;
let TestIds: any;
if (ADS_AVAILABLE) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
}

/**
 * Preloads the interstitial as soon as the app mounts and shows it once `ready`
 * turns true (i.e. when the splash minimum time has elapsed). Runs every launch.
 */
export function useIntroInterstitial(ready: boolean) {
  const loadedRef = useRef(false);
  const readyRef = useRef(false);
  const shownRef = useRef(false);
  const showFnRef = useRef<() => void>(() => {});

  // Preload on mount (every cold start).
  useEffect(() => {
    if (!ADS_AVAILABLE) return;
    const unsubs: Array<() => void> = [];

    // Release builds prefer the admin-configured unit for this platform.
    const unitId = __DEV__
      ? TestIds.INTERSTITIAL
      : getInterstitialUnitId() || AD_UNITS.interstitial || TestIds.INTERSTITIAL;

    const ad = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    // Show only when BOTH the splash is done and the ad has loaded — whichever
    // happens last triggers it. Guarded so it can never show twice per launch.
    const maybeShow = () => {
      if (readyRef.current && loadedRef.current && !shownRef.current) {
        shownRef.current = true;
        try {
          ad.show();
        } catch {
          /* show can throw if not ready — ignore, it just won't appear */
        }
      }
    };
    showFnRef.current = maybeShow;

    unsubs.push(
      ad.addAdEventListener(AdEventType.LOADED, () => {
        loadedRef.current = true;
        maybeShow();
      }),
    );
    unsubs.push(
      ad.addAdEventListener(AdEventType.ERROR, () => {
        // Failed to load — just skip it this launch, never block the user.
        loadedRef.current = false;
      }),
    );

    ad.load();

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // When the splash finishes, show the ad if it's already loaded (otherwise the
  // LOADED handler above shows it as soon as it arrives).
  useEffect(() => {
    readyRef.current = ready;
    if (ready) showFnRef.current();
  }, [ready]);
}
