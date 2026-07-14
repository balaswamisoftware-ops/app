import { useCallback, useEffect, useMemo, useState } from 'react';
import { missionService } from '../services/missionService';
import type { ChantLog } from '../types/mission';

/** Loads the devotee's chant submission history (newest first). */
export function useChantHistory() {
  const [logs, setLogs] = useState<ChantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setLogs(await missionService.getMyLogs());
    } catch {
      setError('Could not load your history. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(() => logs.reduce((sum, l) => sum + l.amount, 0), [logs]);

  return { logs, total, loading, error, refresh: load };
}
