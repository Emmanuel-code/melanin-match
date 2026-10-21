import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export type StepStatus = 'pending' | 'active' | 'done';

interface Props {
  label: string;
  status: StepStatus;
}

// Pulsing gold dot for the step that's running right now — the wait should
// feel alive, not stalled.
function PulseDot() {
  const [v] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.55, duration: 550, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View style={[styles.pulse, { opacity: v, transform: [{ scale: v }] }]} />
  );
}

export default function StepRow({ label, status }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        {status === 'done' ? (
          <Text style={styles.check}>✓</Text>
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
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  icon: { width: 32, alignItems: 'center', justifyContent: 'center' },
  check: { color: colors.green, fontSize: 18, fontWeight: '700' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.goldDim,
  },
  pulse: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.gold },
  label: { color: colors.cream, fontSize: 16, marginLeft: 4 },
  labelPending: { color: colors.muted },
  labelActive: { color: colors.goldSoft, fontWeight: '600' },
});
