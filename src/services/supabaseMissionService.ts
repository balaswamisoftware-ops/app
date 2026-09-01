import type { ChantLog, IncrementResult, MissionStats } from '../types/mission';
import { getSupabaseClient } from './supabaseClient';
import type { MissionService } from './missionService';
import { ceilingOf, sanitizeLevels } from '../constants/levels';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  return client;
}

const DEFAULT_TARGET = 100000;
const DEFAULT_COMMUNITY_TARGET = 110000000; // 11 Crore
const DEFAULT_DONATION = 216;

export const supabaseMissionService: MissionService = {
  async getStats(): Promise<MissionStats> {
    const supabase = requireClient();
    const { data, error } = await supabase.rpc('mission_stats');
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Partial<MissionStats>;
    const levels = sanitizeLevels(d.levels);
    return {
      target: d.target ?? DEFAULT_TARGET,
      communityTotal: d.communityTotal ?? 0,
      communityTarget: d.communityTarget ?? DEFAULT_COMMUNITY_TARGET,
      userCount: d.userCount ?? 0,
      donationAmount: d.donationAmount ?? DEFAULT_DONATION,
      completed: Boolean(d.completed),
      levels,
      // Always derived from the ladder we settled on, so the two can't disagree.
      ceiling: ceilingOf(levels),
    };
  },

  async addChants(delta: number, txnId?: string): Promise<IncrementResult> {
    const supabase = requireClient();
    // `txn_id` is the idempotency key — a retry of the same id is a no-op on the
    // server, so a lost response can be retried safely without double-counting.
    const { data, error } = await supabase.rpc('add_chants', {
      delta,
      txn_id: txnId ?? null,
    });
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Partial<IncrementResult> & { levels?: unknown };
    const ceiling = ceilingOf(sanitizeLevels(d.levels));
    return {
      userCount: d.userCount ?? 0,
      communityTotal: d.communityTotal ?? 0,
      target: d.target ?? DEFAULT_TARGET,
      completed: Boolean(d.completed),
      // A server that predates the ceiling sends neither field; treating the
      // whole delta as accepted keeps that server behaving exactly as before.
      accepted: typeof d.accepted === 'number' ? d.accepted : delta,
      capped: d.capped === true,
      ceiling: typeof d.ceiling === 'number' && d.ceiling > 0 ? d.ceiling : ceiling,
    };
  },

  async getMyLogs(): Promise<ChantLog[]> {
    const supabase = requireClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from('chant_logs')
      .select('id, amount, created_at, kind')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (
      data as { id: string; amount: number; created_at: string; kind?: string }[]
    ).map(r => ({
      id: r.id,
      amount: r.amount,
      kind: (r.kind as ChantLog['kind']) ?? 'add',
      createdAt: r.created_at,
    }));
  },
};
