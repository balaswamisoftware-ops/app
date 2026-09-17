import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Award, ChevronRight } from 'lucide-react-native';

import { colors } from '../../constants/theme';
import { readyCount, useCertificateStore } from '../../store/useCertificateStore';

/**
 * Home card that appears once the devotee has a certificate to download —
 * placed under the level card, where they already look at their progress.
 * Renders nothing otherwise.
 */
export function CertificateReadyCard({ onPress }: { onPress: () => void }) {
  const data = useCertificateStore(s => s.data);
  const ready = readyCount(data);
  if (ready === 0 || !data) return null;

  const latest = [...data.levels].reverse().find(l => l.certificate !== null);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View your certificates"
      className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
        <Award size={22} color={colors.gold} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">
          {ready === 1 ? 'Your certificate is ready' : `${ready} certificates ready`}
        </Text>
        <Text className="text-xs text-gray-600">
          {latest ? `Download your ${latest.name} certificate` : 'Tap to view and download'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}
