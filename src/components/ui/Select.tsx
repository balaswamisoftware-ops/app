import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { cn } from './cn';

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: readonly string[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  error?: string;
  className?: string;
  /** Show a search box in the sheet. Defaults to on when there are 8+ options. */
  searchable?: boolean;
}

/**
 * A modal dropdown select. Renders a tappable field that opens a searchable
 * list in a polished bottom-sheet modal. Keyboard-free selection, works on
 * phones and tablets.
 */
export function Select({
  label,
  placeholder = 'Select…',
  value,
  options,
  onChange,
  icon: Icon,
  error,
  className,
  searchable,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const showSearch = searchable ?? options.length >= 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View className={cn('gap-1.5', className)}>
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'h-11 flex-row items-center gap-2 rounded-xl border bg-white px-3',
          error ? 'border-red-500' : 'border-gray-300',
        )}
      >
        {Icon && <Icon size={18} color={colors.textMuted} />}
        <Text
          className={cn(
            'flex-1 text-base',
            value ? 'text-gray-900' : 'text-gray-400',
          )}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

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
            className="max-h-[80%] overflow-hidden rounded-t-3xl bg-white pb-4"
            onPress={() => {}}
          >
            {/* Grab handle */}
            <View className="items-center pt-3">
              <View className="h-1.5 w-10 rounded-full bg-gray-300" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
              <View>
                <Text className="text-lg font-semibold text-gray-900">
                  {label ?? 'Select'}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-400">
                  {filtered.length}{' '}
                  {filtered.length === 1 ? 'option' : 'options'}
                </Text>
              </View>
              <Pressable
                onPress={close}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search */}
            {showSearch && (
              <View className="px-5 pb-2">
                <View className="h-11 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3">
                  <Search size={18} color={colors.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={`Search ${label?.toLowerCase() ?? 'options'}…`}
                    placeholderTextColor={colors.textMuted}
                    autoCorrect={false}
                    className="flex-1 text-base text-gray-900"
                  />
                  {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')} hitSlop={8}>
                      <X size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            <FlatList
              data={filtered}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => (
                <View className="mx-5 h-px bg-gray-100" />
              )}
              ListEmptyComponent={
                <View className="items-center px-5 py-10">
                  <Text className="text-sm text-gray-400">
                    No matches for “{query}”
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      close();
                    }}
                    className={cn(
                      'mx-3 flex-row items-center justify-between rounded-xl px-3 py-3.5 active:bg-gray-50',
                      selected && 'bg-primary-light',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-base',
                        selected
                          ? 'font-semibold text-primary-dark'
                          : 'text-gray-700',
                      )}
                    >
                      {item}
                    </Text>
                    {selected && (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check size={15} color={colors.white} />
                      </View>
                    )}
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
