import React, { useEffect, useRef, useState } from 'react';
import { Trophy } from 'lucide-react-native';

import { Dialog } from '../ui';
import { formatNumber } from '../../utils/format';
import { useMission } from '../../hooks/useMission';

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
  }, [levelIndex, level.name, nextLevel]);

  if (!reached) return null;

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
      actions={[{ label: 'Keep chanting' }]}
    />
  );
}
