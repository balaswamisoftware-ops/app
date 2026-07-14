import { useCallback, useEffect, useState } from 'react';
import { donationService } from '../services/donationService';
import type {
  Donation,
  PaymentInfo,
  SubmitDonationInput,
} from '../types/donation';

/** Loads payment details + the devotee's donation, and submits a new seva. */
export function useDonation() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [myDonation, setMyDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [info, donation] = await Promise.all([
        donationService.getPaymentInfo(),
        donationService.getMyDonation(),
      ]);
      setPaymentInfo(info);
      setMyDonation(donation);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Could not load payment details.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(
    async (input: SubmitDonationInput): Promise<Donation> => {
      setSubmitting(true);
      try {
        const donation = await donationService.submit(input);
        setMyDonation(donation);
        return donation;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { paymentInfo, myDonation, loading, loadError, submitting, submit, refresh: load };
}
