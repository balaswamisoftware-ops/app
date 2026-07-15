import React, { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { AdBanner } from './AdBanner';

interface Props {
  visible: boolean;
  /** Seconds to show before auto-closing. */
  seconds?: number;
  onClose: () => void;
}

/**
 * A full-screen ad "gate": shows a real Google (AdMob) ad centred on a
 * full-screen page for `seconds`, then closes itself automatically.
 *
 * NOTE: a genuine AdMob *interstitial* can't be force-closed on a timer (Google
 * owns that view and only lets the user dismiss it). So this uses a full-screen
 * page hosting a real banner/rectangle ad, which we CAN auto-dismiss — the
 * closest compliant match to "full-screen Google ad for 5s, then auto-close".
 */
export function FullScreenAdGate({ visible, seconds = 5, onClose }: Props) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!visible) return;
    setRemaining(seconds);
    const closeTimer = setTimeout(onClose, seconds * 1000);
    const tick = setInterval(
      () => setRemaining(r => Math.max(0, r - 1)),
      1000,
    );
    return () => {
      clearTimeout(closeTimer);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="absolute top-14 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Advertisement
        </Text>

        <AdBanner size="square" />

        <View className="absolute bottom-20 items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-sm font-bold text-gray-600">{remaining}</Text>
          </View>
          <Text className="text-xs text-gray-400">Closing automatically…</Text>
        </View>
      </View>
    </Modal>
  );
}
