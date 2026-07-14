import { z } from 'zod';
import { NAKSHATRAMS } from '../constants/nakshatram';

/** Validation for the editable profile fields (mobile is never edited). */
export const profileSchema = z.object({
  fullName: z.string().trim().min(3, 'Please enter your full name'),
  nakshatram: z
    .string()
    .refine(
      v => (NAKSHATRAMS as readonly string[]).includes(v),
      'Please select your Nakshatram',
    ),
  gothram: z.string().trim().min(2, 'Please enter your Gothram'),
});

export type ProfileInput = z.input<typeof profileSchema>;
