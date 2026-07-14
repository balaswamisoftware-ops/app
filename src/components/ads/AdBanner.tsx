import React from 'react';
import { NativeModules, View } from 'react-native';
import { AD_UNITS } from '../../config/ads';
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
  className?: string;
}

/**
 * An adaptive AdMob banner. Renders nothing if the native module isn't present
 * (i.e. before a rebuild) or if ads aren't configured yet.
 */
export function AdBanner({ unitId, className }: AdBannerProps) {
  if (!ADS_AVAILABLE) return null;

  // Debug builds ALWAYS use Google test ads (safe to view/click). Real ad units
  // are only used in production/release builds.
  const id = __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : unitId || AD_UNITS.banner || TestIds.ADAPTIVE_BANNER;

  return (
    <View className={cn('items-center border-t border-gray-100 bg-white', className)}>
      <BannerAd
        unitId={id}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
