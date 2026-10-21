import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../lib/theme';

interface Props {
  label: string;
  value: number; // 0–100
  hint?: string;
}

export default function ScoreBar({ label, value, hint }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const anim = useRef(new Animated.Value(0)).current;
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => {
      setDisplayVal(Math.round(v));
    });

    const t = Animated.timing(anim, {
      toValue: clamped,
      duration: 850,
      useNativeDriver: false,
    });
    t.start();

    return () => {
      anim.removeListener(listener);
      t.stop();
    };
  }, [anim, clamped]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayVal}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: colors.cream, fontSize: 13, fontFamily: fonts.bodySemi },
  value: { color: colors.goldSoft, fontSize: 13, fontFamily: fonts.bodyBold },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.gold },
  hint: { color: colors.muted, fontSize: 11, fontFamily: fonts.body, marginTop: 4, lineHeight: 15 },
});
