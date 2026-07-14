import React from 'react';
import { Text, View, type ViewProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { IconChip } from './IconChip';
import { cn } from './cn';

export interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  /** Optional lucide icon shown in the header. */
  icon?: LucideIcon;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * App card — a calm, flat white surface with a hairline border (no heavy
 * shadow) and an optional header (neutral icon + title + subtitle).
 */
export function Card({
  title,
  subtitle,
  icon: Icon,
  footer,
  children,
  className,
  ...props
}: CardProps) {
  const hasHeader = Boolean(title || subtitle || Icon);

  return (
    <View
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-5',
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <View className="mb-4 flex-row items-center gap-3">
          {Icon && <IconChip icon={Icon} />}
          <View className="flex-1">
            {title && (
              <Text className="text-base font-semibold text-gray-900">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text>
            )}
          </View>
        </View>
      )}

      {children}

      {footer && <View className="mt-4">{footer}</View>}
    </View>
  );
}
