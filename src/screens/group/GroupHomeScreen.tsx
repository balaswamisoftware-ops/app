import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronRight,
  CloudUpload,
  History,
  PauseCircle,
  Search,
  UserPlus,
  Users,
} from 'lucide-react-native';

import type { GroupStackParamList } from '../../navigation/AppNavigator';
import { Banner, Button, Input } from '../../components/ui';
import { colors } from '../../constants/theme';
import { formatMobile, formatNumber } from '../../utils/format';
import { levelFor } from '../../constants/levels';
import { chantCeiling, useChantLevelStore } from '../../store/useChantLevelStore';
import { pendingFor, useGroupStore } from '../../store/useGroupStore';
import { localDay } from '../../components/group/GroupEntryRow';

type Props = NativeStackScreenProps<GroupStackParamList, 'GroupHome'>;

/**
 * A Devotee Admin's home: the group at a glance, anything still waiting to
 * sync, and every member — tap one to record chants.
 */
export function GroupHomeScreen({ navigation }: Props) {
  const status = useGroupStore(s => s.status);
  const members = useGroupStore(s => s.members);
  const entries = useGroupStore(s => s.entries);
  const pending = useGroupStore(s => s.pending);
  const loading = useGroupStore(s => s.loadingMembers);
  const error = useGroupStore(s => s.error);
  const syncNotice = useGroupStore(s => s.syncNotice);
  const levels = useChantLevelStore(s => s.levels);

  const [query, setQuery] = useState('');

  const refresh = useCallback(() => {
    const g = useGroupStore.getState();
    void g.loadStatus();
    void g.loadMembers();
    void g.loadEntries();
    void g.flush();
  }, []);

  useFocusEffect(refresh);

  const suspended = status?.isDevoteeAdmin === true && !status.isActive;
  const ceiling = chantCeiling();

  // What the leader sees = server total + anything still queued on this phone.
  const shown = useCallback(
    (userId: string, count: number) => Math.min(ceiling, count + pendingFor(pending, userId)),
    [pending, ceiling],
  );

  const groupTotal = members.reduce((sum, m) => sum + shown(m.userId, m.count), 0);
  const today = localDay(new Date().toISOString());
  const recordedToday =
    entries
      .filter(e => !e.undone && localDay(e.createdAt) === today)
      .reduce((sum, e) => sum + e.amount, 0) +
    pending.filter(p => localDay(p.createdAt) === today).reduce((sum, p) => sum + p.delta, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    if (!q) return members;
    return members.filter(
      m =>
        m.fullName.toLowerCase().includes(q) ||
        (digits.length >= 3 && m.mobile.includes(digits)),
    );
  }, [members, query]);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="p-4 pb-10 gap-4 w-full max-w-[600px] self-center"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {suspended && (
        <View className="flex-row items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <PauseCircle size={20} color={colors.gold} />
          <Text className="flex-1 text-sm leading-5 text-amber-900">
            Your devotee admin role is suspended. You can see your group, but you can’t add
            devotees or record chants until a portal admin reactivates you.
          </Text>
        </View>
      )}

      {/* Group at a glance */}
      <View className="overflow-hidden rounded-3xl bg-primary p-5">
        <Text className="text-xs font-medium uppercase tracking-widest text-white/80">
          Your group
        </Text>
        <Text className="mt-1 text-2xl font-extrabold text-white">
          {formatNumber(members.length)} {members.length === 1 ? 'devotee' : 'devotees'}
        </Text>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white/15 p-3">
            <Text className="text-xs text-white/80">Group chants</Text>
            <Text className="mt-0.5 text-lg font-bold text-white" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(groupTotal)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/15 p-3">
            <Text className="text-xs text-white/80">Recorded today</Text>
            <Text className="mt-0.5 text-lg font-bold text-white" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(recordedToday)}
            </Text>
          </View>
        </View>
      </View>

      {pending.length > 0 && (
        <View className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <CloudUpload size={20} color={colors.gold} />
          <Text className="flex-1 text-sm text-amber-900">
            {pending.length === 1
              ? '1 entry is waiting to sync.'
              : `${formatNumber(pending.length)} entries are waiting to sync.`}{' '}
            It will be sent automatically when you’re online.
          </Text>
          <Pressable
            onPress={() => void useGroupStore.getState().flush()}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-primary">Sync now</Text>
          </Pressable>
        </View>
      )}

      {syncNotice ? (
        <Banner
          type="info"
          message={syncNotice}
          onDismiss={() => useGroupStore.getState().dismissNotice()}
        />
      ) : null}
      {error ? <Banner type="error" message={error} /> : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            label="Add devotee"
            leftIcon={UserPlus}
            disabled={suspended}
            onPress={() => navigation.navigate('GroupAddMember')}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Recent entries"
            leftIcon={History}
            variant="outline"
            onPress={() => navigation.navigate('GroupEntries')}
          />
        </View>
      </View>

      {members.length > 5 && (
        <Input
          icon={Search}
          placeholder="Search by name or mobile"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      )}

      {members.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white p-8">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light">
            <Users size={22} color={colors.primary} />
          </View>
          <Text className="mt-3 text-base font-semibold text-gray-900">
            {loading ? 'Loading your group…' : 'No devotees yet'}
          </Text>
          {!loading && (
            <Text className="mt-1 text-center text-sm leading-5 text-gray-500">
              Register the devotees you chant for. Then tap any of them to record their chants.
            </Text>
          )}
        </View>
      ) : filtered.length === 0 ? (
        <Text className="py-6 text-center text-sm text-gray-500">
          No devotee matches “{query}”.
        </Text>
      ) : (
        <View className="gap-2">
          {filtered.map(m => {
            const count = shown(m.userId, m.count);
            const waiting = pendingFor(pending, m.userId) > 0;
            return (
              <Pressable
                key={m.userId}
                onPress={() => navigation.navigate('GroupMember', { userId: m.userId })}
                accessibilityRole="button"
                accessibilityLabel={`${m.fullName}, ${formatNumber(count)} chants`}
                className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 active:bg-gray-50"
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
                  <Text className="text-base font-bold text-primary">
                    {m.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
                    {m.fullName}
                  </Text>
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    {formatMobile(m.mobile)} · {levelFor(count, levels).name}
                    {m.isBlocked ? ' · blocked' : ''}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-gray-900">{formatNumber(count)}</Text>
                  {waiting && <Text className="text-[11px] text-amber-700">syncing</Text>}
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
