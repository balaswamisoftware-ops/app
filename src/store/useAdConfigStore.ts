import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * AdMob ad-unit IDs fetched from the server (managed in the admin portal), so
 * they can be changed without shipping a new build.
 *
 * NOTE: the AdMob *App ID* is a native manifest value (app.json) and cannot be
 * changed at runtime — only these unit IDs are server-driven.
 */
export interface AdUnits {
  androidBanner: string;
  androidInterstitial: string;
  iosBanner: string;
  iosInterstitial: string;
}

interface AdConfigState extends AdUnits {
  setUnits: (units: Partial<AdUnits>) => void;
}

export const useAdConfigStore = create<AdConfigState>(set => ({
  androidBanner: '',
  androidInterstitial: '',
  iosBanner: '',
  iosInterstitial: '',
  setUnits: units => set(units),
}));

/** Banner unit for the current platform ('' when not configured -> test ad). */
export function getBannerUnitId(): string {
  const s = useAdConfigStore.getState();
  return Platform.OS === 'ios' ? s.iosBanner : s.androidBanner;
}

/** Interstitial unit for the current platform ('' when not configured). */
export function getInterstitialUnitId(): string {
  const s = useAdConfigStore.getState();
  return Platform.OS === 'ios' ? s.iosInterstitial : s.androidInterstitial;
}
