import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { groupService } from '../services/groupService';
import type {
  AddMemberInput,
  AddMemberResult,
  GroupEntry,
  GroupMember,
  GroupStatus,
  PendingGroupEntry,
} from '../types/group';
import { formatNumber } from '../utils/format';
import { uuidv4 } from '../utils/uuid';

const PENDING_KEY = '@sv/group-pending';

/**
 * Errors worth holding an entry for and retrying later, rather than dropping it:
 * no network, and states an admin can reverse (mission paused, leader
 * suspended). Anything else (e.g. "not in your group") will never succeed.
 */
const HOLD_ERROR = /network|fetch|timed? ?out|abort|paused|active devotee admin/i;

interface GroupState {
  status: GroupStatus | null;
  members: GroupMember[];
  entries: GroupEntry[];
  /** Entries recorded on this phone that haven't reached the server yet. */
  pending: PendingGroupEntry[];
  loadingMembers: boolean;
  loadingEntries: boolean;
  error: string | null;
  /** One-line outcome of a background sync worth telling the leader about. */
  syncNotice: string | null;

  loadStatus: () => Promise<void>;
  loadMembers: () => Promise<void>;
  loadEntries: () => Promise<void>;
  addMember: (input: AddMemberInput) => Promise<AddMemberResult>;
  /** Record chants for a member. Saved on the phone first, then synced. */
  record: (member: GroupMember, delta: number) => void;
  flush: () => Promise<void>;
  undo: (entry: GroupEntry) => Promise<void>;
  dismissNotice: () => void;
  /** Clear everything — on logout, so nothing bleeds into the next account. */
  reset: () => void;
}

let hydrated = false;
let flushing = false;

function persist(pending: PendingGroupEntry[]) {
  void AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

/** The pending queue survives the app being closed while offline. */
async function hydrate(set: (p: Partial<GroupState>) => void) {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const list = raw ? (JSON.parse(raw) as PendingGroupEntry[]) : [];
    if (Array.isArray(list) && list.length > 0) set({ pending: list });
  } catch {
    /* a corrupt queue is dropped rather than crashing the app */
  }
}

/**
 * State for the Devotee Admin (group leader) screens.
 *
 * Recording is offline-first, mirroring a devotee's own chants: an entry goes
 * into a persisted queue with its own txnId, the member's total updates on
 * screen straight away, and `flush()` sends the queue one entry at a time. The
 * server applies each txnId at most once, so retrying after a lost response
 * can never double-count.
 */
export const useGroupStore = create<GroupState>((set, get) => ({
  status: null,
  members: [],
  entries: [],
  pending: [],
  loadingMembers: false,
  loadingEntries: false,
  error: null,
  syncNotice: null,

  loadStatus: async () => {
    await hydrate(set);
    try {
      set({ status: await groupService.status() });
    } catch {
      // Keep the last known role: a flaky network shouldn't hide the Group tab.
    }
  },

  loadMembers: async () => {
    set({ loadingMembers: true, error: null });
    try {
      set({ members: await groupService.members() });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load your group.' });
    } finally {
      set({ loadingMembers: false });
    }
  },

  loadEntries: async () => {
    set({ loadingEntries: true });
    try {
      set({ entries: await groupService.recentEntries(200) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not load your entries.' });
    } finally {
      set({ loadingEntries: false });
    }
  },

  addMember: async input => {
    const result = await groupService.addMember(input);
    await Promise.all([get().loadMembers(), get().loadStatus()]);
    return result;
  },

  record: (member, delta) => {
    const n = Math.floor(delta);
    if (!(n > 0)) return;
    const item: PendingGroupEntry = {
      txnId: uuidv4(),
      memberUserId: member.userId,
      memberName: member.fullName,
      delta: n,
      createdAt: new Date().toISOString(),
    };
    const pending = [...get().pending, item];
    persist(pending);
    set({ pending });
    void get().flush();
  },

  flush: async () => {
    if (flushing) return;
    flushing = true;
    let synced = false;
    try {
      // Always take the oldest item from the CURRENT queue, so entries added
      // while this loop runs are picked up too.
      for (;;) {
        const item = get().pending[0];
        if (!item) break;

        try {
          const res = await groupService.recordChants(item.memberUserId, item.delta, item.txnId);
          synced = true;
          const pending = get().pending.filter(p => p.txnId !== item.txnId);
          persist(pending);
          set({
            pending,
            members: get().members.map(m =>
              m.userId === item.memberUserId ? { ...m, count: res.memberCount } : m,
            ),
          });
          if (!res.duplicate && res.accepted < item.delta) {
            set({
              syncNotice:
                res.accepted === 0
                  ? `${item.memberName} has already reached the ${formatNumber(res.ceiling)} limit — ${formatNumber(item.delta)} chants weren’t added.`
                  : `Only ${formatNumber(res.accepted)} of ${formatNumber(item.delta)} chants were added for ${item.memberName} — they reached the ${formatNumber(res.ceiling)} limit.`,
            });
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          if (HOLD_ERROR.test(message)) break; // keep it; retry on the next flush
          // It will never succeed — drop it, but say so.
          const pending = get().pending.filter(p => p.txnId !== item.txnId);
          persist(pending);
          set({
            pending,
            syncNotice: `${formatNumber(item.delta)} chants for ${item.memberName} couldn’t be recorded: ${message}`,
          });
        }
      }
    } finally {
      flushing = false;
    }
    if (synced) void get().loadEntries();
  },

  undo: async entry => {
    const res = await groupService.undo(entry.logId);
    set({
      members: get().members.map(m =>
        m.userId === entry.memberUserId ? { ...m, count: res.memberCount } : m,
      ),
      entries: get().entries.map(e =>
        e.logId === entry.logId ? { ...e, undone: true, canUndo: false } : e,
      ),
    });
    void get().loadEntries();
  },

  dismissNotice: () => set({ syncNotice: null }),

  reset: () => {
    void AsyncStorage.removeItem(PENDING_KEY);
    flushing = false;
    set({
      status: null,
      members: [],
      entries: [],
      pending: [],
      error: null,
      syncNotice: null,
    });
  },
}));

/** Chants for a member still waiting to sync. */
export function pendingFor(pending: PendingGroupEntry[], memberUserId: string): number {
  return pending.reduce((sum, p) => (p.memberUserId === memberUserId ? sum + p.delta : sum), 0);
}
