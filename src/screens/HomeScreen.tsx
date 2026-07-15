import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Flame,
  Target,
  Sparkles,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { Button, Card, ProgressBar } from '../components/ui';
import { colors } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { useMission } from '../hooks/useMission';
import { useAuthStore } from '../store/useAuthStore';
import { AdBanner } from '../components/ads/AdBanner';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const BEADS_PER_MALA = 108;

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
    <View
      className="flex-1 items-center rounded-2xl border border-gray-100 bg-white p-4"
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
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

/** Encouragement message that changes as the devotee progresses. */
function getMilestoneMessage(percent: number, userCount: number): string {
  if (userCount === 0) return 'Begin your seva today — every chant counts.';
  if (percent < 10) return 'A beautiful start. Keep the rhythm going!';
  if (percent < 25) return 'Your dedication is growing, one chant at a time.';
  if (percent < 50) return 'Steady progress — the halfway mark is in sight.';
  if (percent < 75) return 'More than halfway there. Har Har Mahadev!';
  if (percent < 100) return 'The final stretch — your seva is almost complete!';
  return 'Seva complete. Hara Hara Mahadeva!';
}

export function HomeScreen({ navigation }: Props) {
  const mission = useMission();
  const user = useAuthStore(s => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Devotee';

  const hasStarted = mission.userCount > 0;
  const malasCompleted = Math.floor(mission.userCount / BEADS_PER_MALA);

  const milestoneMessage = useMemo(
    () => getMilestoneMessage(mission.percent, mission.userCount),
    [mission.percent, mission.userCount],
  );

  // Refresh the mission totals whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      void mission.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-gray-50"
        // Extra bottom padding so the FAB never covers the last card.
        contentContainerClassName="p-4 pb-28 gap-4 w-full max-w-[600px] self-center"
        refreshControl={
          <RefreshControl
            refreshing={mission.loading}
            onRefresh={mission.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <AdBanner />

        {/* Ad banner scrolls with the content, right under the header */}

        {/* Hero greeting banner with the primary action right where the eye lands */}
        <View className="overflow-hidden rounded-3xl bg-primary p-6">
          <Text
            className="absolute -right-3 -top-6 text-[120px] leading-none text-white/10"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no"
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
              : hasStarted
              ? `${formatNumber(
                  mission.remaining,
                )} chants remain in your 1,00,000 seva.`
              : 'Chant “Om Namah Shivaya” 1,00,000 times to complete your personal seva.'}
          </Text>

          {!mission.completed && (
            <View className="mt-4">
              <Button
                label={hasStarted ? 'Continue Chanting' : 'Start Chanting'}
                leftIcon={Flame}
                size="lg"
                variant="secondary"
                onPress={() => navigation.navigate('Chanting')}
              />
            </View>
          )}
        </View>

        {/* Completed banner sits near the top so the celebration is seen first */}
        {mission.completed && (
          <View
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4"
            accessible
            accessibilityLabel="Mission complete. Hara Hara Mahadeva!"
          >
            <CheckCircle2 size={20} color={colors.success} />
            <Text className="font-semibold text-green-700">
              Mission complete — Hara Hara Mahadeva! 🎉
            </Text>
          </View>
        )}

        {/* Personal progress — the single source of truth for your numbers */}
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
          <Text className="mt-3 text-xs leading-4 text-gray-500">
            {milestoneMessage}
          </Text>
        </View>

        {/* Stat tiles — complementary stats instead of repeating the card above */}
        <View className="flex-row gap-3">
          <Stat
            icon={Flame}
            label="Malas completed"
            value={formatNumber(malasCompleted)}
          />
          <Stat
            icon={Sparkles}
            label="Beads this mala"
            value={`${mission.userCount % BEADS_PER_MALA} / ${BEADS_PER_MALA}`}
          />
          <Stat
            icon={Target}
            label="Seva goal"
            value={formatNumber(mission.target)}
          />
        </View>

        {/* Community mission — shared 11 Crore goal */}
        <View className="overflow-hidden rounded-2xl bg-primary-light p-5">
          <View className="flex-row items-center gap-2">
            <Users size={16} color={colors.primary} />
            <Text className="text-xs font-semibold uppercase tracking-wide text-primary-dark">
              Community Mission · 11 Crore
            </Text>
          </View>
          <View className="mt-2 flex-row items-end justify-between">
            <Text className="text-3xl font-extrabold text-gray-900">
              {formatNumber(mission.communityTotal)}
            </Text>
            <Text className="text-sm text-gray-600">
              of {formatNumber(mission.communityTarget)}
            </Text>
          </View>
          <View className="mt-3">
            <ProgressBar value={mission.communityPercent} />
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="text-xs font-medium text-primary-dark">
              {mission.communityPercent < 0.01
                ? '<0.01'
                : mission.communityPercent.toFixed(2)}
              % complete
            </Text>
            <Text className="text-xs text-gray-600">
              {formatNumber(mission.communityRemaining)} to go
            </Text>
          </View>
          <Text className="mt-3 text-xs leading-4 text-gray-500">
            Every devotee’s chants add up to our shared goal of 11,00,00,000 “Om
            Namah Shivaya”.
          </Text>
        </View>

        {/* How it works — only shown until the devotee gets going */}
        {!hasStarted && (
          <Card title="Your Seva">
            <Text className="text-base leading-6 text-gray-600">
              Chant “Om Namah Shivaya” 1,00,000 times to complete your personal
              seva. Add your count any time — there’s no daily limit.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
