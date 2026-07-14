import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-gray-100 active:bg-gray-200',
  outline: 'bg-white border border-gray-300 active:bg-gray-50',
  ghost: 'bg-transparent active:bg-gray-100',
};

const text: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-gray-900',
  outline: 'text-gray-900',
  ghost: 'text-gray-700',
};

// Valid, generously-sized heights for comfortable tap targets.
const sizing: Record<Size, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
};

const textSize: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-[15px]',
  lg: 'text-base',
};

const iconColor: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.textPrimary,
  outline: colors.textPrimary,
  ghost: colors.textSecondary,
};

/**
 * App button — a clean, flat Pressable with variants, sizes, a loading state
 * and optional lucide icons. Colour is reserved for the primary action.
 */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: Left,
  rightIcon: Right,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-xl',
        sizing[size],
        container[variant],
        isDisabled && 'opacity-40',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={iconColor[variant]} />
      ) : (
        <>
          {Left && <Left size={iconSize} color={iconColor[variant]} />}
          <Text
            className={cn('font-semibold', text[variant], textSize[size])}
            numberOfLines={1}
          >
            {label}
          </Text>
          {Right && <Right size={iconSize} color={iconColor[variant]} />}
        </>
      )}
    </Pressable>
  );
}
