/**
 * Domain types shared across the auth feature. A registered app user IS a
 * "devotee" in the admin portal — the same record backs both.
 */

export interface Devotee {
  id: string;
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  createdAt: string;
}

/** The authenticated user as the app cares about it. */
export type AuthUser = Devotee;

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface SignUpData {
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  password: string;
  confirmPassword: string;
}

/** Editable profile fields. Mobile is intentionally excluded (read-only). */
export interface UpdateProfileInput {
  fullName: string;
  nakshatram: string;
  gothram: string;
}

/** Identity check for the "forgot password" flow (no email/OTP). */
export interface ForgotPasswordData {
  mobile: string;
  fullName: string;
}

export interface ResetPasswordData {
  mobile: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

/** Status of the auth session, drives navigation gating. */
export type AuthStatus =
  | 'loading' // still hydrating persisted session (show splash)
  | 'authenticated'
  | 'unauthenticated';

/** Normalized error thrown by the service layer. */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}
