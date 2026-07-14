import React from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { cn } from './cn';

export interface IconChipProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

/**
 * Neutral square icon container used across the app. Subtle light-gray
 * background with a muted icon — no accent colours, for a calm, premium look.
 */
export function IconChip({ icon: Icon, size = 18, className }: IconChipProps) {
  return (
    <View
      className={cn(
        'h-10 w-10 items-center justify-center rounded-xl bg-gray-100',
        className,
      )}
    >
      <Icon size={size} color={colors.textSecondary} />
    </View>
  );
}
