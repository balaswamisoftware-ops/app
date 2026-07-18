/** A country dialling code for the phone-number field. */
export interface CountryCode {
  name: string;
  dial: string; // e.g. '+91'
  flag: string; // emoji
}

/** Common dialling codes (India first). Extend as needed. */
export const COUNTRY_CODES: CountryCode[] = [
  { name: 'India', dial: '+91', flag: '🇮🇳' },
  { name: 'United States', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { name: 'Oman', dial: '+968', flag: '🇴🇲' },
  { name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
  { name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { name: 'France', dial: '+33', flag: '🇫🇷' },
  { name: 'Ireland', dial: '+353', flag: '🇮🇪' },
  { name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
  { name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { name: 'Nepal', dial: '+977', flag: '🇳🇵' },
  { name: 'Sri Lanka', dial: '+94', flag: '🇱🇰' },
  { name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
];

export const DEFAULT_DIAL_CODE = '+91';

/**
 * Build the canonical mobile identity from a dial code + local number.
 *
 * India (+91) keeps the plain 10-digit form for BACKWARD COMPATIBILITY with
 * existing accounts. Every other country stores `<code><number>` (digits only)
 * so international numbers are unique.
 */
export function combineMobile(dialCode: string, localNumber: string): string {
  const local = localNumber.replace(/\D/g, '');
  if (dialCode === '+91') return local.slice(-10);
  return dialCode.replace(/\D/g, '') + local;
}
