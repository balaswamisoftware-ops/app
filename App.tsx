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
import { useMissionStore } from './src/store/useMissionStore';

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
      {/* White status bar with dark icons across the whole app. */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
