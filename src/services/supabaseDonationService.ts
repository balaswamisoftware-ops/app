import { decode } from 'base64-arraybuffer';
import { AuthError } from '../types/auth';
import type {
  Donation,
  DonationStatus,
  PaymentInfo,
  SubmitDonationInput,
} from '../types/donation';
import { getSupabaseClient } from './supabaseClient';
import type { DonationService } from './donationService';

const BUCKET = 'payment-screenshots';

interface DonationRow {
  id: string;
  amount: number;
  upi_txn_id: string | null;
  screenshot_url: string | null;
  status: DonationStatus;
  admin_remarks: string | null;
  created_at: string;
}

function mapRow(row: DonationRow): Donation {
  return {
    id: row.id,
    amount: row.amount,
    upiTxnId: row.upi_txn_id,
    screenshotUrl: row.screenshot_url,
    status: row.status,
    adminRemarks: row.admin_remarks,
    createdAt: row.created_at,
  };
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new AuthError('Supabase is not configured.', 'config');
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

/**
 * Ensure the access token is valid before an authenticated request (Storage RLS
 * relies on `auth.uid()`). Refreshes when the token is missing or near expiry so
 * uploads never fail with a stale/empty session.
 */
async function ensureFreshToken() {
  const supabase = requireClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new AuthError('Your session has expired. Please log in again.', 'no_session');
  }
  const expiresSoon =
    !session.expires_at || session.expires_at * 1000 < Date.now() + 60_000;
  if (expiresSoon) {
    await supabase.auth.refreshSession();
  }
}

export const supabaseDonationService: DonationService = {
  async getPaymentInfo(): Promise<PaymentInfo> {
    const supabase = requireClient();
    const { data, error } = await supabase
      .from('settings')
      .select('donation_amount, phonepe_number, upi_id, qr_url')
      .eq('id', 1)
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? 'Could not load payment details.');
    }
    return {
      amount: data.donation_amount ?? 216,
      phonepeNumber: data.phonepe_number ?? '',
      upiId: data.upi_id ?? '',
      qrUrl: data.qr_url ?? '',
    };
  },

  async getMyDonation(): Promise<Donation | null> {
    const supabase = requireClient();
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('donations')
      .select('id, amount, upi_txn_id, screenshot_url, status, admin_remarks, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as DonationRow);
  },

  async submit(input: SubmitDonationInput): Promise<Donation> {
    const supabase = requireClient();
    await ensureFreshToken();
    const userId = await requireUserId();

    // Upload the screenshot to the devotee's own folder, if provided.
    let screenshotPath: string | null = null;
    if (input.screenshot) {
      const ext = input.screenshot.contentType.includes('png') ? 'png' : 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, decode(input.screenshot.base64), {
          contentType: input.screenshot.contentType,
          upsert: true,
        });
      if (upErr) throw new Error(`Screenshot upload failed: ${upErr.message}`);
      screenshotPath = path;
    }

    const { data, error } = await supabase
      .from('donations')
      .insert({
        user_id: userId,
        amount: input.amount,
        upi_txn_id: input.upiTxnId?.trim() || null,
        screenshot_url: screenshotPath,
        status: 'pending',
      })
      .select('id, amount, upi_txn_id, screenshot_url, status, admin_remarks, created_at')
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? 'Could not submit your seva.');
    }
    return mapRow(data as DonationRow);
  },
};
