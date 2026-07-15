/** A snapshot of the chant mission (personal + community). */
export interface MissionStats {
  /** The devotee's personal target (e.g. 1,00,000). */
  target: number;
  /** Chants completed by the whole community (sum of all devotees). */
  communityTotal: number;
  /** The shared community goal (e.g. 11 Crore = 11,00,00,000). */
  communityTarget: number;
  /** The signed-in devotee's own chant count. */
  userCount: number;
  /** Seva donation amount in ₹ (from settings). */
  donationAmount: number;
  /** True once the devotee reaches their personal target. */
  completed: boolean;
}

/** Result of adding chants. */
export interface IncrementResult {
  userCount: number;
  communityTotal: number;
  target: number;
  completed: boolean;
}

/** How a chant-history entry was created. */
export type ChantLogKind = 'add' | 'reset' | 'adjust';

/** A single chant-history entry (an add, or an admin reset / adjustment). */
export interface ChantLog {
  id: string;
  /** Signed delta: positive for adds, negative for a reset/reduction. */
  amount: number;
  kind: ChantLogKind;
  createdAt: string;
}

/** Convenience: remaining chants, clamped at 0. */
export function remaining(stats: Pick<MissionStats, 'target' | 'communityTotal'>): number {
  return Math.max(0, stats.target - stats.communityTotal);
}

/** Convenience: overall completion percentage (0–100). */
export function percent(stats: Pick<MissionStats, 'target' | 'communityTotal'>): number {
  if (stats.target <= 0) return 0;
  return Math.min(100, (stats.communityTotal / stats.target) * 100);
}
