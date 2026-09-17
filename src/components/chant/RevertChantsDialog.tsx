import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Hash, RotateCcw } from 'lucide-react-native';

import { Button, Input } from '../ui';
import { colors } from '../../constants/theme';
import { formatNumber } from '../../utils/format';
import { uuidv4 } from '../../utils/uuid';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useMissionStore } from '../../store/useMissionStore';

/**
 * Take chants back off the devotee's own total — for a mistaken entry.
 *
 * Shows the current total, the amount to remove and the total it will become,
 * so the effect is clear before OK is pressed. The change is recorded as a
 * "Reverted by you" entry in the history, never a silent edit. Mount it only
 * while open so every opening starts fresh (and gets a fresh idempotency key).
 */
export function RevertChantsDialog({
  currentCount,
  onClose,
  onReverted,
}: {
  currentCount: number;
  onClose: () => void;
  /** Called with how many chants were taken off. */
  onReverted: (amount: number) => void;
}) {
  const keyboardHeight = useKeyboardHeight();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // One key per opening: pressing OK again after a lost response can't reduce twice.
  const [txnId] = useState(uuidv4);

  const amount = Math.floor(Number(value) || 0);
  const tooMany = amount > currentCount;
  const valid = amount > 0 && !tooMany;
  const after = Math.max(0, currentCount - amount);

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const reverted = await useMissionStore.getState().revert(amount, txnId);
      onReverted(reverted > 0 ? reverted : amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revert your chants.');
      setSubmitting(false);
    }
  };

  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        style={{ paddingBottom: keyboardHeight }}
        onPress={close}
      >
        <Pressable className="w-full max-w-[400px] rounded-3xl bg-white p-6" onPress={() => {}}>
          <View className="items-center">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <RotateCcw size={26} color={colors.danger} />
            </View>
            <Text className="text-center text-lg font-semibold text-gray-900">Revert chants</Text>
            <Text className="mt-1 text-center text-sm leading-5 text-gray-500">
              Remove chants from your total, for example after a wrong entry.
            </Text>
          </View>

          <View className="mt-5 flex-row justify-between rounded-2xl bg-gray-50 p-3.5">
            <View>
              <Text className="text-xs text-gray-500">Current total</Text>
              <Text className="text-base font-bold text-gray-900">{formatNumber(currentCount)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-gray-500">After revert</Text>
              <Text
                className={`text-base font-bold ${valid ? 'text-red-600' : 'text-gray-400'}`}
              >
                {valid ? formatNumber(after) : '—'}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            <Input
              label="Chants to remove"
              icon={Hash}
              placeholder="e.g. 108"
              keyboardType="number-pad"
              autoFocus
              value={value}
              onChangeText={v => {
                setValue(v.replace(/\D/g, '').slice(0, 7));
                setError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={submit}
              error={
                error ??
                (tooMany ? `You can remove at most ${formatNumber(currentCount)} chants.` : undefined)
              }
              helperText="This is saved in your chant history."
            />
          </View>

          <View className="mt-4 gap-2">
            <Button
              label={valid ? `OK, remove ${formatNumber(amount)}` : 'OK'}
              leftIcon={RotateCcw}
              disabled={!valid}
              isLoading={submitting}
              onPress={submit}
            />
            <Button label="Cancel" variant="ghost" disabled={submitting} onPress={close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
