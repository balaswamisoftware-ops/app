import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Flame, History } from 'lucide-react-native';

import { Banner } from '../components/ui';
import { colors } from '../constants/theme';
import { formatDateTime, formatNumber } from '../utils/format';
import { useChantHistory } from '../hooks/useChantHistory';

export function ChantHistoryScreen() {
  const { logs, total, loading, error, refresh } = useChantHistory();

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

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        contentContainerClassName="px-4 pb-8 gap-2 w-full max-w-[600px] self-center"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5">
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                +{formatNumber(item.amount)} chant{item.amount === 1 ? '' : 's'}
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {formatDateTime(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="mt-16 items-center gap-3">
            <History size={40} color={colors.textMuted} />
            <Text className="text-gray-500">No chants added yet.</Text>
          </View>
        }
      />
    </View>
  );
}
