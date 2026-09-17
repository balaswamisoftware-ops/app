/**
 * Sri Vidyapitam App
 *
 * @format
 */

import './global.css';
import { useEffect } from 'react';
import { AppState, NativeModules, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { getSupabaseClient } from './src/services/supabaseClient';
import { refreshRemoteConfig } from './src/services/refreshRemoteConfig';
import { useMissionStore } from './src/store/useMissionStore';
import { useGroupStore } from './src/store/useGroupStore';

// Initialize AdMob once, guarded so it's a no-op until the native rebuild.
function initAds() {
  try {
    if (NativeModules.RNGoogleMobileAdsModule) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-native-google-mobile-ads').default().initialize();
    }
  } catch {
    /* ads unavailable — ignore */
  }
}

function App() {
  useEffect(() => {
    initAds();
  }, []);

  // Keep the auth session token fresh while the app is foregrounded, so
  // authenticated calls (DB, Storage RLS) never fail with a stale token.
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        // Retry syncing any chants counted while offline.
        void useMissionStore.getState().flush();
        // Same for chants a group leader recorded offline, and pick up a
        // devotee-admin role granted (or suspended) by a portal admin meanwhile.
        void useGroupStore.getState().flush();
        void useGroupStore.getState().loadStatus();
        // Re-pull admin settings (chant cap, mission pause, announcement, ads,
        // audio) so changes reflect on reopen — no full app restart needed.
        void refreshRemoteConfig();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <SafeAreaProvider>
      {/* Dark status-bar icons across the app. NO `backgroundColor` prop, even
          "transparent": RN forwards any value to Window.setStatusBarColor(),
          which is deprecated from API 35 and is what Play's edge-to-edge notice
          flags. On Android 15+ the bar is transparent and content draws behind
          it anyway (SafeAreaProvider handles the insets). */}
      <StatusBar barStyle="dark-content" translucent />
      {/* Cap the app to a phone-width column and centre it — on both phones and
          tablets — so a landscape tablet shows a centred column (Swiggy-style)
          instead of stretching full-width. */}
      <View style={styles.backdrop}>
        <View style={styles.appFrame}>
          <RootNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

/** Max content width (dp). Phones are narrower, so they stay full-width; only
 *  tablets get letterboxed to this phone-like column. */
const PHONE_MAX_WIDTH = 480;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_MAX_WIDTH,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
