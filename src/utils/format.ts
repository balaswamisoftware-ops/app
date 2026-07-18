const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO -> "13 Jul 2026, 10:30 AM" (local time, no Intl). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h12}:${mm} ${ampm}`;
}

/**
 * Canonical mobile identity — digits only. Keeps ALL digits so international
 * numbers retain their dial code (India stays 10 digits, handled upstream by
 * `combineMobile`).
 */
export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

/** Map a mobile number to a stable synthetic email for Supabase Auth. */
export function mobileToEmail(mobile: string): string {
  return `${normalizeMobile(mobile)}@devotee.srividyapitam.app`;
}

/**
 * Group a number with Indian digit grouping: 100000 -> "1,00,000".
 * Implemented without `Intl`/`toLocaleString` so it is safe on Hermes (RN)
 * regardless of ICU availability.
 */
export function formatNumber(n: number): string {
  const num = Math.round(Math.abs(n || 0));
  const sign = n < 0 ? '-' : '';
  const s = String(num);
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}${rest},${last3}`;
}

/** Display a stored mobile: "9876543210" -> "98765 43210"; international ->
 *  "+<digits>". */
export function formatMobile(mobile: string): string {
  const key = normalizeMobile(mobile);
  if (key.length === 10) return `${key.slice(0, 5)} ${key.slice(5)}`;
  return key ? `+${key}` : key;
}
