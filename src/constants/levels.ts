import type { ChantLevel } from '../types/mission';

/**
 * The chant-level ladder.
 *
 * A devotee's journey is split into named levels ending at a HARD CEILING — the
 * end of the last level. The real ladder is admin-configured and delivered by
 * `app_config()` / `mission_stats()`; these defaults only stand in when the
 * server is unreachable or predates the feature, and they mirror the seed in
 * `chant-levels.sql`.
 *
 * Ranges are half-open `[from, to)` so a count of exactly 1,00,000 is Level 2.
 * The last level's `to` is inclusive and IS the ceiling.
 */
export const DEFAULT_LEVELS: ChantLevel[] = [
  { n: 1, name: 'Bhakta', from: 0, to: 100000 },
  { n: 2, name: 'Sadhaka', from: 100000, to: 300000 },
  { n: 3, name: 'Yogi', from: 300000, to: 500000 },
  { n: 4, name: 'Siddha', from: 500000, to: 900000 },
  { n: 5, name: 'Maha Siddha', from: 900000, to: 1100000 },
];

/**
 * Coerce whatever the server sent into a usable ladder, falling back to
 * `DEFAULT_LEVELS` when anything is off. A malformed ladder must never leave the
 * devotee unable to chant, so this is deliberately forgiving: it drops junk
 * entries, sorts by `from`, and only gives up when nothing usable survives.
 */
export function sanitizeLevels(raw: unknown): ChantLevel[] {
  if (!Array.isArray(raw)) return DEFAULT_LEVELS;
  const cleaned = raw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null;
      const l = item as Record<string, unknown>;
      const from = Math.max(0, Math.floor(Number(l.from)));
      const to = Math.floor(Number(l.to));
      const name = typeof l.name === 'string' ? l.name.trim() : '';
      if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
      return {
        n: Number.isFinite(Number(l.n)) ? Number(l.n) : i + 1,
        name: name || `Level ${i + 1}`,
        from,
        to,
      };
    })
    .filter((l): l is ChantLevel => l !== null)
    .sort((a, b) => a.from - b.from);
  return cleaned.length > 0 ? cleaned : DEFAULT_LEVELS;
}

/** The hard ceiling — the end of the last level. */
export function ceilingOf(levels: ChantLevel[]): number {
  if (levels.length === 0) return ceilingOf(DEFAULT_LEVELS);
  return levels[levels.length - 1].to;
}

/** The level a given count sits in. Clamped, so it never returns undefined. */
export function levelFor(count: number, levels: ChantLevel[]): ChantLevel {
  const ladder = levels.length > 0 ? levels : DEFAULT_LEVELS;
  const c = Math.max(0, count);
  for (const level of ladder) {
    if (c < level.to) return level;
  }
  // At or past the ceiling — the devotee stays in the final level.
  return ladder[ladder.length - 1];
}

/** Everything the UI needs about where a devotee stands. */
export interface LevelProgress {
  /** The level the devotee is standing in. */
  current: ChantLevel;
  /** 1-based position of `current` in the ladder. */
  index: number;
  /** How many levels there are in total. */
  total: number;
  /** The level after `current`, or null when already on the last one. */
  next: ChantLevel | null;
  /** Chants completed inside the current level. */
  inLevel: number;
  /** How many chants the current level spans. */
  levelSize: number;
  /** Progress within the current level, 0–100. */
  percent: number;
  /** Chants still needed to reach `next` (0 on the final level). */
  toNext: number;
  /** True on the last level of the ladder. */
  isFinal: boolean;
  /** The hard ceiling. */
  ceiling: number;
  /** True once the ceiling is reached — nothing further may be added. */
  atCeiling: boolean;
  /** Chants that may still be added before hitting the ceiling. */
  roomLeft: number;
}

/**
 * Where a devotee stands on the ladder. Pure — safe to call on every render and
 * from the mission store.
 */
export function levelProgress(count: number, levels: ChantLevel[]): LevelProgress {
  const ladder = levels.length > 0 ? levels : DEFAULT_LEVELS;
  const c = Math.max(0, count);
  const ceiling = ceilingOf(ladder);
  const current = levelFor(c, ladder);
  const index = ladder.indexOf(current) + 1;
  const isFinal = index >= ladder.length;
  const next = isFinal ? null : ladder[index];

  const levelSize = Math.max(1, current.to - current.from);
  // Clamped: past the ceiling the final level reads as full rather than >100%.
  const inLevel = Math.max(0, Math.min(levelSize, c - current.from));

  return {
    current,
    index,
    total: ladder.length,
    next,
    inLevel,
    levelSize,
    percent: Math.min(100, (inLevel / levelSize) * 100),
    toNext: next ? Math.max(0, next.from - c) : 0,
    isFinal,
    ceiling,
    atCeiling: c >= ceiling,
    roomLeft: Math.max(0, ceiling - c),
  };
}
