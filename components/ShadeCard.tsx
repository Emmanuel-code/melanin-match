import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MatchedShade } from '../lib/match';
import { colors, radius } from '../lib/theme';

interface Props {
  shade: MatchedShade;
  selected?: boolean;
  onPress?: () => void;
  large?: boolean;
}

export default function ShadeCard({ shade, selected, onPress, large }: Props) {
  const body = (
    <View style={[styles.card, large && styles.cardLarge, selected && styles.selected]}>
      <View style={[styles.swatch, large && styles.swatchLarge, { backgroundColor: shade.hex }]} />
      <View style={styles.text}>
        <Text style={styles.brand}>
          {shade.brand} · {shade.line}
        </Text>
        <Text style={[styles.name, large && styles.nameLarge]}>{shade.name}</Text>
        <Text style={styles.match}>{shade.matchPercent}% match</Text>
      </View>
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{body}</TouchableOpacity>;
  }
  return body;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardLarge: { padding: 16 },
  selected: { borderColor: colors.gold },
  swatch: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  swatchLarge: { width: 72, height: 72, borderRadius: 36, marginRight: 16 },
  text: { flex: 1 },
  brand: { color: colors.muted, fontSize: 12 },
  name: { color: colors.cream, fontSize: 16, fontWeight: '700', marginTop: 2 },
  nameLarge: { fontSize: 22 },
  match: { color: colors.goldSoft, fontSize: 13, fontWeight: '600', marginTop: 4 },
});
