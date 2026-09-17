import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { Button, Card, ProgressBar } from '../components/ui';
import { colors } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { useMission } from '../hooks/useMission';
import { useLocationPrompt } from '../hooks/useLocationPrompt';
import { useAuthStore } from '../store/useAuthStore';
import { AdBanner } from '../components/ads/AdBanner';
import { LevelCard } from '../components/chant/LevelCard';
import { CertificateReadyCard } from '../components/certificate/CertificateReadyCard';
import { useCertificateStore } from '../store/useCertificateStore';
import { DevotionalAudioCard } from '../components/audio/DevotionalAudioCard';
import {
  AnnouncementCard,
  MissionPausedCard,
} from '../components/notice/AnnouncementCard';
import { useNoticeStore } from '../store/useNoticeStore';

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
      <Text className="text-center text-xs text-gray-500">{label}</Text>
    </View>
  );
}

/**
 * Encouragement message that changes as the devotee progresses. `percent` is
 * progress within the CURRENT level, so the message keeps pace with the goal the
 * devotee is actually chasing rather than fading out after the first lakh.
 */
function getMilestoneMessage(
  percent: number,
  userCount: number,
  nextLevelName: string | null,
): string {
  if (userCount === 0) return 'Begin your seva today — every chant counts.';
  if (!nextLevelName && percent >= 100) return 'Seva complete. Hara Hara Mahadeva!';
  if (percent < 10) return 'A beautiful start. Keep the rhythm going!';
  if (percent < 25) return 'Your dedication is growing, one chant at a time.';
  if (percent < 50) return 'Steady progress — the halfway mark is in sight.';
  if (percent < 75) return 'More than halfway there. Har Har Mahadev!';
  return nextLevelName
    ? `The final stretch — ${nextLevelName} is almost yours!`
    : 'The final stretch — your seva is almost complete!';
}

export function HomeScreen({ navigation }: Props) {
  // Ask for location once per app version, on first entry after an update.
  useLocationPrompt();
  const mission = useMission();
  const user = useAuthStore(s => s.user);
  const missionActive = useNoticeStore(s => s.missionActive);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Devotee';

  const hasStarted = mission.userCount > 0;
  const malasCompleted = Math.floor(mission.userCount / BEADS_PER_MALA);

  const milestoneMessage = useMemo(
    () =>
      getMilestoneMessage(
        mission.levelPercent,
        mission.userCount,
        mission.nextLevel?.name ?? null,
      ),
    [mission.levelPercent, mission.userCount, mission.nextLevel],
  );

  // Refresh the mission totals whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      void mission.refresh();
      void useCertificateStore.getState().load();
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

        {/* Admin broadcast + mission pause notice — above everything, because
            they change what the devotee can do on this screen. */}
        <AnnouncementCard />
        <MissionPausedCard />

        {/* Admin-managed devotional audio (shown only when enabled) */}
        <DevotionalAudioCard />

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
            {mission.atCeiling
              ? `All ${formatNumber(
                  mission.ceiling,
                )} chants are complete. Hara Hara Mahadeva!`
              : hasStarted
              ? mission.nextLevel
                ? `${formatNumber(mission.toNextLevel)} chants to reach ${
                    mission.nextLevel.name
                  }.`
                : `${formatNumber(
                    mission.roomLeft,
                  )} chants remain in your final level.`
              : `Chant “Om Namah Shivaya” ${formatNumber(
                  mission.level.to,
                )} times to reach ${mission.level.name}.`}
          </Text>

          {/* Shown even once a level is finished: this is the only route into the
              Chanting screen. Only the ceiling actually closes it. */}
          <View className="mt-4">
            <Button
              label={
                !missionActive
                  ? 'Chanting paused'
                  : mission.atCeiling
                  ? 'All chants complete'
                  : hasStarted
                  ? 'Continue Chanting'
                  : 'Start Chanting'
              }
              leftIcon={Flame}
              size="lg"
              variant="secondary"
              disabled={!missionActive || mission.atCeiling}
              onPress={() => navigation.navigate('Chanting')}
            />
          </View>
        </View>

        {/* Completed banner sits near the top so the celebration is seen first */}
        {mission.atCeiling && (
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

        {/* The level ladder — the near-term goal, above the whole-journey card */}
        <LevelCard />

        {/* A certificate to download sits right under the level it celebrates. */}
        <CertificateReadyCard onPress={() => navigation.navigate('Certificates')} />

        {/* Personal progress — the single source of truth for your numbers */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-xs uppercase tracking-wide text-gray-400">
                Your progress
              </Text>
              <Text
                className="mt-0.5 text-3xl font-bold text-gray-900"
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formatNumber(mission.userCount)}
              </Text>
            </View>
            {/* Measured against the CEILING, so this card and the level card
                never tell the devotee two different stories. */}
            <Text className="shrink-0 text-sm text-gray-400">
              of {formatNumber(mission.ceiling)}
            </Text>
          </View>
          <View className="mt-3">
            <ProgressBar value={mission.ceilingPercent} />
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="shrink-0 text-xs font-medium text-primary-dark">
              {mission.atCeiling
                ? 'Completed'
                : `${mission.ceilingPercent.toFixed(1)}% complete`}
            </Text>
            <Text className="shrink pl-2 text-right text-xs text-gray-500">
              {mission.atCeiling
                ? 'Every level finished'
                : `${formatNumber(mission.roomLeft)} remaining`}
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
            icon={Award}
            label={`Level ${mission.levelIndex} of ${mission.levelTotal}`}
            value={mission.level.name}
          />
        </View>

        {/* // Community mission — shared 11 Crore goal
        <View className="overflow-hidden rounded-2xl bg-primary-light p-5">
          <View className="flex-row items-center gap-2">
            <Users size={16} color={colors.primary} />
            <Text className="flex-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              Community Mission · 11 Crore
            </Text>
          </View>
          <View className="mt-2 flex-row items-end justify-between">
            <Text
              className="shrink text-3xl font-extrabold text-gray-900"
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {formatNumber(mission.communityTotal)}
            </Text>
            <Text className="shrink-0 pl-2 text-sm text-gray-600">
              of {formatNumber(mission.communityTarget)}
            </Text>
          </View>
          <View className="mt-3">
            <ProgressBar value={mission.communityPercent} />
          </View>
          <View className="mt-2 flex-row justify-between">
            <Text className="shrink-0 text-xs font-medium text-primary-dark">
              {mission.communityPercent < 0.01
                ? '<0.01'
                : mission.communityPercent.toFixed(2)}
              % complete
            </Text>
            <Text className="shrink pl-2 text-right text-xs text-gray-600">
              {formatNumber(mission.communityRemaining)} to go
            </Text>
          </View>
          <Text className="mt-3 text-xs leading-4 text-gray-500">
            Every devotee’s chants add up to our shared goal of 11,00,00,000 “Om
            Namah Shivaya”.
          </Text>
        </View> */}

        {/* How it works — only shown until the devotee gets going */}
        {!hasStarted && (
          <Card title="Your Seva">
            <Text className="text-base leading-6 text-gray-600">
              Chant “Om Namah Shivaya” through {mission.levelTotal} levels, from{' '}
              {mission.levels[0]?.name} up to {formatNumber(mission.ceiling)}{' '}
              chants. Add your count any time — there’s no daily limit.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
