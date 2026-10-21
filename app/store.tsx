import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoachTip from '../components/CoachTip';
import FadeIn from '../components/FadeIn';
import { triggerHaptic } from '../lib/haptics';
import { SHADES, Shade } from '../lib/shades';
import { STORE_NAME, STORE_WHATSAPP } from '../lib/store';
import { colors, fonts, radius, shadows } from '../lib/theme';

const PERKS = [
  {
    icon: '✦',
    title: '100% Jawline Match Guarantee',
    desc: 'If your shade doesn’t seamlessly melt into your skin and neck, we swap it free of charge.',
  },
  {
    icon: '✦',
    title: '1-Tap WhatsApp Concierge',
    desc: 'Orders open with your exact Shade Passport pre-filled. Confirm delivery with our Accra team.',
  },
  {
    icon: '✦',
    title: 'Local Payment Options',
    desc: 'Pay with MTN MoMo, Telecel Cash, or Cash on Delivery across Greater Accra & nationwide.',
  },
];

export default function StoreScreen() {
  const [selectedBrand, setSelectedBrand] = useState('All');

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    for (const s of SHADES) {
      set.add(s.brand);
    }
    return ['All', ...Array.from(set)];
  }, []);

  const filteredShades = useMemo(() => {
    if (selectedBrand === 'All') return SHADES;
    return SHADES.filter((s) => s.brand === selectedBrand);
  }, [selectedBrand]);

  const joinVipList = () => {
    triggerHaptic.medium();
    const msg = `Hi ${STORE_NAME}! I found my shade with Peach Match and I'd love VIP early access to your shop launch in Accra.`;
    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  const notifyShade = (shade: Shade) => {
    triggerHaptic.selection();
    const msg = `Hi ${STORE_NAME}! Please notify me when ${shade.brand} ${shade.line} in shade ${shade.name} is in stock.`;
    const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={styles.topBar}>
            <View style={styles.kickerBadge}>
              <Text style={styles.kicker}>FLAGSHIP BOUTIQUE</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>LAUNCHING SOON</Text>
            </View>
          </View>

          <Text style={styles.title}>{STORE_NAME}</Text>
          <Text style={styles.subtitle}>The Deep-Tone Beauty Destination · Accra & Nationwide</Text>
          <Text style={styles.tagline}>
            Peach Match finds your perfect shade. Soon, {STORE_NAME} delivers it straight to your door.
            No more shop hunting, no wrong buys, and no guessing under fluorescent mall lighting.
          </Text>
        </FadeIn>

        {/* VIP Launch Card */}
        <FadeIn delay={60}>
          <View style={styles.vipCard}>
            <View style={styles.vipHeader}>
              <Text style={styles.vipCrown}>👑</Text>
              <View style={styles.vipHeaderTextWrap}>
                <Text style={styles.vipTitle}>VIP Early Access Waitlist</Text>
                <Text style={styles.vipSub}>First 200 orders get free delivery in Accra</Text>
              </View>
            </View>

            <View style={styles.perksList}>
              {PERKS.map((p) => (
                <View key={p.title} style={styles.perkRow}>
                  <Text style={styles.perkDot}>{p.icon}</Text>
                  <View style={styles.perkTextWrap}>
                    <Text style={styles.perkTitle}>{p.title}</Text>
                    <Text style={styles.perkDesc}>{p.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.vipBtn}
              activeOpacity={0.85}
              onPress={joinVipList}
            >
              <Text style={styles.vipBtnText}>Join the VIP Waitlist on WhatsApp →</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* Signature Products Showcase */}
        <FadeIn delay={90}>
          <Text style={styles.sectionTitle}>Signature Products</Text>
          <Text style={styles.previewNote}>
            Designed exclusively for deep skin tones · Formulated for West African climate
          </Text>

          <View style={styles.productGrid}>
            {/* Product 1: Foundation */}
            <View style={styles.productCard}>
              <View style={styles.productImageWrap}>
                <Image
                  source={require('../assets/peach-foundation.jpg')}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productTag}>
                  <Text style={styles.productTagText}>SIGNATURE</Text>
                </View>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{STORE_NAME}</Text>
                <Text style={styles.productTitle}>Ultimate Skin Foundation</Text>
                <Text style={styles.productShadesText}>
                  Deep Mahogany, Rich Cocoa & Warm Amber Shades
                </Text>
                <View style={styles.productFeatureRow}>
                  <Text style={styles.productFeature}>✦ Flawless Matte</Text>
                  <Text style={styles.productFeature}>✦ All-Day Oil Control</Text>
                  <Text style={styles.productFeature}>✦ Transfer-Proof</Text>
                </View>
                <TouchableOpacity
                  style={styles.preorderBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    triggerHaptic.selection();
                    const msg = `Hi ${STORE_NAME}! I would like to pre-order the Ultimate Skin Foundation.`;
                    Linking.openURL(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`).catch(() => {});
                  }}
                >
                  <Text style={styles.preorderBtnText}>Pre-Order Foundation on WhatsApp →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Product 2: Concealer */}
            <View style={styles.productCard}>
              <View style={styles.productImageWrap}>
                <Image
                  source={require('../assets/peach-concealer.jpg')}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productTag}>
                  <Text style={styles.productTagText}>NEW ARRIVAL</Text>
                </View>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{STORE_NAME}</Text>
                <Text style={styles.productTitle}>Liquid Concealer</Text>
                <Text style={styles.productShadesText}>
                  Rich Golden Caramel, Chestnut & Espresso
                </Text>
                <View style={styles.productFeatureRow}>
                  <Text style={styles.productFeature}>✦ 16hr Crease-Proof</Text>
                  <Text style={styles.productFeature}>✦ Zero Chalkiness</Text>
                  <Text style={styles.productFeature}>✦ Soft Glow</Text>
                </View>
                <TouchableOpacity
                  style={styles.preorderBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    triggerHaptic.selection();
                    const msg = `Hi ${STORE_NAME}! I would like to pre-order the Liquid Concealer.`;
                    Linking.openURL(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`).catch(() => {});
                  }}
                >
                  <Text style={styles.preorderBtnText}>Pre-Order Concealer on WhatsApp →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Scan Callout */}
        <FadeIn delay={120}>
          <TouchableOpacity
            style={styles.scanCta}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic.medium();
              router.push('/capture');
            }}
          >
            <View style={styles.scanCtaTextWrap}>
              <Text style={styles.scanCtaKicker}>DON'T HAVE YOUR SHADE YET?</Text>
              <Text style={styles.scanCtaTitle}>Find your shade while you wait</Text>
            </View>
            <Text style={styles.scanCtaArrow}>→</Text>
          </TouchableOpacity>
        </FadeIn>

        {/* Shelves Preview Catalog */}
        <FadeIn delay={180}>
          <View style={styles.catalogHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Opening Shelves</Text>
              <Text style={styles.previewNote}>
                {SHADES.length} deep formulas curated for dark skin
              </Text>
            </View>
          </View>

          {/* Brand Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandPills}
          >
            {allBrands.map((b) => {
              const active = selectedBrand === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.brandPill, active && styles.brandPillActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    triggerHaptic.selection();
                    setSelectedBrand(b);
                  }}
                >
                  <Text style={[styles.brandPillText, active && styles.brandPillTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Shade Cards List */}
          <View style={styles.card}>
            {filteredShades.map((s, i) => (
              <View
                key={s.id}
                style={[styles.row, i === filteredShades.length - 1 && styles.rowLast]}
              >
                <View style={[styles.swatch, { backgroundColor: s.hex }]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowBrand}>{s.brand}</Text>
                  <Text style={styles.rowName}>
                    {s.line} — shade {s.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.notifyBtn}
                  activeOpacity={0.8}
                  onPress={() => notifyShade(s)}
                >
                  <Text style={styles.notifyBtnText}>Notify Me</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </FadeIn>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic.light();
            router.back();
          }}
        >
          <Text style={styles.linkText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>

      <CoachTip
        tourKey="store"
        steps={[
          {
            title: 'Peach Cosmetics Shelves',
            body: 'This is Peach Cosmetics’ launch catalog. Tap "Notify Me" on any shade to request VIP alert when our stock arrives in Accra!',
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 20, paddingBottom: 60 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kickerBadge: {
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
  },
  soonBadge: {
    backgroundColor: 'rgba(212, 162, 78, 0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  soonBadgeText: {
    color: colors.goldSoft,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
  },
  title: {
    color: colors.cream,
    fontSize: 34,
    fontFamily: fonts.display,
    marginTop: 4,
  },
  subtitle: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodySemi,
    marginTop: 4,
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
    marginTop: 12,
  },
  vipCard: {
    backgroundColor: 'rgba(38, 23, 12, 0.9)',
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.4)',
    ...shadows.glowGold,
  },
  vipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  vipCrown: { fontSize: 28 },
  vipHeaderTextWrap: { flex: 1 },
  vipTitle: {
    color: colors.cream,
    fontSize: 18,
    fontFamily: fonts.displaySemi,
  },
  vipSub: {
    color: colors.goldSoft,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  perksList: { gap: 12, marginBottom: 18 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  perkDot: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 2,
  },
  perkTextWrap: { flex: 1 },
  perkTitle: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  perkDesc: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 17,
    marginTop: 2,
  },
  vipBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...shadows.glowGold,
  },
  vipBtnText: {
    color: '#150d07',
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  productGrid: {
    gap: 18,
    marginTop: 10,
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.25)',
    ...shadows.card,
  },
  productImageWrap: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#1b110a',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productTagText: {
    color: '#150d07',
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
  },
  productInfo: {
    padding: 18,
  },
  productBrand: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
  },
  productTitle: {
    color: colors.cream,
    fontSize: 20,
    fontFamily: fonts.displaySemi,
    marginTop: 3,
  },
  productShadesText: {
    color: colors.goldSoft,
    fontSize: 13,
    fontFamily: fonts.bodySemi,
    marginTop: 4,
  },
  productFeatureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  productFeature: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  preorderBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    ...shadows.subtle,
  },
  preorderBtnText: {
    color: '#150d07',
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.2)',
    marginTop: 18,
  },
  scanCtaTextWrap: { flex: 1 },
  scanCtaKicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
  },
  scanCtaTitle: {
    color: colors.cream,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    marginTop: 2,
  },
  scanCtaArrow: {
    color: colors.gold,
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    marginLeft: 10,
  },
  catalogHeaderRow: {
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.cream,
    fontSize: 22,
    fontFamily: fonts.displaySemi,
  },
  previewNote: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  brandPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  brandPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  brandPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  brandPillText: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodySemi,
  },
  brandPillTextActive: {
    color: '#150d07',
    fontFamily: fonts.bodyBold,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 162, 78, 0.1)',
  },
  rowLast: { borderBottomWidth: 0 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rowText: { flex: 1 },
  rowBrand: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },
  rowName: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    marginTop: 1,
  },
  notifyBtn: {
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  notifyBtnText: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  linkBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 8 },
  linkText: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodySemi,
  },
});
