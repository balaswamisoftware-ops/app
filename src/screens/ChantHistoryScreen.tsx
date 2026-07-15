import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  NativeModules,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronDown,
  ChevronRight,
  Flame,
  History,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

// Enable smooth collapse/expand animation on Android (old architecture).
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Banner } from '../components/ui';
import { colors } from '../constants/theme';
import { formatDateTime, formatNumber } from '../utils/format';
import { useChantHistory } from '../hooks/useChantHistory';
import { AdBanner } from '../components/ads/AdBanner';
import { FullScreenAdGate } from '../components/ads/FullScreenAdGate';
import type { ChantLog } from '../types/mission';

// A full-screen ad plays when the history opens; a cooldown stops it re-showing
// on quick tab toggles.
const ADS_AVAILABLE = Boolean(NativeModules.RNGoogleMobileAdsModule);
const AD_GATE_COOLDOWN_MS = 90_000;
let lastGateAt = 0;

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Section {
  title: string;
  net: number;
  data: ChantLog[];
}

/** Bucket logs (already newest-first) into Today / Yesterday / This Month /
 *  Last Month / older months by name. Order follows recency naturally. */
function groupLogs(logs: ChantLog[]): Section[] {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const order: string[] = [];
  const map: Record<string, Section> = {};

  for (const log of logs) {
    const t = new Date(log.createdAt).getTime();
    let title: string;
    if (Number.isNaN(t)) title = 'Earlier';
    else if (t >= startToday) title = 'Today';
    else if (t >= startYesterday) title = 'Yesterday';
    else if (t >= startMonth) title = 'This Month';
    else if (t >= startLastMonth) title = 'Last Month';
    else {
      const d = new Date(t);
      title = `${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (!map[title]) {
      map[title] = { title, net: 0, data: [] };
      order.push(title);
    }
    map[title].data.push(log);
    map[title].net += log.amount;
  }
  return order.map(k => map[k]);
}

/** Per-entry presentation, driven by the entry kind + sign. */
function entryStyle(item: ChantLog): {
  Icon: LucideIcon;
  iconColor: string;
  chip: string;
  label: string;
} {
  if (item.kind === 'reset') {
    return { Icon: RotateCcw, iconColor: colors.danger, chip: 'bg-red-50', label: 'Reset by admin' };
  }
  if (item.kind === 'adjust') {
    return {
      Icon: SlidersHorizontal,
      iconColor: colors.textSecondary,
      chip: 'bg-gray-100',
      label: 'Adjusted by admin',
    };
  }
  return { Icon: Flame, iconColor: colors.primary, chip: 'bg-primary-light', label: 'Chant added' };
}

function LogRow({ item }: { item: ChantLog }) {
  const { Icon, iconColor, chip, label } = entryStyle(item);
  const positive = item.amount >= 0;
  const amountText = `${positive ? '+' : '−'}${formatNumber(Math.abs(item.amount))}`;
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
      <View className={`h-10 w-10 items-center justify-center rounded-xl ${chip}`}>
        <Icon size={19} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{label}</Text>
        <Text className="mt-0.5 text-xs text-gray-500">
          {formatDateTime(item.createdAt)}
        </Text>
      </View>
      <Text
        className={`text-base font-bold ${
          positive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {amountText}
      </Text>
    </View>
  );
}

export function ChantHistoryScreen() {
  const { logs, total, loading, error, refresh } = useChantHistory();
  const grouped = useMemo(() => groupLogs(logs), [logs]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [showAd, setShowAd] = useState(false);

  // Play the full-screen ad when the history opens (respecting the cooldown).
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (ADS_AVAILABLE && now - lastGateAt > AD_GATE_COOLDOWN_MS) {
        lastGateAt = now;
        setShowAd(true);
      }
    }, []),
  );

  const toggle = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(c => ({ ...c, [title]: !c[title] }));
  };

  // A collapsed group keeps its header (count + net) but drops its rows.
  const sections = useMemo(
    () =>
      grouped.map(s => ({
        ...s,
        count: s.data.length,
        data: collapsed[s.title] ? [] : s.data,
      })),
    [grouped, collapsed],
  );

  if (loading && logs.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-3 text-gray-500">Loading your history…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Total header */}
      <View className="m-4 w-full max-w-[600px] flex-row items-center gap-3 self-center rounded-2xl border border-gray-100 bg-white p-5">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
          <Flame size={22} color={colors.textSecondary} />
        </View>
        <View>
          <Text className="text-sm text-gray-500">Total chanted</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {formatNumber(total)}
          </Text>
        </View>
      </View>

      {error ? (
        <View className="mx-4 mb-2">
          <Banner type="error" message={error} />
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="px-4 pb-8 w-full max-w-[600px] self-center"
        ListHeaderComponent={<AdBanner className="mb-2" />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderSectionHeader={({ section }) => {
          const isCollapsed = collapsed[section.title];
          const Chevron = isCollapsed ? ChevronRight : ChevronDown;
          return (
            <Pressable
              onPress={() => toggle(section.title)}
              className="mb-1.5 mt-4 flex-row items-center justify-between rounded-lg py-1 active:opacity-60"
            >
              <View className="flex-row items-center gap-1">
                <Chevron size={15} color={colors.textMuted} />
                <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {section.title}
                </Text>
                <Text className="text-xs text-gray-400"> · {section.count}</Text>
              </View>
              <Text className="text-xs font-medium text-gray-400">
                {section.net >= 0 ? '+' : '−'}
                {formatNumber(Math.abs(section.net))}
              </Text>
            </Pressable>
          );
        }}
        renderItem={({ item }) => <LogRow item={item} />}
        ListEmptyComponent={
          <View className="mt-16 items-center gap-3">
            <History size={40} color={colors.textMuted} />
            <Text className="text-gray-500">No chants added yet.</Text>
          </View>
        }
      />

      <FullScreenAdGate visible={showAd} onClose={() => setShowAd(false)} />
    </View>
  );
}
