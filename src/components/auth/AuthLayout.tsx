import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { logoImage } from '../../assets/logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  /** Error banner text (e.g. from the auth store). */
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Shared scaffold for the Login / Sign Up screens: safe area, keyboard
 * avoidance, scrolling, the brand header and a dismissible error banner.
 */
export function AuthLayout({ title, subtitle, error, children }: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pb-8 pt-6 w-full max-w-[600px] self-center"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View className="mb-8 items-center">
            <Image
              source={logoImage}
              resizeMode="contain"
              className="mb-3 h-32 w-32 rounded-2xl"
            />
            <Text className="text-sm text-gray-500">Sri Vidya Peetam</Text>
          </View>

          <Text className="text-2xl font-bold text-gray-900">{title}</Text>
          {subtitle && (
            <Text className="mt-1 text-base text-gray-500">{subtitle}</Text>
          )}

          {error ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
              <AlertCircle size={18} color={colors.danger} />
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="mt-6 gap-4">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
