import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { CloudOff, Check, RefreshCw } from 'lucide-react-native';

import { colors } from '../../constants/theme';
import { BEADS_PER_MALA } from '../../constants/mission';
import { formatNumber } from '../../utils/format';
import { useMission } from '../../hooks/useMission';

const SIZE = 300;
const C = SIZE / 2;
const RING_R = 118; // radius the beads sit on
const BEAD_R = 6.5; // a normal counting bead
const MARKER_R = 8; // the 27/54/81 divider beads
const ACTIVE_R = 9.5; // the bead just counted
const GURU_R = 15; // the guru / meru bead at the top
const STEP = (2 * Math.PI) / BEADS_PER_MALA;

// Real malas have slightly larger "marker" beads after every 27 beads.
const MARKER_INDICES = new Set([26, 53, 80]);

// Warm, natural thread tones (a mala is strung on cotton thread).
const THREAD = '#C9A227';
const THREAD_DARK = '#9C7A14';

/**
 * The "Mala" chanting mode, drawn as a realistic japa mala:
 *  - 108 beads rendered as 3D spheres (radial-gradient shading + highlight)
 *  - knots on the thread between beads, like a hand-knotted mala
 *  - gold divider beads at 27 / 54 / 81, as on traditional malas
 *  - a maroon guru (meru) bead at the top with a hanging tassel
 *  - a soft glow pulse on the bead just counted
 * Tap anywhere on the mala to count one bead. Counts are optimistic +
 * offline-safe via the shared mission store, flushed on a short idle debounce.
 */
export function MalaCounter() {
  const { userCount, tap, flush, submitting, unsynced, pending } = useMission();

  // 1-indexed bead within the current mala (1..108); 0 only before the first tap.
  const bead = userCount === 0 ? 0 : ((userCount - 1) % BEADS_PER_MALA) + 1;
  const malas = Math.floor(userCount / BEADS_PER_MALA);

  const numScale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const celebrate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const prevCount = useRef(userCount);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Precompute bead + knot coordinates once (start just after the top, clockwise).
  const { positions, knots } = useMemo(() => {
    const pos = Array.from({ length: BEADS_PER_MALA }, (_, i) => {
      const a = -Math.PI / 2 + (i + 0.5) * STEP;
      return { x: C + RING_R * Math.cos(a), y: C + RING_R * Math.sin(a) };
    });
    // A tiny knot between each pair of beads, like a hand-knotted mala.
    const kn = Array.from({ length: BEADS_PER_MALA }, (_, i) => {
      const a = -Math.PI / 2 + (i + 1) * STEP;
      return { x: C + RING_R * Math.cos(a), y: C + RING_R * Math.sin(a) };
    });
    return { positions: pos, knots: kn };
  }, []);

  // Debounced flush after tapping stops, plus a final flush on unmount.
  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      void flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTap = () => {
    tap(1);

    // If expo-haptics is available in your project, replace this with
    // Haptics.selectionAsync() for a subtle per-tap tick on iOS + Android.

    Animated.sequence([
      Animated.timing(numScale, {
        toValue: 1.18,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(numScale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    floatY.setValue(0);
    Animated.timing(floatY, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Soft glow pulse on the freshly counted bead.
    glow.setValue(0);
    Animated.timing(glow, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    const next = prevCount.current + 1;
    if (
      Math.floor(next / BEADS_PER_MALA) >
      Math.floor(prevCount.current / BEADS_PER_MALA)
    ) {
      celebrate.setValue(0);
      Animated.sequence([
        Animated.timing(celebrate, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(celebrate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    prevCount.current = next;

    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void flush(), 1200);
  };

  const floatStyle = useMemo(
    () => ({
      opacity: floatY.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateY: floatY.interpolate({ inputRange: [0, 1], outputRange: [-4, -54] }) },
      ],
    }),
    [floatY],
  );

  const celebrateStyle = useMemo(
    () => ({
      opacity: celebrate,
      transform: [
        { translateY: celebrate.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
      ],
    }),
    [celebrate],
  );

  // Glow overlay tracks the active bead's position.
  const activePos = bead > 0 ? positions[bead - 1] : null;
  const glowStyle = useMemo(
    () => ({
      opacity: glow.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.55, 0] }),
      transform: [
        { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.1] }) },
      ],
    }),
    [glow],
  );

  // Fade the tutorial hint once the user clearly knows how it works.
  const showHint = userCount < 10;

  return (
    <View className="items-center rounded-2xl border border-gray-100 bg-white p-5">
      {/* Mala-complete celebration banner */}
      <Animated.View
        pointerEvents="none"
        style={celebrateStyle}
        className="absolute top-3 z-10 flex-row items-center gap-2 rounded-full bg-primary px-4 py-2"
      >
        <Text className="text-sm font-bold text-white">Mala {malas} complete 🙏</Text>
      </Animated.View>

      <Text className="mb-3 text-sm font-medium text-gray-700">
        Tap the mala to chant
      </Text>

      <Pressable
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel="Count one chant"
        accessibilityHint={`Bead ${bead} of ${BEADS_PER_MALA} in this mala`}
      >
        <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
            <Defs>
              {/* Off-center radial gradients make each bead read as a lit sphere */}
              <RadialGradient id="beadDone" cx="35%" cy="30%" r="75%">
                <Stop offset="0%" stopColor="#FFD9A8" />
                <Stop offset="45%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.primaryDark} />
              </RadialGradient>
              <RadialGradient id="beadActive" cx="35%" cy="30%" r="75%">
                <Stop offset="0%" stopColor="#FFE9C7" />
                <Stop offset="40%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.maroon} />
              </RadialGradient>
              <RadialGradient id="beadPending" cx="35%" cy="30%" r="75%">
                <Stop offset="0%" stopColor="#FFFFFF" />
                <Stop offset="55%" stopColor={colors.primaryLight} />
                <Stop offset="100%" stopColor="#E8C79A" />
              </RadialGradient>
              <RadialGradient id="beadMarker" cx="35%" cy="30%" r="75%">
                <Stop offset="0%" stopColor="#FFF3C4" />
                <Stop offset="50%" stopColor={colors.gold} />
                <Stop offset="100%" stopColor={THREAD_DARK} />
              </RadialGradient>
              <RadialGradient id="beadGuru" cx="35%" cy="30%" r="80%">
                <Stop offset="0%" stopColor="#C4484F" />
                <Stop offset="55%" stopColor={colors.maroon} />
                <Stop offset="100%" stopColor="#3E0A10" />
              </RadialGradient>
              <RadialGradient id="guruEye" cx="35%" cy="30%" r="80%">
                <Stop offset="0%" stopColor="#FFF3C4" />
                <Stop offset="100%" stopColor={colors.gold} />
              </RadialGradient>
            </Defs>

            {/* The thread — two strands for a corded look */}
            <Circle cx={C} cy={C} r={RING_R} stroke={THREAD} strokeWidth={2.5} fill="none" />
            <Circle
              cx={C}
              cy={C}
              r={RING_R}
              stroke={THREAD_DARK}
              strokeWidth={0.8}
              strokeOpacity={0.6}
              fill="none"
            />

            {/* Hand-tied knots between every pair of beads */}
            {knots.map((k, i) => (
              <Circle key={`k${i}`} cx={k.x} cy={k.y} r={1.6} fill={THREAD_DARK} />
            ))}

            {/* 108 counting beads */}
            {positions.map((p, i) => {
              const done = i < bead;
              const active = i === bead - 1;
              const isMarker = MARKER_INDICES.has(i);
              const r = active ? ACTIVE_R : isMarker ? MARKER_R : BEAD_R;
              const fill = active
                ? 'url(#beadActive)'
                : done
                  ? 'url(#beadDone)'
                  : isMarker
                    ? 'url(#beadMarker)'
                    : 'url(#beadPending)';
              return (
                <React.Fragment key={i}>
                  {/* soft contact shadow grounds the bead on the thread */}
                  <Circle
                    cx={p.x + 1}
                    cy={p.y + 1.5}
                    r={r}
                    fill="#000"
                    fillOpacity={0.12}
                  />
                  <Circle cx={p.x} cy={p.y} r={r} fill={fill} />
                  {/* specular highlight */}
                  <Circle
                    cx={p.x - r * 0.32}
                    cy={p.y - r * 0.36}
                    r={r * 0.28}
                    fill="#FFFFFF"
                    fillOpacity={done || active ? 0.55 : 0.8}
                  />
                </React.Fragment>
              );
            })}

            {/* Tassel hanging above the guru bead */}
            <Line
              x1={C}
              y1={C - RING_R - GURU_R + 2}
              x2={C}
              y2={C - RING_R - GURU_R - 8}
              stroke={THREAD_DARK}
              strokeWidth={2}
            />
            {[-14, -7, 0, 7, 14].map(dx => (
              <Path
                key={dx}
                d={`M ${C} ${C - RING_R - GURU_R - 8}
                    Q ${C + dx * 0.6} ${C - RING_R - GURU_R - 16}
                      ${C + dx} ${C - RING_R - GURU_R - 26}`}
                stroke={colors.maroon}
                strokeWidth={1.6}
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {[-14, -7, 0, 7, 14].map(dx => (
              <Circle
                key={`t${dx}`}
                cx={C + dx}
                cy={C - RING_R - GURU_R - 26}
                r={1.8}
                fill={colors.gold}
              />
            ))}

            {/* Guru (meru) bead */}
            <Circle
              cx={C + 1.5}
              cy={C - RING_R + 2}
              r={GURU_R}
              fill="#000"
              fillOpacity={0.15}
            />
            <Circle cx={C} cy={C - RING_R} r={GURU_R} fill="url(#beadGuru)" />
            <Circle cx={C} cy={C - RING_R} r={GURU_R / 2.2} fill="url(#guruEye)" />
            <Circle
              cx={C - GURU_R * 0.32}
              cy={C - RING_R - GURU_R * 0.36}
              r={GURU_R * 0.24}
              fill="#FFFFFF"
              fillOpacity={0.45}
            />
          </Svg>

          {/* Glow pulse on the freshly counted bead */}
          {activePos && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: activePos.x - 14,
                  top: activePos.y - 14,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                },
                glowStyle,
              ]}
            />
          )}

          {/* Floating +1 */}
          <Animated.Text
            pointerEvents="none"
            style={floatStyle}
            className="absolute text-2xl font-extrabold text-primary"
          >
            +1
          </Animated.Text>

          {/* Center count */}
          <View pointerEvents="none" className="items-center">
            <Animated.Text
              style={{ transform: [{ scale: numScale }] }}
              className="text-6xl font-extrabold text-gray-900"
            >
              {bead}
            </Animated.Text>
            <Text className="text-sm text-gray-400">of {BEADS_PER_MALA}</Text>
            {showHint && (
              <Text className="mt-1 text-[11px] uppercase tracking-widest text-gray-300">
                tap anywhere
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      {/* Totals */}
      <View className="mt-5 w-full flex-row justify-around">
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">{formatNumber(malas)}</Text>
          <Text className="text-xs text-gray-500">Malas done</Text>
        </View>
        <View className="items-center">
          <Text className="text-xl font-bold text-gray-900">
            {formatNumber(userCount)}
          </Text>
          <Text className="text-xs text-gray-500">Total chants</Text>
        </View>
      </View>

      {/* Sync status — reassures the user their taps are safe, even offline */}
      <View className="mt-4 h-5 flex-row items-center gap-1.5">
        {submitting ? (
          <>
            <RefreshCw size={13} color={colors.textMuted} />
            <Text className="text-xs text-gray-400">Syncing…</Text>
          </>
        ) : unsynced ? (
          <>
            <CloudOff size={13} color={colors.textMuted} />
            <Text className="text-xs text-gray-400">
              {formatNumber(pending)} saved offline · will sync
            </Text>
          </>
        ) : userCount > 0 ? (
          <>
            <Check size={13} color={colors.success} />
            <Text className="text-xs text-gray-400">All synced</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}