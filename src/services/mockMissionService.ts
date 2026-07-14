import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChantLog, IncrementResult, MissionStats } from '../types/mission';
import { delay, generateId } from '../utils/misc';
import type { MissionService } from './missionService';

const USER_KEY = '@sv/chant-user';
const COMMUNITY_KEY = '@sv/chant-community';
const LOGS_KEY = '@sv/chant-logs';
const TARGET = 100000;
const DONATION = 216;

async function readInt(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

async function readLogs(): Promise<ChantLog[]> {
  const raw = await AsyncStorage.getItem(LOGS_KEY);
  return raw ? (JSON.parse(raw) as ChantLog[]) : [];
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
      userCount,
      donationAmount: DONATION,
      completed: communityTotal >= TARGET,
    };
  },

  async addChants(delta: number): Promise<IncrementResult> {
    await delay(150);
    const userCount = (await readInt(USER_KEY)) + delta;
    const communityTotal = (await readInt(COMMUNITY_KEY)) + delta;
    const logs = await readLogs();
    logs.unshift({ id: generateId(), amount: delta, createdAt: new Date().toISOString() });
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
    };
  },

  async getMyLogs(): Promise<ChantLog[]> {
    await delay(150);
    return readLogs();
  },
};
