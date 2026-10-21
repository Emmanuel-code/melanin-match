import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';

export type StepStatus = 'pending' | 'active' | 'done';

interface Props {
  label: string;
  status: StepStatus;
}

// Pulsing halo and core dot for active step
function PulseDot() {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseHalo,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View style={styles.pulseCore} />
    </View>
  );
}

export default function StepRow({ label, status }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        {status === 'done' ? (
          <View style={styles.doneCircle}>
            <Text style={styles.check}>✓</Text>
          </View>
        ) : status === 'active' ? (
          <PulseDot />
        ) : (
          <View style={styles.dot} />
        )}
      </View>
      <Text
        style={[
          styles.label,
          status === 'pending' && styles.labelPending,
          status === 'active' && styles.labelActive,
          status === 'done' && styles.labelDone,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { width: 36, alignItems: 'center', justifyContent: 'center' },
  doneCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(116, 201, 136, 0.15)',
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.green, fontSize: 13, fontWeight: '700' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.surfaceLight,
    backgroundColor: 'transparent',
  },
  pulseContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseHalo: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.goldGlow,
  },
  pulseCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  label: {
    color: colors.cream,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    marginLeft: 8,
  },
  labelPending: {
    color: colors.muted,
    fontFamily: fonts.body,
    opacity: 0.6,
  },
  labelActive: {
    color: colors.goldSoft,
    fontFamily: fonts.bodyBold,
  },
  labelDone: {
    color: colors.creamSoft,
    fontFamily: fonts.bodySemi,
  },
});
