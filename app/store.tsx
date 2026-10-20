import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SHADES, Shade } from '../lib/shades';
import { STORE_NAME } from '../lib/store';
import { colors, radius } from '../lib/theme';

const COMING: string[] = [
  'Order your exact matched shade directly from us — no shop hunting',
  'Orders open in WhatsApp, pre-filled with your shade',
  'Price and delivery confirmed in the chat before you pay',
];

export default function StoreScreen() {
  const brands = useMemo(() => {
    const map = new Map<string, Shade[]>();
    for (const s of SHADES) {
      const list = map.get(s.brand) ?? [];
      list.push(s);
      map.set(s.brand, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>OUR OWN STORE</Text>
        <Text style={styles.title}>{STORE_NAME}</Text>
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>COMING SOON</Text>
        </View>
        <Text style={styles.tagline}>
          Peach Match finds your shade. Soon, {STORE_NAME} sells it to you — the matcher and
          the shop under one roof, built for the tones the big stores skip.
        </Text>

        <View style={[styles.card, styles.comingCard]}>
          {COMING.map((line) => (
            <View key={line} style={styles.comingRow}>
              <Text style={styles.comingDot}>•</Text>
              <Text style={styles.comingText}>{line}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => router.push('/capture')}
        >
          <Text style={styles.ctaText}>Find my shade while I wait</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>A taste of the shelves</Text>
        <Text style={styles.previewNote}>
          The opening catalog — every shade Peach Match can match you to.
        </Text>

        {brands.map(([brand, shades]) => (
          <View key={brand}>
            <Text style={styles.sectionTitle}>{brand}</Text>
            <View style={styles.card}>
              {shades.map((s, i) => (
                <View
                  key={s.id}
                  style={[styles.row, i === shades.length - 1 && styles.rowLast]}
                >
                  <View style={[styles.swatch, { backgroundColor: s.hex }]} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>
                      {s.line} — {s.name}
                    </Text>
                  </View>
                  <View style={styles.soonTag}>
                    <Text style={styles.soonTagText}>Soon</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 12 },
  title: { color: colors.cream, fontSize: 36, fontWeight: '800' },
  soonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a2c14',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  soonBadgeText: { color: colors.goldSoft, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16 },
  comingCard: { paddingVertical: 8, marginTop: 20 },
  comingRow: { flexDirection: 'row', paddingVertical: 6 },
  comingDot: { color: colors.gold, fontSize: 15, marginRight: 10, fontWeight: '800' },
  comingText: { color: colors.cream, fontSize: 14, lineHeight: 20, flex: 1 },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaText: { color: '#1a120b', fontSize: 15, fontWeight: '800' },
  sectionTitle: { color: colors.cream, fontSize: 18, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  previewNote: { color: colors.muted, fontSize: 13, marginTop: -6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceLight,
  },
  rowLast: { borderBottomWidth: 0 },
  swatch: { width: 30, height: 30, borderRadius: 15, marginRight: 12 },
  rowText: { flex: 1 },
  rowName: { color: colors.cream, fontSize: 14, fontWeight: '600' },
  soonTag: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  soonTagText: { color: colors.goldSoft, fontSize: 12, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  linkText: { color: colors.goldSoft, fontSize: 15, fontWeight: '600' },
});
