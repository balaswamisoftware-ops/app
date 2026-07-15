import { useEffect } from 'react';
import { useMissionStore } from '../store/useMissionStore';

const DEFAULT_TARGET = 100000;

/**
 * Loads the devotee's personal chant mission and submits chant counts.
 *
 * Each devotee has their OWN goal — chant "Om Namah Shivaya" 1,00,000 times.
 * State is backed by a shared, offline-safe Zustand store, so the count stays in
 * sync across every screen (mala, presets, quick-chant) and survives being
 * offline via a persisted `pending` queue.
 */
export function useMission() {
  const stats = useMissionStore(s => s.stats);
  const userCount = useMissionStore(s => s.userCount);
  const communityTotal = useMissionStore(s => s.communityTotal);
  const communityTarget = useMissionStore(s => s.communityTarget);
  const pending = useMissionStore(s => s.pending);
  const loading = useMissionStore(s => s.loading);
  const submitting = useMissionStore(s => s.submitting);
  const error = useMissionStore(s => s.error);
  const load = useMissionStore(s => s.load);
  const addChants = useMissionStore(s => s.addChants);
  const tap = useMissionStore(s => s.tap);
  const flush = useMissionStore(s => s.flush);
  const clearError = useMissionStore(s => s.clearError);

  // On first use: hydrate any offline pending, load from server, then push
  // leftover pending. Deduped inside the store, so mounting many screens is safe.
  useEffect(() => {
    const store = useMissionStore.getState();
    void (async () => {
      await store.hydratePending();
      if (useMissionStore.getState().stats === null) await store.load();
      void store.flush();
    })();
  }, []);

  const target = stats?.target ?? DEFAULT_TARGET;
  const remaining = Math.max(0, target - userCount);
  const percent = target > 0 ? Math.min(100, (userCount / target) * 100) : 0;

  const communityRemaining = Math.max(0, communityTarget - communityTotal);
  const communityPercent =
    communityTarget > 0
      ? Math.min(100, (communityTotal / communityTarget) * 100)
      : 0;

  return {
    loading,
    error,
    submitting,
    refresh: load,
    clearError,
    // Personal goal (1 Lakh)
    target,
    userCount,
    remaining,
    percent,
    completed: userCount >= target,
    // Community goal (11 Crore)
    communityTotal,
    communityTarget,
    communityRemaining,
    communityPercent,
    // Offline queue
    pending,
    unsynced: pending > 0,
    donationAmount: stats?.donationAmount ?? 216,
    addChants,
    tap,
    flush,
  };
}
