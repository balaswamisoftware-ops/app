import React from 'react';
import { NativeModules, Platform, View } from 'react-native';
import { AD_UNITS } from '../../config/ads';
import { useAdConfigStore } from '../../store/useAdConfigStore';
import { cn } from '../ui/cn';

// The AdMob native module only exists after a native rebuild. Guard on it so a
// plain Metro reload (old binary) renders nothing instead of crashing.
const ADS_AVAILABLE = Boolean(NativeModules.RNGoogleMobileAdsModule);

let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;
if (ADS_AVAILABLE) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

export interface AdBannerProps {
  /** Override the ad-unit id; defaults to config (or a test id). */
  unitId?: string;
  /**
   * 'anchored' (default) → full-width adaptive banner.
   * 'square'  → 300×250 medium rectangle (AdMob's closest to a 1:1 square;
   *             there is no exact 1:1 banner size).
   */
  size?: 'anchored' | 'square';
  className?: string;
}

/**
 * An AdMob banner. Renders nothing — and loads nothing — when the native module
 * isn't present (i.e. before a rebuild), when the admin has ads switched off,
 * or when no ad-unit id is configured for this platform.
 */
export function AdBanner({ unitId, size = 'anchored', className }: AdBannerProps) {
  // Master switch + admin-managed unit id for this platform.
  const enabled = useAdConfigStore(s => s.enabled);
  const remoteBanner = useAdConfigStore(s =>
    Platform.OS === 'ios' ? s.iosBanner : s.androidBanner,
  );

  if (!ADS_AVAILABLE) return null;
  // Admin switch is off (or the config hasn't loaded yet) — show no ad at all.
  if (!enabled) return null;

  const square = size === 'square';

  // Debug builds ALWAYS use Google test ads (safe to view/click). Release builds
  // use the admin-configured unit, falling back to the local config.
  const id = __DEV__
    ? square
      ? TestIds.MEDIUM_RECTANGLE ?? TestIds.ADAPTIVE_BANNER
      : TestIds.ADAPTIVE_BANNER
    : unitId || remoteBanner || AD_UNITS.banner;

  // Ads are on but no real unit id was configured — skip silently rather than
  // rendering an empty box or falling back to a test ad in production.
  if (!id) return null;

  return (
    <View className={cn('items-center justify-center bg-white', className)}>
      <BannerAd
        unitId={id}
        size={
          square
            ? BannerAdSize.MEDIUM_RECTANGLE
            : BannerAdSize.ANCHORED_ADAPTIVE_BANNER
        }
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
