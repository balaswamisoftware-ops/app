import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Megaphone, PauseCircle, X } from 'lucide-react-native';

import { useNoticeStore, useVisibleAnnouncement } from '../../store/useNoticeStore';

/**
 * Admin broadcast banner. Set in the admin portal's Settings → Announcement and
 * delivered by `app_config()` on launch. Dismissing hides THIS text for good;
 * a new announcement appears again.
 */
export function AnnouncementCard() {
  const announcement = useVisibleAnnouncement();
  const dismiss = useNoticeStore(s => s.dismiss);

  if (!announcement) return null;

  return (
    <View
      className="flex-row items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      accessible
      accessibilityLabel={`Announcement: ${announcement}`}
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-amber-100">
        <Megaphone size={17} color="#B45309" />
      </View>
      <Text className="flex-1 text-sm leading-5 text-amber-900">{announcement}</Text>
      <Pressable
        onPress={() => void dismiss()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss announcement"
      >
        <X size={16} color="#B45309" />
      </Pressable>
    </View>
  );
}

/**
 * Shown while an admin has switched the mission off. Chanting is disabled
 * everywhere it appears, so the devotee is told why rather than tapping a dead
 * button.
 */
export function MissionPausedCard() {
  const missionActive = useNoticeStore(s => s.missionActive);
  if (missionActive) return null;

  return (
    <View
      className="flex-row items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4"
      accessible
      accessibilityLabel="The chant mission is paused"
    >
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-gray-100">
        <PauseCircle size={17} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900">Mission paused</Text>
        <Text className="mt-0.5 text-sm leading-5 text-gray-500">
          The peetham has paused the chant mission for now. Your existing count is
          safe — chanting reopens as soon as it resumes.
        </Text>
      </View>
    </View>
  );
}
