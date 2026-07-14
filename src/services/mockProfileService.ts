import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError, type Devotee, type UpdateProfileInput } from '../types/auth';
import { delay } from '../utils/misc';
import type { ProfileService } from './profileService';

// Shares storage with the mock auth service.
const DEVOTEES_KEY = '@sv/devotees';
const SESSION_KEY = '@sv/session';

async function readDevotees(): Promise<Devotee[]> {
  const raw = await AsyncStorage.getItem(DEVOTEES_KEY);
  return raw ? (JSON.parse(raw) as Devotee[]) : [];
}

async function currentUserId(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

/** Local, AsyncStorage-backed profile for development without a backend. */
export const mockProfileService: ProfileService = {
  async getProfile() {
    await delay(300);
    const id = await currentUserId();
    if (!id) return null;
    const devotees = await readDevotees();
    return devotees.find(d => d.id === id) ?? null;
  },

  async updateProfile(input: UpdateProfileInput) {
    await delay(500);
    const id = await currentUserId();
    if (!id) {
      throw new AuthError('Your session has expired. Please log in again.', 'no_session');
    }
    const devotees = await readDevotees();
    const index = devotees.findIndex(d => d.id === id);
    if (index === -1) {
      throw new AuthError('Could not find your profile.', 'not_found');
    }
    // Mobile is preserved — only editable fields change.
    const updated: Devotee = {
      ...devotees[index],
      fullName: input.fullName.trim(),
      nakshatram: input.nakshatram,
      gothram: input.gothram.trim(),
    };
    devotees[index] = updated;
    await AsyncStorage.setItem(DEVOTEES_KEY, JSON.stringify(devotees));
    return updated;
  },
};
