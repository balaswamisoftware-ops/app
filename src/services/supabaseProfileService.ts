import { AuthError, type Devotee, type UpdateProfileInput } from '../types/auth';
import { DEVOTEES_TABLE } from '../config/env';
import { getSupabaseClient } from './supabaseClient';
import type { ProfileService } from './profileService';

interface DevoteeRow {
  id: string;
  full_name: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  created_at: string;
}

const COLUMNS = 'id, full_name, mobile, nakshatram, gothram, created_at';

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

async function requireUserId(): Promise<string> {
  const supabase = requireClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new AuthError('Your session has expired. Please log in again.', 'no_session');
  }
  return session.user.id;
}

export const supabaseProfileService: ProfileService = {
  async getProfile() {
    const supabase = requireClient();
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from(DEVOTEES_TABLE)
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return mapRow(data as DevoteeRow);
  },

  async updateProfile(input: UpdateProfileInput) {
    const supabase = requireClient();
    const userId = await requireUserId();

    // Only the editable columns are written — `mobile` is never included, so it
    // stays read-only at the data layer regardless of the UI.
    const { data, error } = await supabase
      .from(DEVOTEES_TABLE)
      .update({
        full_name: input.fullName.trim(),
        nakshatram: input.nakshatram,
        gothram: input.gothram.trim(),
      })
      .eq('user_id', userId)
      .select(COLUMNS)
      .single();

    if (error || !data) {
      throw new AuthError(
        error?.message ?? 'Could not update your profile.',
        'update_failed',
      );
    }
    return mapRow(data as DevoteeRow);
  },
};
