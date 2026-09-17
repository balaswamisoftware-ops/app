import React, { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Dialog } from '../ui';
import { formatNumber } from '../../utils/format';
import { useMission } from '../../hooks/useMission';
import { useCertificateStore } from '../../store/useCertificateStore';
import type { HomeStackParamList } from '../../navigation/AppNavigator';

/**
 * Celebrates the moment a devotee crosses into a new level.
 *
 * Fires only on an UPWARD change, and only after a level has actually been
 * observed once — otherwise the first render after launch (0 → the devotee's
 * real count) would pop the dialog for a level they reached weeks ago. An admin
 * widening a level can move a devotee back down; that is silent by design.
 */
export function LevelUpDialog() {
  const { level, levelIndex, levelTotal, atCeiling, ceiling, nextLevel } =
    useMission();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const certificates = useCertificateStore(s => s.data);
  // `null` until the first level is observed, so the initial load never fires.
  const seen = useRef<number | null>(null);
  const [reached, setReached] = useState<{
    name: string;
    index: number;
    final: boolean;
  } | null>(null);

  useEffect(() => {
    const previous = seen.current;
    seen.current = levelIndex;
    if (previous === null || levelIndex <= previous) return;
    setReached({ name: level.name, index: levelIndex, final: !nextLevel });
    // Crossing into a level means the previous one was just completed — its
    // certificate may now be downloadable, so refresh before they look.
    void useCertificateStore.getState().load();
  }, [levelIndex, level.name, nextLevel]);

  if (!reached) return null;

  // The level just COMPLETED is the one before the level now reached (or the
  // final level itself once the ceiling is hit). Offer its certificate when the
  // admin has published one and downloads are on.
  const completedN = reached.final && atCeiling ? reached.index : reached.index - 1;
  const completed = certificates?.levels.find(l => l.n === completedN);
  const offerCertificate = certificates?.enabled === true && completed?.hasCertificate === true;

  return (
    <Dialog
      visible
      onClose={() => setReached(null)}
      icon={Trophy}
      tone="success"
      title={`${reached.name} reached! 🎉`}
      message={
        reached.final && atCeiling
          ? `All ${formatNumber(
              ceiling,
            )} chants are complete. Hara Hara Mahadeva!`
          : `You are now on Level ${reached.index} of ${levelTotal}. Hara Hara Mahadeva!`
      }
      actions={
        offerCertificate
          ? [
              {
                label: `View ${completed?.name ?? ''} certificate`.replace('  ', ' '),
                onPress: () => navigation.navigate('Certificates'),
              },
              { label: 'Keep chanting' },
            ]
          : [{ label: 'Keep chanting' }]
      }
    />
  );
}
