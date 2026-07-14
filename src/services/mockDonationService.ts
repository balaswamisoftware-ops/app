import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Donation,
  PaymentInfo,
  SubmitDonationInput,
} from '../types/donation';
import { delay } from '../utils/misc';
import { generateId } from '../utils/misc';
import type { DonationService } from './donationService';

const KEY = '@sv/my-donation';

/** Local mock donation for development without a backend. */
export const mockDonationService: DonationService = {
  async getPaymentInfo(): Promise<PaymentInfo> {
    await delay(200);
    return {
      amount: 216,
      phonepeNumber: '9876543210',
      upiId: 'srividyapitam@upi',
      qrUrl: '',
    };
  },

  async getMyDonation(): Promise<Donation | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Donation) : null;
  },

  async submit(input: SubmitDonationInput): Promise<Donation> {
    await delay(500);
    const donation: Donation = {
      id: generateId(),
      amount: input.amount,
      upiTxnId: input.upiTxnId?.trim() || null,
      screenshotUrl: input.screenshot ? 'mock/screenshot.jpg' : null,
      status: 'pending',
      adminRemarks: null,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(donation));
    return donation;
  },
};
