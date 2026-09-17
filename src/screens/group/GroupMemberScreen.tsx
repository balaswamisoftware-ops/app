import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle2, Flame, Hash, Undo2, UserX } from 'lucide-react-native';

import type { GroupStackParamList } from '../../navigation/AppNavigator';
import { Banner, Button, Dialog, Input, ProgressBar } from '../../components/ui';
import { GroupEntryRow } from '../../components/group/GroupEntryRow';
import { colors } from '../../constants/theme';
import { levelProgress } from '../../constants/levels';
import { formatMobile, formatNumber } from '../../utils/format';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useChantLevelStore } from '../../store/useChantLevelStore';
import { useNoticeStore } from '../../store/useNoticeStore';
import { pendingFor, useGroupStore } from '../../store/useGroupStore';
import type { GroupEntry } from '../../types/group';

type Props = NativeStackScreenProps<GroupStackParamList, 'GroupMember'>;

const PRESETS = [108, 216, 1008];

/** Amounts at or above this ask for confirmation — a slip here is costly. */
const CONFIRM_FROM = 1008;

/**
 * One member of the leader's group: where they stand, a fast way to record
 * their chants, and the leader's recent entries for them with Undo.
 */
export function GroupMemberScreen({ navigation, route }: Props) {
  const { userId, justAdded } = route.params;
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const member = useGroupStore(s => s.members.find(m => m.userId === userId));
  const status = useGroupStore(s => s.status);
  const pending = useGroupStore(s => s.pending);
  const entries = useGroupStore(s => s.entries);
  const levels = useChantLevelStore(s => s.levels);
  const missionActive = useNoticeStore(s => s.missionActive);

  const [custom, setCustom] = useState('');
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [undoTarget, setUndoTarget] = useState<GroupEntry | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    justAdded
      ? {
          type: 'success',
          text: 'Devotee registered. If they want to use the app themselves later, they can sign in with “Forgot password” using this mobile number and name.',
        }
      : null,
  );

  useLayoutEffect(() => {
    if (member) navigation.setOptions({ title: member.fullName });
  }, [navigation, member]);

  const waiting = pendingFor(pending, userId);
  const progress = levelProgress((member?.count ?? 0) + waiting, levels);
  const shownCount = Math.min(progress.ceiling, (member?.count ?? 0) + waiting);

  const myEntries = useMemo(
    () => entries.filter(e => e.memberUserId === userId),
    [entries, userId],
  );
  const myPending = pending.filter(p => p.memberUserId === userId);

  if (!member) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <UserX size={32} color={colors.textMuted} />
        <Text className="mt-3 text-center text-base font-semibold text-gray-900">
          This devotee isn’t in your group any more
        </Text>
        <Text className="mt-1 text-center text-sm text-gray-500">
          A portal admin may have moved them to another group.
        </Text>
        <View className="mt-5 w-full max-w-[280px]">
          <Button label="Back to group" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const blockedReason = status && !status.isActive
    ? 'Your devotee admin role is suspended, so chants can’t be recorded.'
    : !missionActive
      ? 'The chant mission is paused right now.'
      : member.isBlocked
        ? 'This devotee is blocked, so chants can’t be recorded for them.'
        : progress.atCeiling
          ? `${member.fullName} has completed all ${formatNumber(progress.ceiling)} chants.`
          : null;
  const canRecord = blockedReason === null;

  const customValue = Math.floor(Number(custom.replace(/\D/g, '')) || 0);
  const customTooBig = customValue > progress.roomLeft;

  const record = (amount: number) => {
    const n = Math.min(amount, progress.roomLeft);
    if (!(n > 0)) return;
    useGroupStore.getState().record(member, n);
    setCustom('');
    setMessage({
      type: 'success',
      text:
        n < amount
          ? `Recorded ${formatNumber(n)} chants — the most ${member.fullName} can still add.`
          : `Recorded ${formatNumber(n)} chants for ${member.fullName}.`,
    });
  };

  const requestRecord = (amount: number) => {
    if (amount >= CONFIRM_FROM) setConfirmAmount(amount);
    else record(amount);
  };

  const doUndo = async (entry: GroupEntry) => {
    try {
      await useGroupStore.getState().undo(entry);
      setMessage({ type: 'success', text: `Undid ${formatNumber(entry.amount)} chants.` });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Could not undo.' });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 + keyboardHeight }}
        keyboardShouldPersistTaps="handled"
      >
        {message ? (
          <Banner type={message.type} message={message.text} onDismiss={() => setMessage(null)} />
        ) : null}

        {/* Where they stand */}
        <View className="rounded-2xl border border-gray-100 bg-white p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light">
              <Text className="text-lg font-bold text-primary">
                {member.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                {member.fullName}
              </Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {formatMobile(member.mobile)} · {member.nakshatram} · {member.gothram}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row items-end justify-between">
            <View>
              <Text className="text-xs uppercase tracking-wide text-gray-400">Total chants</Text>
              <Text className="text-3xl font-extrabold text-gray-900">{formatNumber(shownCount)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-gray-400">
                Level {progress.index} of {progress.total}
              </Text>
              <Text className="text-base font-semibold text-primary">{progress.current.name}</Text>
            </View>
          </View>
          <ProgressBar value={progress.percent} height={10} className="mt-3" />
          <Text className="mt-2 text-xs text-gray-500">
            {progress.atCeiling
              ? 'All chants complete.'
              : progress.next
                ? `${formatNumber(progress.toNext)} chants to reach ${progress.next.name}`
                : `${formatNumber(progress.roomLeft)} chants left in the final level`}
            {waiting > 0 ? ` · ${formatNumber(waiting)} waiting to sync` : ''}
          </Text>
        </View>

        {/* Record */}
        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="mb-3 text-sm font-semibold text-gray-900">Record chants</Text>

          {!canRecord ? (
            <View className="flex-row items-start gap-2 rounded-xl bg-gray-50 p-3">
              <CheckCircle2 size={16} color={colors.textMuted} />
              <Text className="flex-1 text-sm text-gray-600">{blockedReason}</Text>
            </View>
          ) : (
            <>
              <View className="flex-row gap-2">
                {PRESETS.filter(n => n <= progress.roomLeft).map(n => (
                  <Pressable
                    key={n}
                    onPress={() => requestRecord(n)}
                    accessibilityRole="button"
                    accessibilityLabel={`Record ${n} chants`}
                    className="flex-1 items-center rounded-xl border border-gray-200 bg-white py-3 active:bg-gray-50"
                  >
                    <Text className="text-lg font-semibold text-gray-900">+{formatNumber(n)}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="mb-1.5 mt-4 text-sm font-medium text-gray-700">Custom count</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <Input
                    icon={Hash}
                    placeholder="e.g. 540"
                    keyboardType="number-pad"
                    value={custom}
                    onChangeText={v => setCustom(v.replace(/\D/g, '').slice(0, 7))}
                    returnKeyType="done"
                    onSubmitEditing={() => customValue > 0 && !customTooBig && requestRecord(customValue)}
                  />
                </View>
                <Button
                  label="Record"
                  leftIcon={Flame}
                  disabled={customValue <= 0 || customTooBig}
                  onPress={() => requestRecord(customValue)}
                />
              </View>
              <Text className={`mt-1.5 text-xs ${customTooBig ? 'text-red-500' : 'text-gray-400'}`}>
                {customTooBig
                  ? `Only ${formatNumber(progress.roomLeft)} more can be recorded for ${member.fullName}.`
                  : 'Saved on this phone first, so it’s safe to record while offline.'}
              </Text>
            </>
          )}
        </View>

        {/* Their entries */}
        <View className="gap-2">
          <Text className="px-1 text-sm font-semibold text-gray-900">Your entries for {member.fullName}</Text>
          {myPending.length === 0 && myEntries.length === 0 ? (
            <Text className="px-1 text-sm text-gray-500">No entries yet.</Text>
          ) : (
            <>
              {myPending.map(p => (
                <GroupEntryRow
                  key={p.txnId}
                  name={p.memberName}
                  amount={p.delta}
                  createdAt={p.createdAt}
                  state="pending"
                  showName={false}
                />
              ))}
              {myEntries.slice(0, 20).map(e => (
                <GroupEntryRow
                  key={e.logId}
                  name={e.memberName}
                  amount={e.amount}
                  createdAt={e.createdAt}
                  state={e.undone ? 'undone' : 'synced'}
                  canUndo={e.canUndo}
                  onUndo={() => setUndoTarget(e)}
                  showName={false}
                />
              ))}
              <Text className="px-1 text-xs text-gray-400">
                You can undo an entry within 24 hours. Older mistakes need a portal admin.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <Dialog
        visible={confirmAmount !== null}
        onClose={() => setConfirmAmount(null)}
        icon={Flame}
        title={`Record ${formatNumber(confirmAmount ?? 0)} chants?`}
        message={`For ${member.fullName}. You can undo it within 24 hours if this is a mistake.`}
        actions={[
          { label: 'Record', onPress: () => confirmAmount !== null && record(confirmAmount) },
          { label: 'Cancel' },
        ]}
      />

      <Dialog
        visible={undoTarget !== null}
        onClose={() => setUndoTarget(null)}
        icon={Undo2}
        tone="danger"
        title={`Undo ${formatNumber(undoTarget?.amount ?? 0)} chants?`}
        message={`This removes them from ${member.fullName}’s total. The entry stays in the history, marked as undone.`}
        actions={[
          { label: 'Undo entry', onPress: () => undoTarget && void doUndo(undoTarget) },
          { label: 'Keep it' },
        ]}
      />
    </View>
  );
}
