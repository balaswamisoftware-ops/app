export type DonationStatus = 'pending' | 'verified' | 'rejected' | 'completed';

export interface Donation {
  id: string;
  amount: number;
  upiTxnId: string | null;
  screenshotUrl: string | null;
  status: DonationStatus;
  adminRemarks: string | null;
  createdAt: string;
}

/** Payment details shown to the devotee (from admin settings). */
export interface PaymentInfo {
  amount: number;
  phonepeNumber: string;
  upiId: string;
  qrUrl: string;
}

/** A picked screenshot ready to upload. */
export interface ScreenshotAsset {
  base64: string;
  contentType: string;
}

export interface SubmitDonationInput {
  amount: number;
  upiTxnId?: string;
  screenshot?: ScreenshotAsset | null;
}
