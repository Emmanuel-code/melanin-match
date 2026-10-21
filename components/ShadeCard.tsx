import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { triggerHaptic } from '../lib/haptics';
import { MatchedShade } from '../lib/match';
import { colors, fonts, radius } from '../lib/theme';

interface Props {
  shade: MatchedShade;
  selected?: boolean;
  onPress?: () => void;
  large?: boolean;
}

export default function ShadeCard({ shade, selected, onPress, large }: Props) {
  const handlePress = () => {
    triggerHaptic.selection();
    onPress?.();
  };

  const getMatchQuality = (pct: number) => {
    if (pct >= 92) return 'Seamless Blend · Disappears into your jawline';
    if (pct >= 85) return 'Great Match · Blends naturally with your skin';
    return 'Closest Available Shade';
  };

  const body = (
    <View style={[styles.card, large && styles.cardLarge, selected && styles.selected]}>
      {large ? (
        <View style={styles.topBadgeRow}>
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>🛍️ REAL PRODUCT TO BUY IN STORES</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.contentRow}>
        <View style={styles.swatchWrap}>
          <View
            style={[
              styles.swatch,
              large && styles.swatchLarge,
              { backgroundColor: shade.hex },
            ]}
          />
          {large ? <Text style={styles.swatchCaption}>Liquid Tone</Text> : null}
        </View>

        <View style={styles.text}>
          <Text style={styles.brand} numberOfLines={1}>
            {shade.brand} · {shade.line}
          </Text>
          <Text style={[styles.name, large && styles.nameLarge]} numberOfLines={1}>
            Shade: {shade.name}
          </Text>
          <View style={styles.matchBadge}>
            <Text style={styles.match}>{shade.matchPercent}% match score</Text>
          </View>
        </View>
      </View>

      {large ? (
        <View style={styles.helperBox}>
          <Text style={styles.helperQuality}>{getMatchQuality(shade.matchPercent)}</Text>
          <Text style={styles.helperTip}>
            Ask for this exact name and shade number at beauty counters, stalls, or online.
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.82}>
        {body}
      </TouchableOpacity>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.12)',
  },
  cardLarge: {
    padding: 16,
    backgroundColor: colors.surfaceLight,
    borderColor: 'rgba(212, 162, 78, 0.35)',
    borderRadius: radius.lg,
  },
  topBadgeRow: {
    marginBottom: 10,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  productBadgeText: {
    color: colors.goldSoft,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selected: {
    borderColor: colors.gold,
    backgroundColor: '#27190d',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  swatchWrap: {
    alignItems: 'center',
    marginRight: 14,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  swatchLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: 'rgba(212, 162, 78, 0.5)',
  },
  swatchCaption: {
    color: colors.goldDim,
    fontSize: 9,
    fontFamily: fonts.bodySemi,
    marginTop: 4,
  },
  text: { flex: 1 },
  brand: {
    color: colors.goldSoft,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  name: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginTop: 2,
  },
  nameLarge: {
    fontFamily: fonts.displaySemi,
    fontSize: 19,
    marginTop: 2,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  match: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  helperBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 162, 78, 0.15)',
  },
  helperQuality: {
    color: colors.cream,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    marginBottom: 3,
  },
  helperTip: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.body,
    lineHeight: 16,
  },
});
