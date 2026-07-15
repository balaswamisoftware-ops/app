import React from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download } from 'lucide-react-native';

import { Button } from '../components/ui';
import { logoImage } from '../assets/logo';

interface Props {
  updateUrl: string;
  latestVersion: string;
  currentVersion: string;
}

/**
 * A blocking screen shown when the installed version is below the server's
 * minimum supported version. The user cannot proceed until they update.
 */
export function UpdateRequiredScreen({ updateUrl, latestVersion, currentVersion }: Props) {
  const openStore = () => {
    Linking.openURL(updateUrl).catch(() => {});
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={logoImage}
          resizeMode="contain"
          className="mb-6 h-24 w-24 rounded-2xl"
        />
        <Text className="text-2xl font-bold text-gray-900">Update required</Text>
        <Text className="mt-2 text-center text-base leading-6 text-gray-600">
          A new version of Sri Vidya Peetham is available. Please update to
          continue your seva.
        </Text>
        <Text className="mt-3 text-xs text-gray-400">
          Your version {currentVersion} · Latest {latestVersion}
        </Text>
        <Button
          label="Update now"
          leftIcon={Download}
          size="lg"
          className="mt-8 w-full"
          onPress={openStore}
        />
      </View>
    </SafeAreaView>
  );
}
