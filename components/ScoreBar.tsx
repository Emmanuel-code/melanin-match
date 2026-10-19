import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

interface Props {
  label: string;
  value: number; // 0–100
  hint?: string;
}

export default function ScoreBar({ label, value, hint }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{clamped}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: colors.cream, fontSize: 14, fontWeight: '600' },
  value: { color: colors.goldSoft, fontSize: 14, fontWeight: '700' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.gold },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
