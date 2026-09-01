import React from 'react';
import { Text, View } from 'react-native';
import { Award, Trophy } from 'lucide-react-native';

import { ProgressBar } from '../ui';
import { colors } from '../../constants/theme';
import { formatNumber } from '../../utils/format';
import { useMission } from '../../hooks/useMission';

/**
 * A row of dots, one per level, filled up to the level the devotee has reached.
 * Gives the whole journey at a glance without listing every threshold.
 */
function Ladder({ total, index }: { total: number; index: number }) {
  return (
    <View className="mt-4 flex-row items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const done = i + 1 < index;
        const current = i + 1 === index;
        return (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              done ? 'bg-primary' : current ? 'bg-primary/50' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </View>
  );
}

/**
 * The devotee's current level, with progress WITHIN that level.
 *
 * The level bar deliberately measures the current level only — "2,300 to
 * Sadhaka" is a goal a devotee can reach this week, where "8,97,700 to the end"
 * is not. The whole-journey view lives in the Home progress card.
 */
export function LevelCard() {
  const {
    userCount,
    level,
    levelIndex,
    levelTotal,
    nextLevel,
    levelPercent,
    inLevel,
    levelSize,
    toNextLevel,
    ceiling,
    atCeiling,
  } = useMission();

  // The whole ladder is finished — celebrate rather than show an empty bar.
  if (atCeiling) {
    return (
      <View className="overflow-hidden rounded-2xl border border-green-200 bg-green-50 p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-green-100">
            <Trophy size={22} color={colors.success} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-green-800">
              {level.name} — complete
            </Text>
            <Text className="mt-0.5 text-xs text-green-700">
              All {formatNumber(ceiling)} chants offered. Hara Hara Mahadeva! 🎉
            </Text>
          </View>
        </View>
        <Ladder total={levelTotal} index={levelTotal + 1} />
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <View className="flex-row items-center gap-3">
        {/* Level badge */}
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
          <Text className="text-lg font-extrabold text-primary-dark">
            {levelIndex}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-extrabold text-gray-900"
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {level.name}
          </Text>
          <Text className="text-xs text-gray-500">
            Level {levelIndex} of {levelTotal} · {formatNumber(level.from)}–
            {formatNumber(level.to)}
          </Text>
        </View>
        <Award size={20} color={colors.gold} />
      </View>

      <View className="mt-4">
        <ProgressBar value={levelPercent} height={10} />
      </View>

      <View className="mt-2 flex-row justify-between">
        <Text className="shrink-0 text-xs font-medium text-primary-dark">
          {formatNumber(inLevel)} / {formatNumber(levelSize)} in this level
        </Text>
        <Text className="shrink pl-2 text-right text-xs text-gray-500">
          {nextLevel
            ? `${formatNumber(toNextLevel)} to ${nextLevel.name}`
            : `${formatNumber(Math.max(0, ceiling - userCount))} to finish`}
        </Text>
      </View>

      <Ladder total={levelTotal} index={levelIndex} />
    </View>
  );
}
