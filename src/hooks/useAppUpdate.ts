import { useEffect, useState } from 'react';
import { fetchAppConfig } from '../services/appConfigService';
import { APP_VERSION, PLAY_STORE_URL, compareVersions } from '../config/version';
import { useAdConfigStore } from '../store/useAdConfigStore';

export type UpdateStatus = 'checking' | 'ok' | 'optional' | 'required';

/**
 * Checks the installed app version against the server config on launch.
 *   - below min_version    -> 'required' (block the app until updated)
 *   - below latest_version -> 'optional' (dismissible prompt)
 *   - otherwise            -> 'ok'
 * A failed check resolves to 'ok' so it never blocks usage.
 */
export function useAppUpdate() {
  const [status, setStatus] = useState<UpdateStatus>('checking');
  const [latestVersion, setLatestVersion] = useState(APP_VERSION);
  const [updateUrl, setUpdateUrl] = useState(PLAY_STORE_URL);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchAppConfig();
        if (cancelled) return;
        // Publish the admin-managed AdMob unit IDs to the ad store.
        useAdConfigStore.getState().setUnits(cfg.ads);
        setLatestVersion(cfg.latestVersion);
        setUpdateUrl(cfg.updateUrl);
        if (compareVersions(APP_VERSION, cfg.minVersion) < 0) setStatus('required');
        else if (compareVersions(APP_VERSION, cfg.latestVersion) < 0) setStatus('optional');
        else setStatus('ok');
      } catch {
        if (!cancelled) setStatus('ok'); // never block on a failed check
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    // A dismissed optional prompt behaves like 'ok' for the rest of the session.
    status: dismissed && status === 'optional' ? 'ok' : status,
    latestVersion,
    updateUrl,
    currentVersion: APP_VERSION,
    dismiss: () => setDismissed(true),
  };
}
