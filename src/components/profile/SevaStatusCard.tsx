import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { HandHeart, Clock, BadgeCheck, XCircle } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Card } from '../ui';
import { colors } from '../../constants/theme';
import { donationService } from '../../services/donationService';
import type { Donation, DonationStatus } from '../../types/donation';

const STATUS: Record<
  DonationStatus,
  { label: string; icon: LucideIcon; color: string; box: string; text: string }
> = {
  pending: {
    label: 'Pending Verification',
    icon: Clock,
    color: colors.gold,
    box: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  verified: {
    label: 'Verified',
    icon: BadgeCheck,
    color: colors.success,
    box: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  completed: {
    label: 'Seva Completed',
    icon: BadgeCheck,
    color: colors.success,
    box: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: colors.danger,
    box: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
};

/** Shows the devotee's seva (donation) status on the Profile screen. */
export function SevaStatusCard() {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    donationService
      .getMyDonation()
      .then(d => active && setDonation(d))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  return (
    <Card title="Seva Status" icon={HandHeart}>
      {donation ? (
        <View
          className={`flex-row items-center gap-3 rounded-xl border p-3 ${STATUS[donation.status].box}`}
        >
          {React.createElement(STATUS[donation.status].icon, {
            size: 20,
            color: STATUS[donation.status].color,
          })}
          <View className="flex-1">
            <Text className={`font-semibold ${STATUS[donation.status].text}`}>
              {STATUS[donation.status].label}
            </Text>
            <Text className="text-xs text-gray-500">
              ₹{donation.amount}
              {donation.upiTxnId ? ` · Txn ${donation.upiTxnId}` : ''}
            </Text>
          </View>
        </View>
      ) : (
        <Text className="text-gray-500">
          You haven’t completed your ₹216 seva yet. Chant and complete your seva
          from the Home tab.
        </Text>
      )}
    </Card>
  );
}
