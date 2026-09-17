import type { CertificateBox, CertificateFont, LevelCertificate } from '../types/certificate';

/**
 * Certificate rendering rules, shared with the admin portal's preview
 * (`admin-om/src/lib/certificate.ts`). Keep THE FIT RULE identical there, or a
 * downloaded certificate won't match what the admin approved:
 *
 *   1. Start at 80% of the box height.
 *   2. Measure the name at that size; if wider than the box, scale the size
 *      down in proportion (text width grows linearly with font size).
 *   3. Never below MIN_FONT.
 *   4. Centre the name in the box.
 */

export const MIN_FONT = 8;
const HEIGHT_RATIO = 0.8;

/** The size to measure the name at, before shrinking to fit the width. */
export function startFontSize(boxHeight: number): number {
  return Math.max(MIN_FONT, boxHeight * HEIGHT_RATIO);
}

/** Final font size, given the width the name measured at `start`. */
export function fitFontSize(start: number, boxWidth: number, measuredWidth: number): number {
  const size = measuredWidth > boxWidth && measuredWidth > 0 ? start * (boxWidth / measuredWidth) : start;
  return Math.max(MIN_FONT, Math.floor(size));
}

/** Native font family for a certificate font choice. */
export function fontFamilyFor(font: CertificateFont): string | undefined {
  // 'serif' maps to Noto Serif on Android, which also covers Telugu script.
  return font === 'serif' ? 'serif' : undefined;
}

/**
 * Longest side of a downloaded certificate, in pixels. Big templates are scaled
 * down to this so rendering them can't exhaust memory on a modest phone —
 * still sharp enough to print at A4.
 */
export const MAX_OUTPUT_PX = 2800;

export function outputSize(cert: LevelCertificate): { width: number; height: number } {
  const scale = Math.min(1, MAX_OUTPUT_PX / Math.max(cert.width, cert.height));
  return {
    width: Math.max(1, Math.round(cert.width * scale)),
    height: Math.max(1, Math.round(cert.height * scale)),
  };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function parseBox(raw: unknown): CertificateBox | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const [x, y, w, h] = [b.x, b.y, b.w, b.h].map(Number);
  if (![x, y, w, h].every(Number.isFinite)) return null;
  const box = { x: clamp01(x), y: clamp01(y), w: clamp01(w), h: clamp01(h) };
  if (box.w <= 0 || box.h <= 0 || box.x + box.w > 1.0001 || box.y + box.h > 1.0001) return null;
  return box;
}

/** Coerce a server `certificate` value; anything unusable becomes null. */
export function parseCertificate(raw: unknown): LevelCertificate | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const imageUrl = typeof c.imageUrl === 'string' ? c.imageUrl.trim() : '';
  const width = Math.floor(Number(c.width));
  const height = Math.floor(Number(c.height));
  const box = parseBox(c.box);
  if (!imageUrl || !(width > 0) || !(height > 0) || !box) return null;
  const color =
    typeof c.color === 'string' && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#1f2937';
  return { imageUrl, width, height, box, color, font: c.font === 'sans' ? 'sans' : 'serif' };
}
