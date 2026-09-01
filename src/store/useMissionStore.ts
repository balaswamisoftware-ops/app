import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { missionService } from '../services/missionService';
import type { MissionStats } from '../types/mission';
import { PENDING_CHANTS_KEY, PENDING_INFLIGHT_KEY } from '../constants/mission';
import { effectiveChantMax, inputChantMax } from './useChantLimitStore';
import { chantCeiling, useChantLevelStore } from './useChantLevelStore';
import { formatNumber } from '../utils/format';

const DEFAULT_COMMUNITY_TARGET = 110000000; // 11 Crore

/** RFC4122-ish v4 id — an idempotency key for one flush chunk. */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** The chunk currently mid-flush, persisted so a retry reuses the same txnId. */
interface Inflight {
  txnId: string;
  chunk: number;
}
async function readInflight(): Promise<Inflight | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_INFLIGHT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Inflight;
    return v && typeof v.txnId === 'string' && v.chunk > 0 ? v : null;
  } catch {
    return null;
  }
}
async function writeInflight(v: Inflight): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INFLIGHT_KEY, JSON.stringify(v));
  } catch {
    /* best effort */
  }
}
async function clearInflight(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_INFLIGHT_KEY);
  } catch {
    /* best effort */
  }
}

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
  /** Wipe all mission state + the pending queue (call on logout / account switch). */
  reset: () => void;
}

let inflight = false; // dedupe concurrent load()
let flushing = false; // dedupe concurrent flush()
let hydrated = false; // hydrate pending from storage once
let flushEpoch = 0; // bumped whenever a flush commits a chunk (load()-vs-flush race guard)

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
    const epochBefore = flushEpoch;
    try {
      const s = await missionService.getStats();
      // `mission_stats` repeats the ladder so the very first load already knows
      // the ceiling, without waiting for the separate app_config fetch.
      useChantLevelStore.getState().setLevels(s.levels);
      if (flushing || flushEpoch !== epochBefore) {
        // A flush is moving pending chants onto the server RIGHT NOW (or one
        // completed WHILE this getStats was in flight), so the server snapshot
        // and local `pending` are momentarily inconsistent — combining them
        // would double-count (the "+33" bug) or, if the flush already landed,
        // drop the count downward. Trust the optimistic local total and only
        // refresh the static fields.
        set({ stats: s, communityTarget: s.communityTarget, loading: false });
      } else {
        // The server total does not yet include locally-pending chants, so add
        // them back so the on-screen numbers never appear to "drop". Clamped to
        // the ceiling: pending chants queued past it will be refused, and the
        // next flush corrects the total anyway — no reason to show it too high
        // in the meantime. (The community total is a sum over every devotee, so
        // a personal ceiling says nothing about it.)
        const pending = get().pending;
        set({
          stats: s,
          userCount: Math.min(s.userCount + pending, s.ceiling),
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
    // Never count past the ceiling: the server would refuse the surplus anyway,
    // and an over-count here would leave the on-screen total above what the
    // server will ever confirm.
    const room = Math.max(0, chantCeiling() - get().userCount);
    const k = Math.min(Math.floor(n), room);
    if (k <= 0) return;
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
    // The cap is admin-configured; null means the devotee may enter any amount.
    const cap = inputChantMax();
    if (cap !== null && k > cap) {
      // Hard validation cap (not a network issue) — surface it.
      set({ error: `You can add at most ${cap.toLocaleString('en-IN')} chants at a time.` });
      throw new Error('over_max');
    }
    const ceiling = chantCeiling();
    if (get().userCount >= ceiling) {
      set({
        error: `You have completed all ${formatNumber(ceiling)} chants. Hara Hara Mahadeva!`,
      });
      throw new Error('at_ceiling');
    }
    // Anything over the remaining room is dropped silently — the screens already
    // cap what can be entered, and `flush()` reports the ceiling from the
    // server's own answer rather than guessing here.
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
      // The chunk follows the ADMIN cap, not just the transport ceiling: the
      // server rejects anything larger, and beads tapped on the mala are
      // legitimate counts that must still all get through — just in more,
      // smaller requests.
      while (get().pending > 0) {
        // Resume a chunk that was mid-flight (its response may have been lost, or
        // the app was killed) so the retry reuses the SAME idempotency key and
        // the server applies it at most once. Otherwise start a fresh chunk.
        let job = await readInflight();
        if (!job || job.chunk > get().pending) {
          job = { txnId: uuidv4(), chunk: Math.min(get().pending, effectiveChantMax()) };
          await writeInflight(job);
        }
        let res;
        try {
          res = await missionService.addChants(job.chunk, job.txnId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          // A server cap / paused-mission / validation rejection is PERMANENT —
          // retrying the same chunk will always fail, so surface it and stop
          // rather than looping forever with a silent "…will sync". Anything
          // else (offline / timeout / 5xx) is transient: keep the in-flight
          // chunk so the next retry reuses its txnId.
          if (/at most|too large|invalid|paused|not allowed/i.test(msg)) {
            set({ error: msg || 'Some chants could not be saved.' });
          }
          break;
        }
        // Committed (or idempotently confirmed already-applied) — clear it.
        await clearInflight();
        set(s => ({ pending: Math.max(0, s.pending - job.chunk) }));
        persistPending(get().pending);
        flushEpoch++; // a chunk committed on the server

        if (res.capped) {
          // The ceiling clipped this chunk, so it will refuse every chunk after
          // it too. Retrying would spin forever on counts that can never land —
          // instead trust the server's totals and drop what is left in the
          // queue, then tell the devotee why the number stopped moving.
          set({
            userCount: res.userCount,
            communityTotal: res.communityTotal,
            pending: 0,
            error: `You have completed all ${formatNumber(
              res.ceiling,
            )} chants. Hara Hara Mahadeva!`,
          });
          persistPending(0);
          break;
        }
      }
    } finally {
      flushing = false;
      set({ submitting: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => {
    // Called on logout / account switch so one devotee's optimistic total and
    // offline queue can never bleed into the next devotee on a shared phone.
    hydrated = false;
    inflight = false;
    flushing = false;
    void AsyncStorage.removeItem(PENDING_CHANTS_KEY);
    void clearInflight();
    set({
      stats: null,
      userCount: 0,
      communityTotal: 0,
      communityTarget: DEFAULT_COMMUNITY_TARGET,
      pending: 0,
      loading: true,
      submitting: false,
      error: null,
    });
  },
}));
