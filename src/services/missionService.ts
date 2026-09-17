import type { ChantLog, IncrementResult, MissionStats, RevertResult } from '../types/mission';
import { isSupabaseConfigured } from '../config/env';
import { mockMissionService } from './mockMissionService';
import { supabaseMissionService } from './supabaseMissionService';

/**
 * Contract for the chant mission. UI/state depend only on this interface.
 * `addChants` is atomic on the backend (logs the entry + bumps totals) so
 * concurrent devotees never lose counts.
 */
export interface MissionService {
  getStats(): Promise<MissionStats>;
  /**
   * Add `delta` chants. `txnId` is an idempotency key: retrying the same txnId
   * (after a lost response) applies the delta at most once on the server.
   */
  addChants(delta: number, txnId?: string): Promise<IncrementResult>;
  /**
   * Take `amount` chants back off the devotee's own total. Recorded as a
   * 'revert' entry in their history. `txnId` makes a retry safe.
   */
  revertChants(amount: number, txnId: string): Promise<RevertResult>;
  /** The devotee's chant submissions, newest first. */
  getMyLogs(): Promise<ChantLog[]>;
}

export const missionService: MissionService = isSupabaseConfigured
  ? supabaseMissionService
  : mockMissionService;
