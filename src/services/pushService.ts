import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabaseClient } from './supabaseClient';
import { APP_VERSION } from '../config/version';

/** AsyncStorage key holding the FCM token we last registered with the backend. */
const TOKEN_KEY = 'push/token';

type MessagingFn = () => {
  requestPermission: () => Promise<number>;
  getToken: () => Promise<string>;
  deleteToken: () => Promise<void>;
  onTokenRefresh: (cb: (token: string) => void) => () => void;
  onMessage: (cb: (msg: unknown) => void) => () => void;
};

/**
 * Firebase Messaging, or null when this binary has no Firebase linked.
 *
 * Same guard as the ads module: server-driven features must never crash an
 * older build that predates the native dependency, so every call site treats a
 * missing module as "push simply isn't available here".
 */
function messagingModule(): MessagingFn | null {
  if (!NativeModules.RNFBMessagingModule) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-firebase/messaging').default as MessagingFn;
  } catch {
    return null;
  }
}

/** True when this build can receive push notifications at all. */
export function isPushSupported(): boolean {
  return messagingModule() !== null;
}

/**
 * Android 13+ needs a runtime POST_NOTIFICATIONS grant; earlier versions grant
 * it at install time. iOS permission is handled by Firebase itself.
 */
async function ensurePermission(messaging: MessagingFn): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
    }
    return true;
  }
  // iOS: 1 = AUTHORIZED, 2 = PROVISIONAL; 0 = DENIED.
  const status = await messaging().requestPermission();
  return status === 1 || status === 2;
}

/**
 * Register this device for admin broadcasts.
 *
 * Safe to call on every launch: `register_device_token` upserts on the token,
 * so re-registering just refreshes `updated_at` and re-points a handset that
 * changed hands to the devotee now signed in.
 *
 * Returns the token, or null when push is unavailable / not permitted — never
 * throws, because a failed registration must not block using the app.
 */
export async function registerForPush(): Promise<string | null> {
  const messaging = messagingModule();
  if (!messaging) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    if (!(await ensurePermission(messaging))) return null;

    const token = await messaging().getToken();
    if (!token) return null;

    const { error } = await supabase.rpc('register_device_token', {
      p_token: token,
      p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
      p_app_version: APP_VERSION,
    });
    if (error) return null;

    await AsyncStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

/**
 * Drop this device's registration. Called on logout and before account
 * deletion, so a shared handset stops receiving the previous devotee's
 * notifications.
 */
export async function unregisterFromPush(): Promise<void> {
  const supabase = getSupabaseClient();
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && supabase) {
      // Best effort — the row also disappears when the auth user is deleted.
      await supabase.rpc('unregister_device_token', { p_token: token });
    }
    await AsyncStorage.removeItem(TOKEN_KEY);

    // Force a new token next time, so the next devotee on this handset can't
    // inherit the previous one's registration.
    const messaging = messagingModule();
    if (messaging) await messaging().deleteToken();
  } catch {
    /* logout must never fail because of push cleanup */
  }
}

/**
 * Re-register whenever FCM rotates the token. Returns an unsubscribe function,
 * or a no-op when push isn't available.
 */
export function onPushTokenRefresh(): () => void {
  const messaging = messagingModule();
  if (!messaging) return () => {};
  try {
    return messaging().onTokenRefresh(() => {
      void registerForPush();
    });
  } catch {
    return () => {};
  }
}
