import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { Button } from './Button';
import { cn } from './cn';

type Tone = 'default' | 'success' | 'danger';

export interface DialogAction {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  /** Optional lucide icon shown in a tinted circle above the title. */
  icon?: LucideIcon;
  tone?: Tone;
  /**
   * Buttons shown at the bottom, stacked. The first action is the primary one.
   * Defaults to a single "OK" that just closes the dialog.
   */
  actions?: DialogAction[];
}

const toneRing: Record<Tone, string> = {
  default: 'bg-primary-light',
  success: 'bg-green-50',
  danger: 'bg-red-50',
};

const toneIcon: Record<Tone, string> = {
  default: colors.primary,
  success: colors.success,
  danger: colors.danger,
};

/**
 * A centered, animated custom modal used in place of the native `Alert.alert`.
 * Supports an optional tinted icon, a title/message and a stack of action
 * buttons. Tapping the backdrop or the close affordance calls `onClose`.
 */
export function Dialog({
  visible,
  onClose,
  title,
  message,
  icon: Icon,
  tone = 'default',
  actions,
}: DialogProps) {
  const resolved: DialogAction[] =
    actions && actions.length > 0 ? actions : [{ label: 'OK' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-[400px] items-center rounded-3xl bg-white p-6"
          onPress={() => {}}
        >
          {Icon && (
            <View
              className={cn(
                'mb-4 h-14 w-14 items-center justify-center rounded-full',
                toneRing[tone],
              )}
            >
              <Icon size={28} color={toneIcon[tone]} />
            </View>
          )}

          <Text className="text-center text-lg font-semibold text-gray-900">
            {title}
          </Text>

          {message ? (
            <Text className="mt-2 text-center text-[15px] leading-5 text-gray-500">
              {message}
            </Text>
          ) : null}

          <View className="mt-6 w-full gap-2">
            {resolved.map((action, i) => (
              <Button
                key={`${action.label}-${i}`}
                label={action.label}
                variant={action.variant ?? (i === 0 ? 'primary' : 'ghost')}
                onPress={() => {
                  onClose();
                  action.onPress?.();
                }}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
