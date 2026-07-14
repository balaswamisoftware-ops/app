import React, { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Flame, Target, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { Button, Card, ProgressBar } from '../components/ui';
import { colors } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { useMission } from '../hooks/useMission';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-gray-100 bg-white p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
        <Icon size={18} color={colors.textSecondary} />
      </View>
      <Text
        className="mt-2 text-lg font-bold text-gray-900"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const mission = useMission();
  const user = useAuthStore(s => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Devotee';

  // Refresh the mission totals whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      void mission.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
      refreshControl={
        <RefreshControl
          refreshing={mission.loading}
          onRefresh={mission.refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Hero greeting banner */}
      <View className="overflow-hidden rounded-3xl bg-primary p-6">
        <Text
          className="absolute -right-3 -top-6 text-[120px] leading-none text-white/10"
          pointerEvents="none"
        >
          🕉
        </Text>
        <Text className="text-xs font-medium uppercase tracking-widest text-white/80">
          Om Namah Shivaya
        </Text>
        <Text className="mt-1 text-2xl font-extrabold text-white">
          Namaste, {firstName} 🙏
        </Text>
        <Text className="mt-1 text-sm leading-5 text-white/90">
          {mission.completed
            ? 'You have completed your personal seva. Hara Hara Mahadeva!'
            : `${formatNumber(mission.remaining)} chants remain in your 1,00,000 seva.`}
        </Text>
      </View>

      {/* Progress card */}
      <View className="rounded-2xl border border-gray-100 bg-white p-5">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-xs uppercase tracking-wide text-gray-400">
              Your progress
            </Text>
            <Text className="mt-0.5 text-3xl font-bold text-gray-900">
              {formatNumber(mission.userCount)}
            </Text>
          </View>
          <Text className="text-sm text-gray-400">
            of {formatNumber(mission.target)}
          </Text>
        </View>
        <View className="mt-3">
          <ProgressBar value={mission.percent} />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs font-medium text-primary-dark">
            {mission.percent.toFixed(1)}% complete
          </Text>
          <Text className="text-xs text-gray-500">
            {formatNumber(mission.remaining)} remaining
          </Text>
        </View>
      </View>

      {/* Stat tiles */}
      <View className="flex-row gap-3">
        <Stat icon={Flame} label="Your chants" value={formatNumber(mission.userCount)} />
        <Stat icon={Sparkles} label="Remaining" value={formatNumber(mission.remaining)} />
        <Stat icon={Target} label="Goal" value={formatNumber(mission.target)} />
      </View>

      {/* Mission description */}
      <Card title="Your Seva">
        <Text className="text-base leading-6 text-gray-600">
          Chant “Om Namah Shivaya” 1,00,000 times to complete your personal seva.
          Add your count any time — there’s no daily limit.
        </Text>
      </Card>

      {mission.completed ? (
        <View className="flex-row items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={20} color={colors.success} />
          <Text className="font-semibold text-green-700">
            Mission complete — Hara Hara Mahadeva! 🎉
          </Text>
        </View>
      ) : (
        <Button
          label="Start Chanting"
          leftIcon={Flame}
          size="lg"
          onPress={() => navigation.navigate('Chanting')}
        />
      )}
    </ScrollView>
  );
}
