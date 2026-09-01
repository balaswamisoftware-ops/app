/**
 * One rung of the chant ladder, e.g. `{ n: 2, name: 'Sadhaka', from: 100000,
 * to: 300000 }`. The range is half-open `[from, to)`; the last level's `to` is
 * inclusive and is the hard ceiling. Admin-configured — see `chant-levels.sql`.
 */
export interface ChantLevel {
  /** 1-based position on the ladder. */
  n: number;
  /** The name devotees see, e.g. "Sadhaka". */
  name: string;
  /** First chant count in this level. */
  from: number;
  /** First chant count of the NEXT level (the ceiling on the last one). */
  to: number;
}

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
  /** The chant-level ladder, in ascending order. */
  levels: ChantLevel[];
  /** Hard ceiling — no chants are accepted past this total. */
  ceiling: number;
}

/** Result of adding chants. */
export interface IncrementResult {
  userCount: number;
  communityTotal: number;
  target: number;
  completed: boolean;
  /**
   * How many of the requested chants actually landed. Less than the request when
   * the ceiling clipped it; 0 when the devotee was already at the ceiling or the
   * call was an idempotent replay.
   */
  accepted: number;
  /** True when the ceiling refused part (or all) of the request. */
  capped: boolean;
  /** Hard ceiling, echoed so a stale client corrects itself. */
  ceiling: number;
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
