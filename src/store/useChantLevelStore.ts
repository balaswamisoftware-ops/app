import { create } from 'zustand';
import { DEFAULT_LEVELS, ceilingOf, sanitizeLevels } from '../constants/levels';
import type { ChantLevel } from '../types/mission';

/**
 * The admin-configured chant-level ladder.
 *
 * Delivered by `app_config()` at launch (and on every foreground refresh), so an
 * admin can rename a level or move a boundary without a new build. The defaults
 * reproduce the seeded ladder, so a server that predates the feature — or an
 * unreachable one — still shows a sensible progression.
 */
interface ChantLevelState {
  levels: ChantLevel[];
  setLevels: (levels: unknown) => void;
}

export const useChantLevelStore = create<ChantLevelState>(set => ({
  levels: DEFAULT_LEVELS,
  setLevels: levels => set({ levels: sanitizeLevels(levels) }),
}));

/** The current ladder — for use outside React (e.g. the mission store). */
export function chantLevels(): ChantLevel[] {
  return useChantLevelStore.getState().levels;
}

/**
 * The hard ceiling: no chant beyond this total is ever accepted. Derived from
 * the last level so the ladder and the cap can never disagree.
 */
export function chantCeiling(): number {
  return ceilingOf(chantLevels());
}
