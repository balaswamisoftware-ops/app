import { z } from 'zod';
import { NAKSHATRAMS } from '../constants/nakshatram';

/**
 * A devotee registered by a Devotee Admin. Same field rules as sign-up, minus
 * the password (the account gets one nobody sees) and the terms checkbox (the
 * devotee isn't the one using the app).
 */
export const addMemberSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter the devotee’s full name'),
  mobile: z
    .string()
    .trim()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{8,15}$/, 'Enter a valid mobile number')),
  nakshatram: z
    .string()
    .refine(v => (NAKSHATRAMS as readonly string[]).includes(v), 'Please select the Nakshatram'),
  gothram: z.string().trim().min(2, 'Please enter the Gothram'),
});
