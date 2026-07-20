import type {
  AuthUser,
  ForgotPasswordData,
  LoginCredentials,
  SignUpData,
} from '../types/auth';
import { isSupabaseConfigured } from '../config/env';
import { mockAuthService } from './mockAuthService';
import { supabaseAuthService } from './supabaseAuthService';

/**
 * Contract every auth backend must satisfy. UI and state never talk to
 * Supabase (or the mock) directly — they depend only on this interface, so the
 * backend can be swapped without touching a single screen.
 */
export interface AuthService {
  /** Resolve the persisted session on launch, or `null` if signed out. */
  getCurrentUser(): Promise<AuthUser | null>;
  login(credentials: LoginCredentials): Promise<AuthUser>;
  signUp(data: SignUpData): Promise<AuthUser>;
  logout(): Promise<void>;

  /**
   * Verify a devotee by mobile + full name (the "forgot password" identity
   * check). Returns true when both match an existing account.
   */
  verifyIdentity(data: ForgotPasswordData): Promise<boolean>;

  /**
   * Set a new password after a successful identity check. `fullName` is
   * re-verified server-side to prevent tampering.
   */
  resetPassword(data: {
    mobile: string;
    fullName: string;
    newPassword: string;
  }): Promise<void>;

  /**
   * Permanently delete the signed-in devotee's account and all of their data
   * (required by Google Play for apps that allow sign-up).
   */
  deleteAccount(): Promise<void>;
}

/**
 * The active implementation. Uses Supabase when configured, otherwise a local
 * AsyncStorage-backed mock so development works with zero backend setup.
 */
export const authService: AuthService = isSupabaseConfigured
  ? supabaseAuthService
  : mockAuthService;
