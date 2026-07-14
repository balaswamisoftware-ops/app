import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { cn } from './cn';

export interface InputProps extends TextInputProps {
  label?: string;
  /** Inline error message; when set the field turns red and shows it below. */
  error?: string;
  /** Neutral helper text shown below the field when there is no error. */
  helperText?: string;
  /** Optional lucide icon rendered inside the field, on the left. */
  icon?: LucideIcon;
  /** Optional tappable lucide icon on the right (e.g. password show/hide). */
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  className?: string;
}

/**
 * App input — a NativeWind-styled TextInput with a label, focus ring, optional
 * left/right lucide icons and inline error / helper text.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightIcon: RightIcon,
    onRightIconPress,
    className,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View className={cn('gap-1.5', className)}>
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}

      <View
        className={cn(
          'h-11 flex-row items-center gap-2 rounded-xl border bg-white px-3',
          hasError
            ? 'border-red-500'
            : focused
            ? 'border-primary'
            : 'border-gray-300',
        )}
      >
        {Icon && (
          <Icon size={18} color={hasError ? colors.danger : colors.textMuted} />
        )}
        <TextInput
          ref={ref}
          className="flex-1 text-base text-gray-900"
          placeholderTextColor={colors.textMuted}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {RightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <RightIcon size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {(error || helperText) && (
        <Text
          className={cn('text-xs', hasError ? 'text-red-500' : 'text-gray-500')}
        >
          {error ?? helperText}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';
