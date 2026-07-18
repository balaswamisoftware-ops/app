import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
import { COUNTRY_CODES } from '../../constants/countryCodes';
import { cn } from './cn';

export interface PhoneInputProps {
  label?: string;
  /** Selected dial code, e.g. '+91'. */
  dialCode: string;
  /** The local number digits (without the dial code). */
  number: string;
  onChangeDialCode: (dial: string) => void;
  onChangeNumber: (num: string) => void;
  error?: string;
  editable?: boolean;
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
}

/**
 * A phone-number field with an international dial-code picker (default +91),
 * so devotees abroad can register with their own country code.
 */
export function PhoneInput({
  label,
  dialCode,
  number,
  onChangeDialCode,
  onChangeNumber,
  error,
  editable = true,
  returnKeyType,
  onSubmitEditing,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const hasError = Boolean(error);

  const selected =
    COUNTRY_CODES.find(c => c.dial === dialCode) ?? COUNTRY_CODES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      c => c.name.toLowerCase().includes(q) || c.dial.includes(q),
    );
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}

      <View
        className={cn(
          'h-12 flex-row items-center rounded-xl border bg-white',
          hasError ? 'border-red-500' : 'border-gray-300',
        )}
      >
        <Pressable
          onPress={() => editable && setOpen(true)}
          className="h-full flex-row items-center gap-1 border-r border-gray-200 pl-3 pr-2"
          accessibilityRole="button"
          accessibilityLabel={`Country code ${selected.dial}`}
        >
          <Text className="text-base">{selected.flag}</Text>
          <Text className="text-base font-medium text-gray-900">
            {selected.dial}
          </Text>
          <ChevronDown size={15} color={colors.textMuted} />
        </Pressable>

        <TextInput
          className="h-full flex-1 px-3 text-base text-gray-900"
          placeholder="Mobile number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={number}
          onChangeText={t => onChangeNumber(t.replace(/\D/g, '').slice(0, 12))}
          editable={editable}
          maxLength={12}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </View>

      {error && <Text className="text-xs text-red-500">{error}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable className="flex-1 justify-end bg-black/50" onPress={close}>
          <Pressable
            className="max-h-[80%] overflow-hidden rounded-t-3xl bg-white"
            onPress={() => {}}
          >
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-gray-300" />
            </View>

            <View className="flex-row items-center justify-between px-5 py-3">
              <Text className="text-lg font-semibold text-gray-900">
                Select country
              </Text>
              <Pressable
                onPress={close}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View className="px-5 pb-2">
              <View className="h-11 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
                <Search size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search country or code…"
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                  className="flex-1 text-base text-gray-900"
                />
              </View>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => item.name}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              ItemSeparatorComponent={() => (
                <View className="mx-5 h-px bg-gray-100" />
              )}
              renderItem={({ item }) => {
                const isSel = item.dial === dialCode;
                return (
                  <Pressable
                    onPress={() => {
                      onChangeDialCode(item.dial);
                      close();
                    }}
                    className={cn(
                      'mx-3 flex-row items-center gap-3 rounded-xl px-3 py-3.5 active:bg-gray-50',
                      isSel && 'bg-primary-light',
                    )}
                  >
                    <Text className="text-xl">{item.flag}</Text>
                    <Text className="flex-1 text-base text-gray-800">
                      {item.name}
                    </Text>
                    <Text className="text-base font-medium text-gray-500">
                      {item.dial}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
