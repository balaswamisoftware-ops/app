import { useCallback, useEffect, useState } from 'react';
import { missionService } from '../services/missionService';
import type { MissionStats } from '../types/mission';

const DEFAULT_TARGET = 100000;

/**
 * Loads the devotee's personal chant mission and submits chant counts.
 *
 * Each devotee has their OWN goal — chant "Om Namah Shivaya" 1,00,000 times.
 * Progress is personal (not a shared community total). Every submission is one
 * atomic backend call that logs the entry and returns the devotee's fresh count.
 */
export function useMission() {
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [userCount, setUserCount] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const s = await missionService.getStats();
      setStats(s);
      setUserCount(s.userCount);
    } catch {
      setError('Could not load the mission. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Submit a number of chants. Throws on failure so callers can react. */
  const addChants = useCallback(async (delta: number) => {
    if (!Number.isFinite(delta) || delta <= 0) return;
    const n = Math.floor(delta);
    setSubmitting(true);
    setError(null);
    try {
      const res = await missionService.addChants(n);
      setUserCount(res.userCount);
    } catch {
      setError('Could not save your chants. Please check your connection and try again.');
      throw new Error('add_failed');
    } finally {
      setSubmitting(false);
    }
  }, []);

  const target = stats?.target ?? DEFAULT_TARGET;
  const remaining = Math.max(0, target - userCount);
  const percent = target > 0 ? Math.min(100, (userCount / target) * 100) : 0;

  return {
    loading,
    error,
    submitting,
    refresh: load,
    clearError: () => setError(null),
    target,
    userCount,
    remaining,
    percent,
    completed: userCount >= target,
    donationAmount: stats?.donationAmount ?? 216,
    addChants,
  };
}
