import { useEffect } from 'react';

import { useAuthStore } from '../store/useAuthStore';
import { onPushTokenRefresh, registerForPush } from '../services/pushService';

/**
 * Keeps this device registered for admin broadcasts while a devotee is signed
 * in.
 *
 * Registration is deliberately tied to auth rather than to app launch: a token
 * belongs to a devotee, and `device_tokens` rows are read back by segment, so
 * registering before login would attribute the handset to nobody. Unregistering
 * happens in `useAuthStore.logout`, which is the only path out of a session.
 */
export function usePushRegistration() {
  const status = useAuthStore(s => s.status);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void registerForPush();
    // FCM can rotate the token at any time; re-register when it does.
    return onPushTokenRefresh();
  }, [status]);
}
