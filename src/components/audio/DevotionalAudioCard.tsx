import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Music, Play } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * Devotional audio card, fed by the admin-managed audio config. Shown on Home
 * only when the admin has enabled audio and set a clip URL.
 *
 * Playback currently opens the clip in the device's audio player via Linking —
 * this needs no native module, so it works on the existing build the moment the
 * admin uploads a clip. (An in-app player can be added later with
 * react-native-video / react-native-track-player + a rebuild.)
 */
export function DevotionalAudioCard() {
  const { enabled, url, title } = useAudioStore();

  if (!enabled || !url) return null;

  const play = () => {
    Linking.openURL(url).catch(() => {
      /* no player available — silently ignore */
    });
  };

  return (
    <Pressable
      onPress={play}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title || 'devotional audio'}`}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-light">
        <Music size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Devotional audio
        </Text>
        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
          {title || 'Play the chant'}
        </Text>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
      </View>
    </Pressable>
  );
}
