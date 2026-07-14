import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthError,
  type AuthUser,
  type Devotee,
  type LoginCredentials,
  type SignUpData,
} from '../types/auth';
import { normalizeMobile } from '../utils/format';
import { generateId, delay } from '../utils/misc';
import type { AuthService } from './authService';

const DEVOTEES_KEY = '@sv/devotees';
const CREDENTIALS_KEY = '@sv/credentials';
const SESSION_KEY = '@sv/session';

async function readDevotees(): Promise<Devotee[]> {
  const raw = await AsyncStorage.getItem(DEVOTEES_KEY);
  return raw ? (JSON.parse(raw) as Devotee[]) : [];
}

async function readCredentials(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(CREDENTIALS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

/**
 * Local, AsyncStorage-backed auth for development. Mirrors the semantics of the
 * Supabase implementation so screens behave identically against either backend.
 * NOTE: stores credentials in cleartext — dev only, never production.
 */
export const mockAuthService: AuthService = {
  async getCurrentUser() {
    await delay(400);
    const sessionId = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      return null;
    }
    const devotees = await readDevotees();
    return devotees.find(d => d.id === sessionId) ?? null;
  },

  async login({ mobile, password }: LoginCredentials) {
    await delay(600);
    const key = normalizeMobile(mobile);
    const credentials = await readCredentials();
    if (!(key in credentials)) {
      throw new AuthError('No account found for this mobile number.', 'not_found');
    }
    if (credentials[key] !== password) {
      throw new AuthError('Incorrect mobile number or password.', 'invalid_credentials');
    }
    const devotees = await readDevotees();
    const user = devotees.find(d => normalizeMobile(d.mobile) === key);
    if (!user) {
      throw new AuthError('Account data is missing. Please sign up again.', 'not_found');
    }
    await AsyncStorage.setItem(SESSION_KEY, user.id);
    return user;
  },

  async signUp(data: SignUpData): Promise<AuthUser> {
    await delay(700);
    const key = normalizeMobile(data.mobile);
    const credentials = await readCredentials();
    if (key in credentials) {
      throw new AuthError('An account with this mobile number already exists.', 'already_exists');
    }
    const devotee: Devotee = {
      id: generateId(),
      fullName: data.fullName.trim(),
      mobile: key,
      nakshatram: data.nakshatram,
      gothram: data.gothram.trim(),
      createdAt: new Date().toISOString(),
    };
    const devotees = await readDevotees();
    devotees.push(devotee);
    credentials[key] = data.password;

    await Promise.all([
      AsyncStorage.setItem(DEVOTEES_KEY, JSON.stringify(devotees)),
      AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials)),
      AsyncStorage.setItem(SESSION_KEY, devotee.id),
    ]);
    return devotee;
  },

  async logout() {
    await delay(200);
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async verifyIdentity({ mobile, fullName }) {
    await delay(500);
    const key = normalizeMobile(mobile);
    const devotees = await readDevotees();
    return devotees.some(
      d =>
        normalizeMobile(d.mobile) === key &&
        d.fullName.trim().toLowerCase() === fullName.trim().toLowerCase(),
    );
  },

  async resetPassword({ mobile, fullName, newPassword }) {
    await delay(600);
    const key = normalizeMobile(mobile);
    const devotees = await readDevotees();
    const match = devotees.find(
      d =>
        normalizeMobile(d.mobile) === key &&
        d.fullName.trim().toLowerCase() === fullName.trim().toLowerCase(),
    );
    if (!match) {
      throw new AuthError('Mobile number and full name do not match.', 'no_match');
    }
    const credentials = await readCredentials();
    credentials[key] = newPassword;
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  },
};
