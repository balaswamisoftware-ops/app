import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, History, HandHeart } from 'lucide-react-native';

import type { HomeStackParamList } from '../navigation/AppNavigator';
import { Banner, Button, Dialog, Input } from '../components/ui';
import { colors } from '../constants/theme';
import { formatNumber } from '../utils/format';
import { clampChantInput } from '../constants/mission';
import { useMission } from '../hooks/useMission';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { AdBanner } from '../components/ads/AdBanner';
import { MalaCounter } from '../components/chant/MalaCounter';

type Props = NativeStackScreenProps<HomeStackParamList, 'Chanting'>;

const PRESETS = [54, 108, 216, 300, 400];
type Mode = 'input' | 'mala';

export function ChantingScreen({ navigation }: Props) {
  const { userCount, target, remaining, submitting, error, clearError, addChants } =
    useMission();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [mode, setMode] = useState<Mode>('input');
  const [custom, setCustom] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submit = async (n: number) => {
    try {
      await addChants(n);
    } catch {
      /* validation error surfaced via the banner */
    }
  };

  const submitCustom = async () => {
    const n = parseInt(custom, 10);
    if (!Number.isFinite(n) || n <= 0) {
      setCustom('');
      return;
    }
    setCustom('');
    await submit(n);
  };

  const onComplete = () => {
    if (userCount <= 0) return;
    setConfirmOpen(true);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 gap-4 w-full max-w-[600px] self-center"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28 + keyboardHeight,
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
      >
        {/* Ad banner scrolls with the content, right under the header */}
        <AdBanner />

      {/* Count summary */}
      <View className="items-center rounded-2xl border border-gray-100 bg-white p-6">
        <Text className="text-sm text-gray-500">Your chants</Text>
        <Text
          className="mt-1 text-6xl font-extrabold text-gray-900"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatNumber(userCount)}
        </Text>
        <Text className="mt-1 text-xs text-gray-400">
          of {formatNumber(target)} · {formatNumber(remaining)} to go
        </Text>
      </View>

      {error ? <Banner type="error" message={error} onDismiss={clearError} /> : null}

      {/* Mode switch: Quick Add | Mala */}
      <View className="flex-row rounded-xl bg-gray-100 p-1">
        {(['input', 'mala'] as const).map(m => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                active ? 'bg-white' : ''
              }`}
              style={active ? { elevation: 1 } : undefined}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {m === 'input' ? 'Quick Add' : 'Mala'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'mala' ? (
        <MalaCounter />
      ) : (
        /* Preset amounts + custom */
        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="mb-3 text-sm font-medium text-gray-700">
            Add your chant count
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRESETS.map(n => (
              <Pressable
                key={n}
                disabled={submitting}
                onPress={() => submit(n)}
                className={`min-w-[64px] flex-1 items-center rounded-xl border border-gray-200 bg-white py-3 active:bg-gray-50 ${
                  submitting ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-lg font-semibold text-gray-900">+{n}</Text>
              </Pressable>
            ))}
          </View>

          {/* Custom amount */}
          <View className="mt-4 flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                label="Custom count"
                placeholder="e.g. 1008"
                helperText="Up to 5,000 at a time"
                keyboardType="number-pad"
                value={custom}
                onChangeText={t => setCustom(clampChantInput(t))}
                returnKeyType="done"
                onSubmitEditing={submitCustom}
                maxLength={4}
              />
            </View>
            <Button
              label="Add"
              leftIcon={Plus}
              disabled={!custom}
              onPress={submitCustom}
            />
          </View>

          {submitting ? (
            <View className="mt-3 flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-sm text-gray-500">Saving…</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* History + complete */}
      <Button
        label="View chanting history"
        variant="outline"
        leftIcon={History}
        onPress={() => navigation.getParent()?.navigate('HistoryTab' as never)}
      />

      <Button
        label={
          userCount > 0
            ? 'Complete Chanting & Donate ₹216'
            : 'Add chants to unlock seva donation'
        }
        variant="secondary"
        leftIcon={HandHeart}
        disabled={userCount <= 0}
        onPress={onComplete}
      />

      <Dialog
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={HandHeart}
        title="Complete your chanting?"
        message={`You have chanted ${formatNumber(userCount)} time${
          userCount === 1 ? '' : 's'
        }. Proceed to the ₹216 seva donation?`}
        actions={[
          {
            label: 'Complete & Donate',
            onPress: () => navigation.navigate('Donation'),
          },
          { label: 'Keep chanting' },
        ]}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
