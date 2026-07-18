import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  QrCode,
  Smartphone,
  AtSign,
  Upload,
  Check,
  Clock,
  BadgeCheck,
  Hash,
} from 'lucide-react-native';

import { Banner, Button, Card, Dialog, IconChip, Input } from '../components/ui';
import { colors } from '../constants/theme';
import { formatMobile } from '../utils/format';
import { useDonation } from '../hooks/useDonation';
import type { DonationStatus } from '../types/donation';
import type { ScreenshotAsset } from '../types/donation';

const STATUS_LABEL: Record<DonationStatus, string> = {
  pending: 'Pending Verification',
  verified: 'Verified',
  completed: 'Seva Completed',
  rejected: 'Rejected — please re-submit',
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Smartphone;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5">
      <IconChip icon={Icon} />
      <View className="flex-1">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="mt-0.5 text-base font-medium text-gray-900">
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

export function DonationScreen() {
  const { paymentInfo, myDonation, loading, loadError, submitting, submit, refresh } =
    useDonation();
  const insets = useSafeAreaInsets();

  const [txnId, setTxnId] = useState('');
  const [asset, setAsset] = useState<ScreenshotAsset | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const pickScreenshot = async () => {
    setError(null);
    const res = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
      maxWidth: 1400,
      maxHeight: 1400,
    });
    if (res.didCancel) return;
    const a = res.assets?.[0];
    if (!a?.base64) {
      setError('Could not read the selected image. Please try again.');
      return;
    }
    setPreviewUri(a.uri ?? null);
    setAsset({ base64: a.base64, contentType: a.type ?? 'image/jpeg' });
  };

  const onSubmit = async () => {
    if (!paymentInfo) return;
    if (!asset) {
      setError('Please upload your payment screenshot.');
      return;
    }
    setError(null);
    try {
      await submit({
        amount: paymentInfo.amount,
        upiTxnId: txnId,
        screenshot: asset,
      });
      setSuccessOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit. Please try again.',
      );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-gray-500">Loading payment details…</Text>
      </View>
    );
  }

  if (loadError || !paymentInfo) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-gray-50 px-8">
        <Text className="text-center text-gray-600">
          {loadError ?? 'Could not load payment details.'}
        </Text>
        <Button label="Retry" variant="outline" onPress={refresh} />
      </View>
    );
  }

  // Already submitted (and not rejected) → show status.
  const submitted = myDonation && myDonation.status !== 'rejected';

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Amount */}
      <View className="items-center rounded-2xl border border-gray-100 bg-white p-6">
        <Text className="text-sm text-gray-500">Seva Donation</Text>
        <Text className="text-4xl font-extrabold text-gray-900">
          ₹{paymentInfo.amount}
        </Text>
      </View>

      {submitted ? (
        <Card
          title={STATUS_LABEL[myDonation!.status]}
          icon={
            myDonation!.status === 'completed' || myDonation!.status === 'verified'
              ? BadgeCheck
              : Clock
          }
        >
          <Text className="text-gray-600">
            Thank you for your seva 🙏. Amount: ₹{myDonation!.amount}
            {myDonation!.upiTxnId ? ` · Txn: ${myDonation!.upiTxnId}` : ''}
          </Text>
          {myDonation!.adminRemarks ? (
            <Text className="mt-2 text-sm text-gray-500">
              Admin note: {myDonation!.adminRemarks}
            </Text>
          ) : null}
        </Card>
      ) : (
        <>
          {/* QR + payment details */}
          <Card title="Pay via PhonePe / UPI" icon={QrCode}>
            <View className="items-center py-2">
              {paymentInfo.qrUrl ? (
                <Image
                  source={{ uri: paymentInfo.qrUrl }}
                  className="h-48 w-48 rounded-xl"
                  resizeMode="contain"
                />
              ) : (
                <View className="h-48 w-48 items-center justify-center rounded-xl border border-dashed border-gray-300">
                  <QrCode size={40} color={colors.textMuted} />
                  <Text className="mt-2 text-xs text-gray-400">QR not set</Text>
                </View>
              )}
            </View>
            <DetailRow
              icon={Smartphone}
              label="PhonePe Number"
              value={formatMobile(paymentInfo.phonepeNumber)}
            />
            <DetailRow icon={AtSign} label="UPI ID" value={paymentInfo.upiId} />
          </Card>

          {/* Instructions */}
          <Card title="How to complete your seva">
            <View className="gap-1.5">
              <Text className="text-gray-600">
                1. Pay ₹{paymentInfo.amount} to the UPI ID / PhonePe number above.
              </Text>
              <Text className="text-gray-600">
                2. Take a screenshot of the successful payment.
              </Text>
              <Text className="text-gray-600">
                3. Upload it below (and add the UPI transaction ID if you have it).
              </Text>
              <Text className="text-gray-600">
                4. Submit — the admin will verify your payment.
              </Text>
            </View>
          </Card>

          {/* Upload */}
          <Card title="Upload payment screenshot" icon={Upload}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                className="mb-3 h-56 w-full rounded-xl"
                resizeMode="contain"
              />
            ) : null}
            <Button
              label={asset ? 'Change screenshot' : 'Choose screenshot'}
              variant="outline"
              leftIcon={Upload}
              onPress={pickScreenshot}
            />

            <View className="mt-4">
              <Input
                label="UPI Transaction ID (optional)"
                icon={Hash}
                placeholder="e.g. 4012xxxxxx"
                value={txnId}
                onChangeText={setTxnId}
              />
            </View>
          </Card>

          {error && <Banner type="error" message={error} onDismiss={() => setError(null)} />}

          <Button
            label="Submit Seva"
            leftIcon={Check}
            size="lg"
            isLoading={submitting}
            onPress={onSubmit}
          />
        </>
      )}

      <Dialog
        visible={successOpen}
        onClose={() => setSuccessOpen(false)}
        icon={BadgeCheck}
        tone="success"
        title="Seva submitted 🙏"
        message="Your payment is now Pending Verification. The admin will verify it shortly."
      />
    </ScrollView>
  );
}
