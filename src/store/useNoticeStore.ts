import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage key holding the announcement text the devotee last dismissed. */
const DISMISSED_KEY = 'notice/dismissed';

export interface NoticeConfig {
  /** Admin broadcast banner text ('' = nothing to show). */
  announcement: string;
  /** When false the mission is paused — chanting is disabled app-wide. */
  missionActive: boolean;
}

interface NoticeState extends NoticeConfig {
  /** Announcement text the devotee dismissed, so it isn't shown again. */
  dismissed: string;
  setNotice: (cfg: Partial<NoticeConfig>) => void;
  /** Hide the current announcement (persisted, keyed by its text). */
  dismiss: () => Promise<void>;
  /** Load the dismissed marker at launch. */
  hydrate: () => Promise<void>;
}

/**
 * Admin-managed announcement + mission pause switch, delivered by `app_config()`
 * at launch. Both default to "nothing to say, mission running", so an
 * unreachable backend can never silence chanting.
 *
 * Dismissal is keyed by the announcement TEXT rather than a flag: publishing a
 * new announcement shows it again, while the one already read stays hidden.
 */
export const useNoticeStore = create<NoticeState>((set, get) => ({
  announcement: '',
  missionActive: true,
  dismissed: '',

  setNotice: cfg => set(cfg),

  dismiss: async () => {
    const current = get().announcement;
    set({ dismissed: current });
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, current);
    } catch {
      /* dismissal just won't survive a restart */
    }
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(DISMISSED_KEY);
      if (saved) set({ dismissed: saved });
    } catch {
      /* start with nothing dismissed */
    }
  },
}));

/** True when there is an announcement the devotee hasn't dismissed yet. */
export function useVisibleAnnouncement(): string | null {
  const announcement = useNoticeStore(s => s.announcement).trim();
  const dismissed = useNoticeStore(s => s.dismissed);
  if (!announcement || announcement === dismissed) return null;
  return announcement;
}
