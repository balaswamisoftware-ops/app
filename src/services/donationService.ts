import type {
  Donation,
  PaymentInfo,
  SubmitDonationInput,
} from '../types/donation';
import { isSupabaseConfigured } from '../config/env';
import { mockDonationService } from './mockDonationService';
import { supabaseDonationService } from './supabaseDonationService';

/**
 * Seva donation flow. UI/state depend only on this interface.
 * `getPaymentInfo` returns the admin-configured PhonePe / UPI / QR details.
 */
export interface DonationService {
  getPaymentInfo(): Promise<PaymentInfo>;
  /** The devotee's most recent donation, or null if none yet. */
  getMyDonation(): Promise<Donation | null>;
  submit(input: SubmitDonationInput): Promise<Donation>;
}

export const donationService: DonationService = isSupabaseConfigured
  ? supabaseDonationService
  : mockDonationService;
