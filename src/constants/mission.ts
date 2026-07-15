/** Maximum chants a devotee can add in a single submission. */
export const MAX_CHANTS_PER_ADD = 5000;

/** Beads in one japa mala (one full round of the mala). */
export const BEADS_PER_MALA = 108;

/** AsyncStorage key for chants counted locally but not yet synced to the server. */
export const PENDING_CHANTS_KEY = '@sv/pending-chants';

/**
 * Clamp raw text from a chant-count input to digits within
 * [0, MAX_CHANTS_PER_ADD]. Anything above the cap is pulled down to the cap.
 */
export function clampChantInput(text: string): string {
  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.min(n, MAX_CHANTS_PER_ADD));
}
