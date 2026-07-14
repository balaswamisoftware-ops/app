/** A snapshot of the community chant mission. */
export interface MissionStats {
  /** Total chants targeted (e.g. 100,000). */
  target: number;
  /** Chants completed by the whole community. */
  communityTotal: number;
  /** The signed-in devotee's own chant count. */
  userCount: number;
  /** Seva donation amount in ₹ (from settings). */
  donationAmount: number;
  /** True once the community reaches the target. */
  completed: boolean;
}

/** Result of adding chants. */
export interface IncrementResult {
  userCount: number;
  communityTotal: number;
  target: number;
  completed: boolean;
}

/** A single chant submission (for the history screen). */
export interface ChantLog {
  id: string;
  amount: number;
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
