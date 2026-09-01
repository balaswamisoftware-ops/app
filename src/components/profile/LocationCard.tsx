import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Globe, MapPin } from 'lucide-react-native';
import { Button, Card, IconChip } from '../ui';
import { locationService } from '../../services/locationService';

/**
 * Opt-in card for the community world map. It only appears while the devotee
 * has NOT granted location — once permission is given the card disappears (no
 * repeated asking). Re-checks on every focus so granting elsewhere (e.g. the
 * one-time launch prompt) hides it immediately.
 */
export function LocationCard() {
  const [granted, setGranted] = useState<boolean | null>(null); // null = checking
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      locationService
        .hasPermission()
        .then(g => active && setGranted(g))
        .catch(() => active && setGranted(false));
      return () => {
        active = false;
      };
    }, []),
  );

  const share = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const ok = await locationService.shareLocation();
      if (ok) setGranted(true); // permission granted → card hides
      else setMessage('Permission was declined. You can allow it in Settings anytime.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not share your location.');
    } finally {
      setBusy(false);
    }
  };

  // Still checking, or already granted → show nothing.
  if (granted === null || granted) return null;

  return (
    <Card title="Community Map">
      <View className="gap-3">
        <View className="flex-row items-start gap-3">
          <IconChip icon={Globe} />
          <Text className="flex-1 text-sm leading-5 text-gray-600">
            Share your approximate location to appear on the devotee world map.
            It’s used only for the map.
          </Text>
        </View>

        {message ? <Text className="text-xs text-gray-500">{message}</Text> : null}

        <Button
          label="Share my location"
          leftIcon={MapPin}
          onPress={share}
          isLoading={busy}
        />
      </View>
    </Card>
  );
}
