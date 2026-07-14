import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { cn } from './cn';

export type BannerType = 'success' | 'error' | 'info';

export interface BannerProps {
  type?: BannerType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const styles: Record<BannerType, { box: string; text: string; color: string; Icon: typeof Info }> = {
  success: {
    box: 'border-green-200 bg-green-50',
    text: 'text-green-700',
    color: colors.success,
    Icon: CheckCircle2,
  },
  error: {
    box: 'border-red-200 bg-red-50',
    text: 'text-red-600',
    color: colors.danger,
    Icon: AlertCircle,
  },
  info: {
    box: 'border-gray-200 bg-gray-50',
    text: 'text-gray-700',
    color: colors.textSecondary,
    Icon: Info,
  },
};

/** Inline status banner for success / error / info feedback. */
export function Banner({ type = 'info', message, onDismiss, className }: BannerProps) {
  const s = styles[type];
  const Icon = s.Icon;
  return (
    <View
      className={cn(
        'flex-row items-center gap-2 rounded-xl border px-3 py-3',
        s.box,
        className,
      )}
    >
      <Icon size={18} color={s.color} />
      <Text className={cn('flex-1 text-sm', s.text)}>{message}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <X size={16} color={s.color} />
        </Pressable>
      )}
    </View>
  );
}
