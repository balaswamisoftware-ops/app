/**
 * Fallback ceiling for a single submission, and the chunk size the offline
 * queue flushes in. The ADMIN-CONFIGURED cap lives in `useChantLimitStore`;
 * this is only the default used before the server config arrives, and the
 * transport ceiling when the admin has turned the cap off entirely.
 */
export const MAX_CHANTS_PER_ADD = 5000;

/** Beads in one japa mala (one full round of the mala). */
export const BEADS_PER_MALA = 108;

/** AsyncStorage key for chants counted locally but not yet synced to the server. */
export const PENDING_CHANTS_KEY = '@sv/pending-chants';

/**
 * Clamp raw text from a chant-count input to digits within [0, max].
 *
 * Pass `max = null` when the admin has switched the restriction off — the text
 * is still reduced to digits, but no ceiling is applied.
 */
export function clampChantInput(text: string, max: number | null): string {
  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(max == null ? n : Math.min(n, max));
}
