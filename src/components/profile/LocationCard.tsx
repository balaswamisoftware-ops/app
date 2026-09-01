import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Globe, MapPin } from 'lucide-react-native';
import { Button, Card, IconChip } from '../ui';
import { locationService } from '../../services/locationService';

/**
 * Opt-in card for the community world map. It appears while the devotee has NOT
 * yet had a location SAVED, and hides once one is stored.
 *
 * It deliberately keys off the saved row rather than the OS permission: a
 * granted permission says nothing about whether the save actually succeeded
 * (an Android device commonly has no GPS fix in the seconds right after the
 * dialog is accepted). Gating on permission hid this card the moment "Allow"
 * was tapped, leaving a devotee whose save had failed with no way to retry and
 * no sign anything was wrong.
 */
export function LocationCard() {
  const [shared, setShared] = useState<boolean | null>(null); // null = checking
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      locationService
        .hasSavedLocation()
        .then(s => active && setShared(s))
        .catch(() => active && setShared(false));
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
      if (!ok) {
        setMessage('Permission was declined. You can allow it in Settings anytime.');
        return;
      }
      // Confirm it really landed before hiding the card.
      setShared(await locationService.hasSavedLocation());
    } catch (e) {
      setMessage(
        e instanceof Error
          ? `${e.message} Please make sure location is switched on, then try again.`
          : 'Could not share your location. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  // Still checking, or already stored → show nothing.
  if (shared === null || shared) return null;

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
          label={message ? 'Try again' : 'Share my location'}
          leftIcon={MapPin}
          onPress={share}
          isLoading={busy}
        />
      </View>
    </Card>
  );
}
