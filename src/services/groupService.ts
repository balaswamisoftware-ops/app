import { isSupabaseConfigured } from '../config/env';
import type {
  AddMemberInput,
  AddMemberResult,
  GroupEntry,
  GroupMember,
  GroupStatus,
  RecordChantsResult,
} from '../types/group';
import { getSupabaseClient } from './supabaseClient';
import { invokeWithRetry } from '../utils/invokeWithRetry';

/**
 * Contract for the Devotee Admin (group leader) feature. Every rule — who may
 * record for whom, the ceiling, the 24-hour undo window — is enforced by the
 * server; this layer only maps shapes.
 */
export interface GroupService {
  status(): Promise<GroupStatus>;
  members(): Promise<GroupMember[]>;
  recentEntries(limit?: number): Promise<GroupEntry[]>;
  addMember(input: AddMemberInput): Promise<AddMemberResult>;
  /** `txnId` makes a retry after a lost response safe. */
  recordChants(memberUserId: string, delta: number, txnId: string): Promise<RecordChantsResult>;
  undo(logId: string): Promise<{ memberCount: number; reversed: number }>;
}

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;
const str = (v: unknown) => (v == null ? '' : String(v));

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');
  return client;
}

const NOT_LEADER: GroupStatus = { isDevoteeAdmin: false, isActive: false, members: 0 };

const supabaseGroupService: GroupService = {
  async status() {
    const { data, error } = await requireClient().rpc('devotee_admin_status');
    if (error) {
      // A server that predates the feature simply means "not a leader".
      if (/devotee_admin_status/.test(error.message)) return NOT_LEADER;
      throw new Error(error.message);
    }
    const d = (data ?? {}) as Row;
    return {
      isDevoteeAdmin: d.isDevoteeAdmin === true,
      isActive: d.isActive === true,
      members: num(d.members),
    };
  },

  async members() {
    const { data, error } = await requireClient().rpc('devotee_admin_members');
    if (error) throw new Error(error.message);
    return ((data as Row[]) ?? []).map(r => ({
      devoteeId: str(r.devotee_id),
      userId: str(r.user_id),
      fullName: str(r.full_name),
      mobile: str(r.mobile),
      nakshatram: str(r.nakshatram),
      gothram: str(r.gothram),
      count: num(r.count),
      isBlocked: r.is_blocked === true,
      managedSince: r.managed_since == null ? null : str(r.managed_since),
      lastEntryAt: r.last_entry_at == null ? null : str(r.last_entry_at),
    }));
  },

  async recentEntries(limit = 100) {
    const { data, error } = await requireClient().rpc('devotee_admin_recent_entries', {
      lim: limit,
    });
    if (error) throw new Error(error.message);
    return ((data as Row[]) ?? []).map(r => ({
      logId: str(r.log_id),
      memberUserId: str(r.member_user_id),
      memberName: str(r.member_name) || 'Removed devotee',
      amount: num(r.amount),
      createdAt: str(r.created_at),
      undone: r.undone === true,
      canUndo: r.can_undo === true,
    }));
  },

  async addMember(input) {
    const data = await invokeWithRetry<Row>(requireClient(), 'group-add-devotee', input);
    return {
      devoteeId: str(data?.devoteeId),
      userId: str(data?.userId),
      fullName: str(data?.fullName),
      mobile: str(data?.mobile),
    };
  },

  async recordChants(memberUserId, delta, txnId) {
    const { data, error } = await requireClient().rpc('devotee_admin_add_chants', {
      p_member: memberUserId,
      p_delta: delta,
      p_txn_id: txnId,
    });
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Row;
    return {
      memberCount: num(d.memberCount),
      accepted: num(d.accepted),
      capped: d.capped === true,
      ceiling: num(d.ceiling),
      duplicate: d.duplicate === true,
    };
  },

  async undo(logId) {
    const { data, error } = await requireClient().rpc('devotee_admin_undo_entry', {
      p_log_id: logId,
    });
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Row;
    return { memberCount: num(d.memberCount), reversed: num(d.reversed) };
  },
};

/** Without a backend there are no groups — nobody is a leader. */
const offlineGroupService: GroupService = {
  status: async () => NOT_LEADER,
  members: async () => [],
  recentEntries: async () => [],
  addMember: async () => {
    throw new Error('Groups need the online backend.');
  },
  recordChants: async () => {
    throw new Error('Groups need the online backend.');
  },
  undo: async () => {
    throw new Error('Groups need the online backend.');
  },
};

export const groupService: GroupService = isSupabaseConfigured
  ? supabaseGroupService
  : offlineGroupService;
