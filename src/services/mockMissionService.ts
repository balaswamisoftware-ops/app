import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChantLog, IncrementResult, MissionStats, RevertResult } from '../types/mission';
import { delay, generateId } from '../utils/misc';
import type { MissionService } from './missionService';
import { DEFAULT_LEVELS, ceilingOf } from '../constants/levels';

const USER_KEY = '@sv/chant-user';
const COMMUNITY_KEY = '@sv/chant-community';
const LOGS_KEY = '@sv/chant-logs';
const TARGET = 100000;
const COMMUNITY_TARGET = 110000000; // 11 Crore
const DONATION = 216;
const CEILING = ceilingOf(DEFAULT_LEVELS);

async function readInt(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

async function readLogs(): Promise<ChantLog[]> {
  const raw = await AsyncStorage.getItem(LOGS_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as ChantLog[]).map(l => ({ ...l, kind: l.kind ?? 'add' }));
}

/** Local, AsyncStorage-backed mission for development without a backend. */
export const mockMissionService: MissionService = {
  async getStats(): Promise<MissionStats> {
    await delay(250);
    const userCount = await readInt(USER_KEY);
    const communityTotal = Math.max(await readInt(COMMUNITY_KEY), userCount);
    return {
      target: TARGET,
      communityTotal,
      communityTarget: COMMUNITY_TARGET,
      userCount,
      donationAmount: DONATION,
      completed: userCount >= TARGET,
      levels: DEFAULT_LEVELS,
      ceiling: CEILING,
    };
  },

  async addChants(delta: number): Promise<IncrementResult> {
    await delay(150);
    const before = await readInt(USER_KEY);
    // Mirrors the server: the ceiling clamps the delta, it never throws.
    const accepted = Math.max(0, Math.min(delta, CEILING - before));
    const userCount = before + accepted;
    const communityTotal = (await readInt(COMMUNITY_KEY)) + accepted;
    const logs = await readLogs();
    if (accepted > 0) {
      logs.unshift({
        id: generateId(),
        amount: accepted,
        kind: 'add',
        createdAt: new Date().toISOString(),
      });
    }
    await Promise.all([
      AsyncStorage.setItem(USER_KEY, String(userCount)),
      AsyncStorage.setItem(COMMUNITY_KEY, String(communityTotal)),
      AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500))),
    ]);
    return {
      userCount,
      communityTotal,
      target: TARGET,
      completed: communityTotal >= TARGET,
      accepted,
      capped: accepted < delta,
      ceiling: CEILING,
    };
  },

  async revertChants(amount: number): Promise<RevertResult> {
    await delay(150);
    const before = await readInt(USER_KEY);
    if (before === 0) throw new Error('You have no chants to revert');
    if (amount > before) throw new Error(`You can revert at most ${before} chants`);
    const userCount = before - amount;
    const communityTotal = Math.max(0, (await readInt(COMMUNITY_KEY)) - amount);
    const logs = await readLogs();
    logs.unshift({
      id: generateId(),
      amount: -amount,
      kind: 'revert',
      createdAt: new Date().toISOString(),
    });
    await Promise.all([
      AsyncStorage.setItem(USER_KEY, String(userCount)),
      AsyncStorage.setItem(COMMUNITY_KEY, String(communityTotal)),
      AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500))),
    ]);
    return { userCount, communityTotal, reverted: amount };
  },

  async getMyLogs(): Promise<ChantLog[]> {
    await delay(150);
    return readLogs();
  },
};
