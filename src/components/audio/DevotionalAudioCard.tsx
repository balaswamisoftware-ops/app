import React, { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Music, Pause, Play } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useAudioStore } from '../../store/useAudioStore';

/**
 * Devotional audio card, fed by the admin-managed audio config. Shown on Home
 * only when the admin has enabled audio and set a clip URL.
 *
 * Plays IN THE APP — play/pause, elapsed time and a seekable progress bar — so
 * a devotee never leaves the screen they are chanting on. `react-native-video`
 * is a native module, so this needs a rebuild to work; if it is missing (an
 * older binary, or Metro without a rebuild) we fall back to the previous
 * behaviour of handing the clip to the device's player via `Linking`.
 *
 * Deliberately foreground-only: `playInBackground` stays off, so audio stops
 * when the app is backgrounded. Background/lock-screen playback would need
 * react-native-track-player and a foreground service.
 */

let Video: any = null;
try {
  Video = require('react-native-video').default;
} catch {
  Video = null;
}

/** Seconds → m:ss. */
function clock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function DevotionalAudioCard() {
  const { enabled, url, title } = useAudioStore();

    const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [failed, setFailed] = useState(false);

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  if (!enabled || !url) return null;

  // No native player available (or it errored) — hand off to the device player.
  const canPlayInApp = Video !== null && !failed;

  const openExternally = () => {
    Linking.openURL(url).catch(() => {
      /* no player available — silently ignore */
    });
  };

  const toggle = () => {
    if (!canPlayInApp) {
      openExternally();
      return;
    }
    setPlaying(p => !p);
  };

  /** Tap anywhere on the bar to jump to that point. */
  const seekTo = (e: GestureResponderEvent) => {
    if (!canPlayInApp || duration <= 0 || barWidth <= 0) return;
    const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / barWidth));
    const target = ratio * duration;
    playerRef.current?.seek(target);
    setPosition(target);
  };

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center gap-3">
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

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={
            playing ? 'Pause devotional audio' : `Play ${title || 'devotional audio'}`
          }
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80"
        >
          {playing ? (
            <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* The scrubber only means anything once we know how long the clip is. */}
      {canPlayInApp && duration > 0 ? (
        <View className="mt-3">
          <Pressable onPress={seekTo} hitSlop={10} onLayout={onBarLayout}>
            <View className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </View>
          </Pressable>
          <View className="mt-1.5 flex-row justify-between">
            <Text className="text-xs tabular-nums text-gray-400">{clock(position)}</Text>
            <Text className="text-xs tabular-nums text-gray-400">{clock(duration)}</Text>
          </View>
        </View>
      ) : null}

      {canPlayInApp ? (
        <Video
          ref={playerRef}
          source={{ uri: url }}
          paused={!playing}
          // Audio-only: give the surface no size rather than hiding it, so no
          // stray black box can ever appear inside the card.
          style={styles.silentSurface}
          ignoreSilentSwitch="ignore"
          onLoad={(e: { duration: number }) => setDuration(e?.duration ?? 0)}
          onProgress={(e: { currentTime: number }) => setPosition(e?.currentTime ?? 0)}
          onEnd={() => {
            setPlaying(false);
            setPosition(0);
            playerRef.current?.seek(0);
          }}
          onError={() => {
            // Fall back to the device player instead of failing silently.
            setFailed(true);
            setPlaying(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Audio-only: no surface to show, so give it none. */
  silentSurface: { width: 0, height: 0 },
});
