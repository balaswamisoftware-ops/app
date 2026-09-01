import { useEffect, useMemo } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useChantLevelStore } from '../store/useChantLevelStore';
import { levelProgress } from '../constants/levels';

const DEFAULT_TARGET = 100000;

/**
 * Loads the devotee's personal chant mission and submits chant counts.
 *
 * Each devotee climbs a ladder of named LEVELS — the first ends at 1,00,000 and
 * the last at the ceiling (11,00,000 by default), past which no chant is
 * accepted. Both the ladder and the ceiling are admin-configured.
 *
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
  const levels = useChantLevelStore(s => s.levels);

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
  // Clamped at 100: the goal is a finish line, not a ceiling. A devotee may keep
  // chanting afterwards, so `userCount` grows past `target` while the bar stays
  // full and `beyond` carries the surplus for the UI to celebrate.
  const percent = target > 0 ? Math.min(100, (userCount / target) * 100) : 0;
  const beyond = Math.max(0, userCount - target);

  const communityRemaining = Math.max(0, communityTarget - communityTotal);
  const communityPercent =
    communityTarget > 0
      ? Math.min(100, (communityTotal / communityTarget) * 100)
      : 0;

  // Where the devotee stands on the ladder. Recomputed only when the count or
  // the admin's ladder changes, since every screen reads it on each render.
  const progress = useMemo(
    () => levelProgress(userCount, levels),
    [userCount, levels],
  );
  const ceilingPercent =
    progress.ceiling > 0
      ? Math.min(100, (userCount / progress.ceiling) * 100)
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
    /** Chants logged past the personal goal (0 until the goal is reached). */
    beyond,
    // Level ladder
    /** The whole admin-configured ladder, ascending. */
    levels,
    /** The level the devotee is standing in. */
    level: progress.current,
    /** 1-based position of that level, and how many levels there are. */
    levelIndex: progress.index,
    levelTotal: progress.total,
    /** The level after this one — null once on the last. */
    nextLevel: progress.next,
    /** Progress WITHIN the current level, 0–100. */
    levelPercent: progress.percent,
    /** Chants completed inside the current level, and how many it spans. */
    inLevel: progress.inLevel,
    levelSize: progress.levelSize,
    /** Chants still needed to reach the next level (0 on the last). */
    toNextLevel: progress.toNext,
    /** True on the last level of the ladder. */
    onFinalLevel: progress.isFinal,
    // Ceiling — the end of the last level, past which nothing is accepted
    ceiling: progress.ceiling,
    /** True once the ceiling is reached; the add UI must be disabled. */
    atCeiling: progress.atCeiling,
    /** How many chants may still be added before the ceiling. */
    roomLeft: progress.roomLeft,
    /** Progress across the WHOLE ladder, 0–100. */
    ceilingPercent,
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
