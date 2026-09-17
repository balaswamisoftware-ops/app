import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { History, Undo2 } from 'lucide-react-native';

import { Banner, Dialog } from '../../components/ui';
import { GroupEntryRow, dayBucket } from '../../components/group/GroupEntryRow';
import { colors } from '../../constants/theme';
import { formatNumber } from '../../utils/format';
import { useGroupStore } from '../../store/useGroupStore';
import type { GroupEntry } from '../../types/group';

const BUCKETS = ['Today', 'Yesterday', 'Earlier'] as const;

/**
 * Everything the leader has recorded, newest first, grouped by day — with
 * entries still waiting to sync at the top and Undo on anything under 24 h old.
 */
export function GroupEntriesScreen() {
  const entries = useGroupStore(s => s.entries);
  const pending = useGroupStore(s => s.pending);
  const loading = useGroupStore(s => s.loadingEntries);

  const [undoTarget, setUndoTarget] = useState<GroupEntry | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refresh = useCallback(() => {
    void useGroupStore.getState().flush();
    void useGroupStore.getState().loadEntries();
  }, []);
  useFocusEffect(refresh);

  const doUndo = async (entry: GroupEntry) => {
    try {
      await useGroupStore.getState().undo(entry);
      setMessage({
        type: 'success',
        text: `Undid ${formatNumber(entry.amount)} chants for ${entry.memberName}.`,
      });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Could not undo.' });
    }
  };

  const empty = entries.length === 0 && pending.length === 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerClassName="p-4 pb-10 gap-2 w-full max-w-[600px] self-center"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {message ? (
          <Banner type={message.type} message={message.text} onDismiss={() => setMessage(null)} />
        ) : null}

        {empty ? (
          <View className="mt-10 items-center p-6">
            <History size={30} color={colors.textMuted} />
            <Text className="mt-3 text-base font-semibold text-gray-900">
              {loading ? 'Loading entries…' : 'No entries yet'}
            </Text>
            {!loading && (
              <Text className="mt-1 text-center text-sm text-gray-500">
                Chants you record for your group will appear here.
              </Text>
            )}
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <Text className="mt-2 px-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Waiting to sync
                </Text>
                {pending.map(p => (
                  <GroupEntryRow
                    key={p.txnId}
                    name={p.memberName}
                    amount={p.delta}
                    createdAt={p.createdAt}
                    state="pending"
                  />
                ))}
              </>
            )}

            {BUCKETS.map(bucket => {
              const list = entries.filter(e => dayBucket(e.createdAt) === bucket);
              if (list.length === 0) return null;
              const total = list.filter(e => !e.undone).reduce((sum, e) => sum + e.amount, 0);
              return (
                <View key={bucket} className="gap-2">
                  <View className="mt-3 flex-row items-center justify-between px-1">
                    <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {bucket}
                    </Text>
                    <Text className="text-xs text-gray-500">{formatNumber(total)} chants</Text>
                  </View>
                  {list.map(e => (
                    <GroupEntryRow
                      key={e.logId}
                      name={e.memberName}
                      amount={e.amount}
                      createdAt={e.createdAt}
                      state={e.undone ? 'undone' : 'synced'}
                      canUndo={e.canUndo}
                      onUndo={() => setUndoTarget(e)}
                    />
                  ))}
                </View>
              );
            })}

            <Text className="mt-3 px-1 text-xs text-gray-400">
              You can undo an entry within 24 hours. Older mistakes need a portal admin.
            </Text>
          </>
        )}
      </ScrollView>

      <Dialog
        visible={undoTarget !== null}
        onClose={() => setUndoTarget(null)}
        icon={Undo2}
        tone="danger"
        title={`Undo ${formatNumber(undoTarget?.amount ?? 0)} chants?`}
        message={`This removes them from ${undoTarget?.memberName ?? 'the devotee'}’s total. The entry stays in the history, marked as undone.`}
        actions={[
          { label: 'Undo entry', onPress: () => undoTarget && void doUndo(undoTarget) },
          { label: 'Keep it' },
        ]}
      />
    </View>
  );
}
