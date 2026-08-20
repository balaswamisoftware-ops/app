import { create } from 'zustand';
import { MAX_CHANTS_PER_ADD } from '../constants/mission';

/**
 * Admin-controlled cap on how many chants a devotee may submit at once.
 *
 *   enabled = false  →  no restriction; the devotee enters whatever they wish
 *   enabled = true   →  at most `max` per submission
 *
 * Delivered by `app_config()` at launch, so changing it needs no new build.
 * Defaults reproduce the old hardcoded behaviour, so a server that predates the
 * setting (or an unreachable one) behaves exactly as before.
 */
export interface ChantLimitConfig {
  enabled: boolean;
  max: number;
}

interface ChantLimitState extends ChantLimitConfig {
  setLimit: (cfg: Partial<ChantLimitConfig>) => void;
}

export const useChantLimitStore = create<ChantLimitState>(set => ({
  enabled: true,
  max: MAX_CHANTS_PER_ADD,
  setLimit: cfg => set(cfg),
}));

/**
 * The effective ceiling for ONE submission.
 *
 * With the limit off there is still a transport ceiling — the offline queue has
 * to be flushed in bounded chunks — but the devotee never sees it as a cap on
 * what they may type.
 */
export function effectiveChantMax(): number {
  const { enabled, max } = useChantLimitStore.getState();
  return enabled ? Math.max(1, max) : MAX_CHANTS_PER_ADD;
}

/** Null when the devotee may enter any amount; a number when capped. */
export function inputChantMax(): number | null {
  const { enabled, max } = useChantLimitStore.getState();
  return enabled ? Math.max(1, max) : null;
}
