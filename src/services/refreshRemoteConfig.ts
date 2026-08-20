import { fetchAppConfig, type AppConfig } from './appConfigService';
import { useAdConfigStore } from '../store/useAdConfigStore';
import { useAudioStore } from '../store/useAudioStore';
import { useNoticeStore } from '../store/useNoticeStore';
import { useChantLimitStore } from '../store/useChantLimitStore';

/**
 * Push a fetched app config into every server-driven store (ads, audio, the
 * announcement / mission-pause notice, and the per-submission chant cap). This
 * is what makes an admin change actually appear in the running app.
 */
export function publishRemoteConfig(cfg: AppConfig): void {
  useAdConfigStore.getState().setUnits(cfg.ads);
  useAudioStore.getState().setAudio(cfg.audio);
  useNoticeStore.getState().setNotice({
    announcement: cfg.announcement,
    missionActive: cfg.missionActive,
  });
  useChantLimitStore.getState().setLimit(cfg.chantLimit);
}

/**
 * Fetch the latest config and publish it to the stores. Safe to call any time
 * (e.g. when the app returns to the foreground) so admin settings reflect
 * within seconds without a full cold restart. Never throws — a failed refresh
 * simply leaves the last-known config in place.
 */
export async function refreshRemoteConfig(): Promise<AppConfig | null> {
  try {
    const cfg = await fetchAppConfig();
    publishRemoteConfig(cfg);
    return cfg;
  } catch {
    return null;
  }
}
