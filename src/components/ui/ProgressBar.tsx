import React from 'react';
import { View } from 'react-native';
import { cn } from './cn';

export interface ProgressBarProps {
  /** Completion percentage, 0–100. */
  value: number;
  /** Track height in px (default 12). */
  height?: number;
  className?: string;
  /** NativeWind class for the filled portion (default brand primary). */
  fillClassName?: string;
}

/** A simple rounded progress bar. */
export function ProgressBar({
  value,
  height = 12,
  className,
  fillClassName = 'bg-primary',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      className={cn('w-full overflow-hidden rounded-full bg-gray-200', className)}
      style={{ height }}
    >
      <View
        className={cn('h-full rounded-full', fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
