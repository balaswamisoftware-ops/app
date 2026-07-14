import { z } from 'zod';
import { NAKSHATRAMS } from '../constants/nakshatram';

/** 10-digit Indian mobile (leading 6-9), tolerant of spaces/+91 on input. */
const mobileField = z
  .string()
  .trim()
  .transform(v => v.replace(/\D/g, '').slice(-10))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  );

const passwordField = z
  .string()
  .min(6, 'Password must be at least 6 characters');

export const loginSchema = z.object({
  mobile: mobileField,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, 'Please enter your full name'),
    mobile: mobileField,
    nakshatram: z
      .string()
      .refine(v => (NAKSHATRAMS as readonly string[]).includes(v), 'Please select your Nakshatram'),
    gothram: z
      .string()
      .trim()
      .min(2, 'Please enter your Gothram'),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  mobile: mobileField,
  fullName: z.string().trim().min(3, 'Please enter your full name'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.input<typeof loginSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

/** Field-name -> first error message. Used to render inline form errors. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Validate `values` against `schema`. On success returns the parsed data; on
 * failure returns a `{ field: message }` map keyed by field name.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { success: true; data: z.output<S> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}
