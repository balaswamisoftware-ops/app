import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * AdMob configuration fetched from the server (managed in the admin portal), so
 * ads can be switched on/off and re-pointed without shipping a new build.
 *
 * NOTE: the AdMob *App ID* is a native manifest value (app.json) and cannot be
 * changed at runtime — only these unit IDs are server-driven.
 */
export interface AdUnits {
  /**
   * Master switch. While false NO ad is rendered or even loaded anywhere in the
   * app. Defaults to false so we fail *closed*: until the server explicitly
   * says ads are on (and until the config request succeeds at all), devotees
   * see a completely ad-free app.
   */
  enabled: boolean;
  androidBanner: string;
  androidInterstitial: string;
  iosBanner: string;
  iosInterstitial: string;
}

interface AdConfigState extends AdUnits {
  setUnits: (units: Partial<AdUnits>) => void;
}

export const useAdConfigStore = create<AdConfigState>(set => ({
  enabled: false,
  androidBanner: '',
  androidInterstitial: '',
  iosBanner: '',
  iosInterstitial: '',
  setUnits: units => set(units),
}));

/** True only when the admin has switched ads on. */
export function areAdsEnabled(): boolean {
  return useAdConfigStore.getState().enabled;
}

/** Banner unit for the current platform ('' when not configured). */
export function getBannerUnitId(): string {
  const s = useAdConfigStore.getState();
  return Platform.OS === 'ios' ? s.iosBanner : s.androidBanner;
}

/** Interstitial unit for the current platform ('' when not configured). */
export function getInterstitialUnitId(): string {
  const s = useAdConfigStore.getState();
  return Platform.OS === 'ios' ? s.iosInterstitial : s.androidInterstitial;
}
