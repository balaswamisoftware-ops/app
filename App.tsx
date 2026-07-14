/**
 * Sri Vidyapitam App
 *
 * @format
 */

import './global.css';
import { useEffect } from 'react';
import { AppState, NativeModules, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { getSupabaseClient } from './src/services/supabaseClient';

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
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
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
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
