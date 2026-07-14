import type { Devotee, UpdateProfileInput } from '../types/auth';
import { isSupabaseConfigured } from '../config/env';
import { mockProfileService } from './mockProfileService';
import { supabaseProfileService } from './supabaseProfileService';

/**
 * Contract for reading and updating the signed-in devotee's profile. UI and
 * state depend only on this interface, so the backend can be swapped freely.
 *
 * `updateProfile` only ever writes the editable fields — the mobile number is
 * never sent, so it cannot be changed here.
 */
export interface ProfileService {
  getProfile(): Promise<Devotee | null>;
  updateProfile(input: UpdateProfileInput): Promise<Devotee>;
}

export const profileService: ProfileService = isSupabaseConfigured
  ? supabaseProfileService
  : mockProfileService;
