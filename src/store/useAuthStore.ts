import { create } from 'zustand';
import { AuthError, type AuthStatus, type AuthUser } from '../types/auth';
import type {
  ForgotPasswordData,
  LoginCredentials,
  SignUpData,
  UpdateProfileInput,
} from '../types/auth';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

interface AuthStoreState {
  status: AuthStatus;
  user: AuthUser | null;
  /** True while a login/signup request is in flight (button spinners). */
  submitting: boolean;
  /** Last submit error message, for banner display. */
  error: string | null;

  hydrate: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Permanently delete the account and all data. Signs the user out. */
  deleteAccount: () => Promise<void>;
  /** Returns true when mobile + full name match an account. */
  verifyIdentity: (data: ForgotPasswordData) => Promise<boolean>;
  resetPassword: (data: {
    mobile: string;
    fullName: string;
    newPassword: string;
  }) => Promise<boolean>;
  /** Re-fetch the signed-in devotee from the backend and update `user`. */
  refreshProfile: () => Promise<void>;
  /** Persist the editable profile fields; resolves with the updated user or throws. */
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
  clearError: () => void;
}

function toMessage(err: unknown): string {
  if (err instanceof AuthError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Single source of truth for authentication. Screens call these actions and
 * react to `status` / `submitting` / `error`; they never import the service
 * layer directly.
 */
export const useAuthStore = create<AuthStoreState>((set) => ({
  status: 'loading',
  user: null,
  submitting: false,
  error: null,

  hydrate: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user, status: user ? 'authenticated' : 'unauthenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (credentials) => {
    set({ submitting: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, status: 'authenticated', submitting: false });
      return true;
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      return false;
    }
  },

  signUp: async (data) => {
    set({ submitting: true, error: null });
    try {
      const user = await authService.signUp(data);
      set({ user, status: 'authenticated', submitting: false });
      return true;
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      return false;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, status: 'unauthenticated' });
  },

  deleteAccount: async () => {
    await authService.deleteAccount();
    set({ user: null, status: 'unauthenticated' });
  },

  verifyIdentity: async (data) => {
    set({ submitting: true, error: null });
    try {
      const matched = await authService.verifyIdentity(data);
      set({ submitting: false });
      if (!matched) {
        set({ error: 'Mobile number and full name do not match.' });
      }
      return matched;
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      return false;
    }
  },

  resetPassword: async ({ mobile, fullName, newPassword }) => {
    set({ submitting: true, error: null });
    try {
      await authService.resetPassword({ mobile, fullName, newPassword });
      set({ submitting: false });
      return true;
    } catch (err) {
      set({ submitting: false, error: toMessage(err) });
      return false;
    }
  },

  refreshProfile: async () => {
    const user = await profileService.getProfile();
    if (user) {
      set({ user });
    }
  },

  updateProfile: async (input) => {
    const user = await profileService.updateProfile(input);
    set({ user });
    return user;
  },

  clearError: () => set({ error: null }),
}));
