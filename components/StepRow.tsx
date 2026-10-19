import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export type StepStatus = 'pending' | 'active' | 'done';

interface Props {
  label: string;
  status: StepStatus;
}

export default function StepRow({ label, status }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        {status === 'done' ? (
          <Text style={styles.check}>✓</Text>
        ) : status === 'active' ? (
          <ActivityIndicator size="small" color={colors.gold} />
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
  label: { color: colors.cream, fontSize: 16, marginLeft: 4 },
  labelPending: { color: colors.muted },
  labelActive: { color: colors.goldSoft, fontWeight: '600' },
});
