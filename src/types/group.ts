/**
 * Devotee Admin (group leader) feature. A Devotee Admin registers devotees
 * under themselves and records chants on their behalf. Mirrors the SQL in
 * `devotee-admins.sql` and the `group-add-devotee` Edge Function.
 */

/** The signed-in devotee's role, from `devotee_admin_status()`. */
export interface GroupStatus {
  isDevoteeAdmin: boolean;
  /** A suspended leader keeps their group but can't add or record. */
  isActive: boolean;
  members: number;
}

export interface GroupMember {
  devoteeId: string;
  /** Auth user id — the key chants are recorded against. */
  userId: string;
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
  /** Server-confirmed total (excludes entries still waiting to sync). */
  count: number;
  isBlocked: boolean;
  managedSince: string | null;
  lastEntryAt: string | null;
}

/** An entry the leader made, as confirmed by the server. */
export interface GroupEntry {
  logId: string;
  memberUserId: string;
  memberName: string;
  amount: number;
  createdAt: string;
  undone: boolean;
  /** Within 24 h, not undone, and the leader is still active. */
  canUndo: boolean;
}

/** An entry recorded on this phone that hasn't reached the server yet. */
export interface PendingGroupEntry {
  /** Idempotency key — a retry with the same id is applied at most once. */
  txnId: string;
  memberUserId: string;
  memberName: string;
  delta: number;
  createdAt: string;
}

export interface AddMemberInput {
  fullName: string;
  mobile: string;
  nakshatram: string;
  gothram: string;
}

export interface AddMemberResult {
  devoteeId: string;
  userId: string;
  fullName: string;
  mobile: string;
}

export interface RecordChantsResult {
  memberCount: number;
  /** How many actually landed — less than asked when the ceiling clipped it. */
  accepted: number;
  capped: boolean;
  ceiling: number;
  /** True when this txnId had already been applied (a safe retry). */
  duplicate: boolean;
}
