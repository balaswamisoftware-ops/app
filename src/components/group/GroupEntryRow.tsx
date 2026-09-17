import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CloudUpload, Flame, Undo2 } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { formatDateTime, formatNumber } from '../../utils/format';

/** Local calendar day of an ISO timestamp, e.g. "2026-09-17". */
export function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** "Today" / "Yesterday" / "Earlier" for grouping entry lists. */
export function dayBucket(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day = localDay(iso);
  if (day === localDay(now.toISOString())) return 'Today';
  if (day === localDay(yesterday.toISOString())) return 'Yesterday';
  return 'Earlier';
}

/**
 * One chant entry a group leader made — confirmed, undone, or still waiting to
 * sync from this phone. `showName` is off on a member's own page.
 */
export function GroupEntryRow({
  name,
  amount,
  createdAt,
  state,
  canUndo = false,
  onUndo,
  showName = true,
}: {
  name: string;
  amount: number;
  createdAt: string;
  state: 'synced' | 'undone' | 'pending';
  canUndo?: boolean;
  onUndo?: () => void;
  showName?: boolean;
}) {
  const pending = state === 'pending';
  const undone = state === 'undone';

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          pending ? 'bg-amber-50' : undone ? 'bg-gray-100' : 'bg-primary-light'
        }`}
      >
        {pending ? (
          <CloudUpload size={18} color={colors.gold} />
        ) : undone ? (
          <Undo2 size={18} color={colors.textMuted} />
        ) : (
          <Flame size={18} color={colors.primary} />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
          {showName ? name : pending ? 'Waiting to sync' : undone ? 'Undone' : 'Recorded'}
        </Text>
        <Text className="text-xs text-gray-500">
          {formatDateTime(createdAt)}
          {showName && pending ? ' · waiting to sync' : ''}
          {showName && undone ? ' · undone' : ''}
        </Text>
      </View>

      <View className="items-end gap-1">
        <Text
          className={`text-base font-bold ${
            undone ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          +{formatNumber(amount)}
        </Text>
        {canUndo && onUndo ? (
          <Pressable
            onPress={onUndo}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Undo ${formatNumber(amount)} chants for ${name}`}
            className="flex-row items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 active:bg-gray-200"
          >
            <Undo2 size={12} color={colors.textSecondary} />
            <Text className="text-xs font-semibold text-gray-700">Undo</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
