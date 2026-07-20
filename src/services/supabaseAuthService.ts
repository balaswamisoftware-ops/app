import {
  AuthError,
  type AuthUser,
  type Devotee,
  type LoginCredentials,
  type SignUpData,
} from '../types/auth';
import { DEVOTEES_TABLE } from '../config/env';
import { normalizeMobile, mobileToEmail } from '../utils/format';
import { invokeWithRetry } from '../utils/invokeWithRetry';
import { getSupabaseClient } from './supabaseClient';
import type { AuthService } from './authService';

/**
 * Supabase-backed auth.
 *
 * Login is by mobile + password. Supabase Auth is email/password based, so we
 * map each mobile to a stable synthetic email (`<mobile>@...`) — this keeps
 * password hashing/security fully inside Supabase Auth (never in the app) while
 * the user only ever sees "mobile number". The public profile lives in the
 * `devotees` table, which the admin portal reads.
 *
 * Expected `devotees` table (run in Supabase SQL editor):
 *   create table devotees (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid references auth.users(id) on delete cascade,
 *     full_name text not null,
 *     mobile text not null unique,
 *     nakshatram text not null,
 *     gothram text not null,
 *     created_at timestamptz not null default now()
 *   );
 */

interface DevoteeRow {
  id: string;
  full_name: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  created_at: string;
}

function mapRow(row: DevoteeRow): Devotee {
  return {
    id: row.id,
    fullName: row.full_name,
    mobile: row.mobile,
    nakshatram: row.nakshatram,
    gothram: row.gothram,
    createdAt: row.created_at,
  };
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new AuthError('Supabase is not configured.', 'config');
  }
  return client;
}

export const supabaseAuthService: AuthService = {
  async getCurrentUser() {
    const supabase = requireClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }
    const { data, error } = await supabase
      .from(DEVOTEES_TABLE)
      .select('id, full_name, mobile, nakshatram, gothram, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return mapRow(data as DevoteeRow);
  },

  async login({ mobile, password }: LoginCredentials) {
    const supabase = requireClient();
    const key = normalizeMobile(mobile);
    const { error } = await supabase.auth.signInWithPassword({
      email: mobileToEmail(key),
      password,
    });
    if (error) {
      throw new AuthError('Incorrect mobile number or password.', 'invalid_credentials');
    }
    const user = await supabaseAuthService.getCurrentUser();
    if (!user) {
      throw new AuthError('Account profile not found.', 'not_found');
    }
    return user;
  },

  async signUp(data: SignUpData): Promise<AuthUser> {
    const supabase = requireClient();
    const key = normalizeMobile(data.mobile);

    // Supabase's public signUp rejects our mobile-based synthetic email, so the
    // account is created server-side (admin API) via the `signup` Edge Function.
    await invokeWithRetry(supabase, 'signup', {
      fullName: data.fullName.trim(),
      mobile: key,
      nakshatram: data.nakshatram,
      gothram: data.gothram.trim(),
      password: data.password,
    });

    // Now sign in to establish a session (the account is already confirmed).
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: mobileToEmail(key),
      password: data.password,
    });
    if (signInError) {
      throw new AuthError('Account created, but sign-in failed. Please log in.', 'signin_failed');
    }

    const user = await supabaseAuthService.getCurrentUser();
    if (!user) {
      throw new AuthError('Account created, but loading your profile failed.', 'profile_failed');
    }
    return user;
  },

  async logout() {
    const supabase = requireClient();
    await supabase.auth.signOut();
  },

  /**
   * Permanently delete the caller's account. The `delete_my_account` RPC is
   * SECURITY DEFINER and only ever removes the CALLER's own row (auth.uid()),
   * along with their chants, donations and payment screenshots.
   */
  async deleteAccount() {
    const supabase = requireClient();
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw new Error(error.message);
    await supabase.auth.signOut();
  },

  // Identity verification and password reset both run inside the
  // `reset-password` Edge Function, which holds the secret key server-side.
  // Passing no `newPassword` performs a verify-only check.
  async verifyIdentity({ mobile, fullName }) {
    const supabase = requireClient();
    try {
      const data = await invokeWithRetry<{ matched?: boolean }>(
        supabase,
        'reset-password',
        { mobile: normalizeMobile(mobile), fullName: fullName.trim() },
      );
      return Boolean(data?.matched);
    } catch {
      throw new AuthError('Could not verify your details. Please try again.', 'verify_failed');
    }
  },

  async resetPassword({ mobile, fullName, newPassword }) {
    const supabase = requireClient();
    const data = await invokeWithRetry<{ success?: boolean }>(
      supabase,
      'reset-password',
      {
        mobile: normalizeMobile(mobile),
        fullName: fullName.trim(),
        newPassword,
      },
    );
    if (!data?.success) {
      throw new AuthError('Mobile number and full name do not match.', 'no_match');
    }
  },
};
