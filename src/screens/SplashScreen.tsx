import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { splashImage } from '../assets/splash';

/**
 * Full-screen launch splash. Shown while the persisted session is being
 * restored (`status === 'loading'`). Falls back to a branded placeholder if no
 * splash image has been added yet.
 */
export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      {splashImage ? (
        <Image
          source={splashImage}
          resizeMode="contain"
          className="h-full w-full"
        />
      ) : (
        <View className="items-center">
          <Text className="text-4xl font-bold text-maroon">శ్రీ విద్యా పీఠం</Text>
          <Text className="mt-2 text-lg text-primary">Sri Vidya Peetham</Text>
        </View>
      )}

      <View className="absolute bottom-16">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
}
