import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Download } from 'lucide-react-native';

import { SplashScreen } from '../screens/SplashScreen';
import { UpdateRequiredScreen } from '../screens/UpdateRequiredScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { Dialog } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useIntroInterstitial } from '../ads/useIntroInterstitial';

/** Minimum time the splash screen is shown on every launch (ms). */
const SPLASH_MIN_MS = 5000;

/**
 * Top-level navigator. Restores the persisted session on launch and gates the
 * app:
 *   loading         -> Splash screen
 *   authenticated   -> App (bottom tabs)
 *   unauthenticated -> Auth (login / sign up)
 */
export function RootNavigator() {
  const { status, hydrate } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const update = useAppUpdate();

  // Show the one-time full-screen intro ad once the splash finishes and the
  // session is resolved. Preloads during the splash; no-op after first launch.
  const splashDone = minTimePassed && status !== 'loading';
  useIntroInterstitial(splashDone);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Always show the splash for at least SPLASH_MIN_MS on every app start.
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  if (status === 'loading' || !minTimePassed) {
    return <SplashScreen />;
  }

  // A version below the server minimum blocks the app entirely.
  if (update.status === 'required') {
    return (
      <UpdateRequiredScreen
        updateUrl={update.updateUrl}
        latestVersion={update.latestVersion}
        currentVersion={update.currentVersion}
      />
    );
  }

  return (
    <>
      <NavigationContainer>
        {status === 'authenticated' ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>

      {/* Optional "update available" prompt — dismissible for this session. */}
      <Dialog
        visible={update.status === 'optional'}
        onClose={update.dismiss}
        icon={Download}
        title="Update available"
        message={`A new version (${update.latestVersion}) of Sri Vidya Peetham is available. Update for the latest features.`}
        actions={[
          {
            label: 'Update now',
            onPress: () => Linking.openURL(update.updateUrl).catch(() => {}),
          },
          { label: 'Later' },
        ]}
      />
    </>
  );
}

// Re-export param lists for screen prop typing.
export type { AppTabParamList } from './AppNavigator';
export type { AuthStackParamList } from './AuthNavigator';
