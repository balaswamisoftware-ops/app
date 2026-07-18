import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { missionService } from '../services/missionService';
import type { MissionStats } from '../types/mission';
import { MAX_CHANTS_PER_ADD, PENDING_CHANTS_KEY } from '../constants/mission';

const DEFAULT_COMMUNITY_TARGET = 110000000; // 11 Crore

/**
 * Shared mission state with an OFFLINE-SAFE, optimistic counter.
 *
 * Every chant (a mala tap, a preset, a custom count) is applied to the on-screen
 * total instantly and added to a persisted `pending` bucket. A background
 * `flush()` pushes `pending` to the server in chunks. If the device is offline
 * the chants stay in `pending` (persisted to AsyncStorage) and are retried on
 * the next flush — on reconnect, on app foreground, or on the next add. Nothing
 * is ever lost, and rapid tapping never floods the network.
 */
interface MissionStoreState {
  stats: MissionStats | null;
  userCount: number;
  communityTotal: number;
  communityTarget: number;
  /** Chants counted locally but not yet confirmed by the server. */
  pending: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  hydratePending: () => Promise<void>;
  load: () => Promise<void>;
  /** Optimistically add `n` chants (used by presets / custom / mala). */
  addChants: (n: number) => Promise<void>;
  /** Apply `n` locally without an immediate flush (used for rapid mala taps). */
  tap: (n?: number) => void;
  /** Push any pending chants to the server; safe to call anytime. */
  flush: () => Promise<void>;
  clearError: () => void;
}

let inflight = false; // dedupe concurrent load()
let flushing = false; // dedupe concurrent flush()
let hydrated = false; // hydrate pending from storage once

function persistPending(n: number) {
  void AsyncStorage.setItem(PENDING_CHANTS_KEY, String(Math.max(0, n)));
}

export const useMissionStore = create<MissionStoreState>((set, get) => ({
  stats: null,
  userCount: 0,
  communityTotal: 0,
  communityTarget: DEFAULT_COMMUNITY_TARGET,
  pending: 0,
  loading: true,
  submitting: false,
  error: null,

  hydratePending: async () => {
    if (hydrated) return;
    hydrated = true;
    const raw = await AsyncStorage.getItem(PENDING_CHANTS_KEY);
    const stored = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(stored) && stored > 0) {
      set(s => ({ pending: s.pending + stored }));
    }
  },

  load: async () => {
    if (inflight) return;
    inflight = true;
    set({ error: null, loading: true });
    try {
      const s = await missionService.getStats();
      if (flushing) {
        // A flush is moving pending chants onto the server RIGHT NOW, so the
        // server total and local `pending` are momentarily inconsistent —
        // combining them would double-count (the "+33" bug). Trust the
        // optimistic local total and only refresh the static fields.
        set({ stats: s, communityTarget: s.communityTarget, loading: false });
      } else {
        // The server total does not yet include locally-pending chants, so add
        // them back so the on-screen numbers never appear to "drop".
        const pending = get().pending;
        set({
          stats: s,
          userCount: s.userCount + pending,
          communityTotal: s.communityTotal + pending,
          communityTarget: s.communityTarget,
          loading: false,
        });
      }
    } catch {
      set({
        error: 'Could not load the mission. Pull down to refresh.',
        loading: false,
      });
    } finally {
      inflight = false;
    }
  },

  tap: (n = 1) => {
    if (!Number.isFinite(n) || n <= 0) return;
    const k = Math.floor(n);
    set(s => ({
      userCount: s.userCount + k,
      communityTotal: s.communityTotal + k,
      pending: s.pending + k,
    }));
    persistPending(get().pending);
  },

  addChants: async (n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    const k = Math.floor(n);
    if (k > MAX_CHANTS_PER_ADD) {
      // Hard validation cap (not a network issue) — surface it.
      set({ error: `You can add at most ${MAX_CHANTS_PER_ADD} chants at a time.` });
      throw new Error('over_max');
    }
    get().tap(k); // optimistic + persisted
    void get().flush(); // sync in the background (queues if offline)
  },

  flush: async () => {
    if (flushing) return;
    if (get().pending <= 0) return;
    flushing = true;
    set({ submitting: true, error: null });
    try {
      // Push in chunks so a single call never exceeds the per-request cap.
      while (get().pending > 0) {
        const chunk = Math.min(get().pending, MAX_CHANTS_PER_ADD);
        try {
          await missionService.addChants(chunk);
        } catch {
          // Offline / transient failure — keep the pending chants for a later
          // retry. No error shown; the count is safe locally.
          break;
        }
        set(s => ({ pending: Math.max(0, s.pending - chunk) }));
        persistPending(get().pending);
      }
    } finally {
      flushing = false;
      set({ submitting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
