import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import { triggerHaptic } from '../lib/haptics';
import { ONBOARDING_PROBLEM_IMG, ONBOARDING_PROOF_IMG } from '../lib/images';
import { colors, fonts, radius, shadows } from '../lib/theme';
import { markTourSeen } from '../lib/tour';

interface Slide {
  kicker: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    kicker: 'THE PROBLEM',
    title: 'Made for deep skin.\nFirst.',
    body: '80% of women with deep skin struggle to find a true match. Store lighting lies, brand ranges stop at "medium", and a wrong buy is money gone. We start where everyone else stops.',
  },
  {
    kicker: 'THE SECRET',
    title: 'It’s not just depth.\nIt’s undertone.',
    body: 'Two shades can be equally deep and one still looks ashy or orange. The secret is your skin warmth: warm, neutral, or cool. We detect yours so your shade melts seamlessly into your jawline.',
  },
  {
    kicker: 'THE SCIENCE',
    title: 'One selfie.\nReal color science.',
    body: 'YouCam’s AI reads your exact skin tone. We match in CIELAB — the 3D color space cosmetic chemists use — across 78 shades from 10 brands, deep tones first. No guessing, no shop lighting.',
  },
  {
    kicker: 'THE PROOF',
    title: 'See it on your face\nbefore you spend.',
    body: 'Drag the split slider on your own photo to compare your bare skin with your matched foundation. No fake blur, no guesswork — just the honest shade before you spend a cedi.',
  },
  {
    kicker: 'THE KEEPSAKE',
    title: 'Your Shade Passport\n& Peach Cosmetics.',
    body: 'Your match is saved on this phone as a Shade Passport. Check it anytime in-store. And soon, Peach Cosmetics — our own flagship boutique — delivers your exact shade straight to your door.',
  },
];

const UNDERTONES = [
  { id: 'warm', label: 'Warm Golden', hex: '#d4a24e', note: 'Rich peach & golden undertones' },
  { id: 'neutral', label: 'Rich Neutral', hex: '#8c593b', note: 'Balanced olive & espresso' },
  { id: 'cool', label: 'Deep Cool', hex: '#542d20', note: 'Rich mahogany with red/blue hint' },
];

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ replay?: string }>();
  const [page, setPage] = useState(0);
  const [selectedUndertone, setSelectedUndertone] = useState('warm');
  const [demoSlider, setDemoSlider] = useState(0.5);
  const [cardW, setCardW] = useState(0);

  const slide = SLIDES[page];
  const last = page === SLIDES.length - 1;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (e) => {
        if (cardW > 0) {
          const pos = Math.min(1, Math.max(0, e.nativeEvent.locationX / cardW));
          setDemoSlider(pos);
        }
      },
    }),
  ).current;

  const finish = () => {
    triggerHaptic.medium();
    markTourSeen('onboarding');
    if (params.replay === '1') router.back();
    else router.replace('/capture');
  };

  const handleNext = () => {
    triggerHaptic.selection();
    if (last) finish();
    else setPage(page + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.pageCountBadge}>
          <Text style={styles.pageCountText}>0{page + 1} / 05</Text>
        </View>
        <TouchableOpacity style={styles.skip} onPress={finish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeIn key={page}>
          {/* SLIDE 0: Problem with Real Editorial Image & Stats */}
          {page === 0 ? (
            <View style={styles.visualWrap}>
              <View style={styles.imageCard}>
                <Image source={{ uri: ONBOARDING_PROBLEM_IMG }} style={styles.slideImage} />
                <BlurView intensity={70} tint="dark" style={styles.statBanner}>
                  <Text style={styles.statBig}>80%</Text>
                  <Text style={styles.statText}>
                    of women with deep skin struggle to find a matching shade in beauty stores.
                  </Text>
                </BlurView>
              </View>
              <View style={styles.paletteRow}>
                {['#381e13', '#4d2b1c', '#683d28', '#8a5235', '#b07049'].map((hex, i) => (
                  <View key={hex} style={[styles.paletteSwatch, { backgroundColor: hex }]}>
                    <Text style={styles.paletteFitz}>VI-{i + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* SLIDE 1: Interactive Undertone Selector */}
          {page === 1 ? (
            <View style={styles.visualWrap}>
              <Text style={styles.visualHeader}>TAP TO EXPLORE UNDERTONES</Text>
              <View style={styles.undertoneCards}>
                {UNDERTONES.map((u) => {
                  const active = selectedUndertone === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.undertoneCard, active && styles.undertoneCardActive]}
                      activeOpacity={0.85}
                      onPress={() => {
                        triggerHaptic.selection();
                        setSelectedUndertone(u.id);
                      }}
                    >
                      <View style={[styles.undertoneSwatch, { backgroundColor: u.hex }]}>
                        {active ? <Text style={styles.checkIcon}>✓</Text> : null}
                      </View>
                      <View style={styles.undertoneTextWrap}>
                        <Text style={[styles.undertoneLabel, active && styles.undertoneLabelActive]}>
                          {u.label}
                        </Text>
                        <Text style={styles.undertoneNote}>{u.note}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* SLIDE 2: CIELAB Cosmetic Science Radar */}
          {page === 2 ? (
            <View style={styles.visualWrap}>
              <View style={styles.scienceCard}>
                <View style={styles.scienceHeaderRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.scienceKicker}>CIELAB SPECTRAL ENGINE</Text>
                  <View style={styles.labBadge}>
                    <Text style={styles.labBadgeText}>3D COLOR SPACE</Text>
                  </View>
                </View>

                <View style={styles.coordGrid}>
                  <View style={styles.coordBox}>
                    <Text style={styles.coordVal}>L* 28.4</Text>
                    <Text style={styles.coordName}>Depth Level</Text>
                  </View>
                  <View style={styles.coordBox}>
                    <Text style={styles.coordVal}>a* +12.1</Text>
                    <Text style={styles.coordName}>Melanin Tone</Text>
                  </View>
                  <View style={styles.coordBox}>
                    <Text style={styles.coordVal}>b* +16.8</Text>
                    <Text style={styles.coordName}>Golden Warmth</Text>
                  </View>
                </View>

                <View style={styles.scienceMetrics}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Ashy/Grey Risk Index</Text>
                    <Text style={styles.metricValue}>0.0% (Zero Ash)</Text>
                  </View>
                  <View style={styles.metricTrack}>
                    <View style={styles.metricFill} />
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Formulas Mapped</Text>
                    <Text style={styles.metricValue}>78 Luxury Shades</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* SLIDE 3: Interactive Mini Split Try-On Demo */}
          {page === 3 ? (
            <View style={styles.visualWrap}>
              <View
                style={styles.demoSliderWrap}
                onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
                {...panResponder.panHandlers}
              >
                <Image source={{ uri: ONBOARDING_PROOF_IMG }} style={styles.demoImage} />
                <View style={[styles.demoClip, { width: `${demoSlider * 100}%` }]}>
                  <Image source={{ uri: ONBOARDING_PROOF_IMG }} style={[styles.demoImage, { width: cardW || undefined }]} />
                </View>

                {/* Divider Line */}
                <View style={[styles.demoDivider, { left: `${demoSlider * 100}%` }]} pointerEvents="none" />

                {/* Handle */}
                <View style={[styles.demoHandle, { left: `${demoSlider * 100}%` }]} pointerEvents="none">
                  <Text style={styles.demoHandleArrow}>‹ ›</Text>
                </View>

                {/* Tags */}
                <BlurView intensity={70} tint="dark" style={styles.demoTagL}>
                  <Text style={styles.demoTagText}>With Match</Text>
                </BlurView>
                <BlurView intensity={70} tint="dark" style={styles.demoTagR}>
                  <Text style={styles.demoTagText}>Bare Skin</Text>
                </BlurView>
              </View>
              <Text style={styles.demoTip}>Slide left and right to test the split mirror</Text>
            </View>
          ) : null}

          {/* SLIDE 4: VIP Shade Passport & Peach Cosmetics */}
          {page === 4 ? (
            <View style={styles.visualWrap}>
              <View style={styles.passportCard}>
                <View style={styles.passportChipRow}>
                  <View style={styles.passportChip}>
                    <View style={styles.passportChipInner} />
                  </View>
                  <Text style={styles.passportFoil}>PEACH SHADE PASSPORT</Text>
                  <Text style={styles.passportYear}>2026</Text>
                </View>
                <View style={styles.passportMainRow}>
                  <View style={styles.passportBigSwatch} />
                  <View style={styles.passportDetail}>
                    <Text style={styles.passportName}>Fenty Beauty 450</Text>
                    <Text style={styles.passportMeta}>98% Match · Warm Golden · Fitz VI</Text>
                    <Text style={styles.passportPerk}>✦ Free lifetime shade swaps at our boutique</Text>
                  </View>
                </View>
                <View style={styles.peachStoreTeaser}>
                  <Text style={styles.peachTeaserKicker}>FLAGSHIP BOUTIQUE COMING SOON</Text>
                  <Text style={styles.peachTeaserText}>
                    Order directly through WhatsApp with local delivery across Accra & nationwide.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.kickerBadge}>
            <Text style={styles.kicker}>{slide.kicker}</Text>
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </FadeIn>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={handleNext}>
          <Text style={styles.ctaText}>{last ? 'Find my shade' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pageCountBadge: {
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
  },
  pageCountText: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
  },
  skip: { paddingVertical: 6, paddingHorizontal: 8 },
  skipText: { color: colors.muted, fontSize: 13, fontFamily: fonts.bodySemi },
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  visualWrap: {
    marginTop: 14,
    marginBottom: 20,
  },
  visualHeader: {
    color: colors.goldDim,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    marginBottom: 10,
  },
  imageCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.3)',
    position: 'relative',
    ...shadows.card,
  },
  slideImage: {
    width: '100%',
    height: 230,
    backgroundColor: colors.surface,
  },
  statBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBig: {
    color: colors.gold,
    fontSize: 28,
    fontFamily: fonts.display,
  },
  statText: {
    color: colors.cream,
    fontSize: 12,
    fontFamily: fonts.bodySemi,
    lineHeight: 16,
    flex: 1,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  paletteSwatch: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paletteFitz: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontFamily: fonts.bodyBold,
  },
  undertoneCards: { gap: 10 },
  undertoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  undertoneCardActive: {
    backgroundColor: '#27170c',
    borderColor: colors.gold,
    ...shadows.subtle,
  },
  undertoneSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  undertoneTextWrap: { flex: 1 },
  undertoneLabel: {
    color: colors.cream,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  undertoneLabelActive: {
    color: colors.goldSoft,
  },
  undertoneNote: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  scienceCard: {
    backgroundColor: 'rgba(27, 17, 10, 0.85)',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.35)',
    ...shadows.card,
  },
  scienceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  scienceKicker: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    flex: 1,
  },
  labBadge: {
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  labBadgeText: {
    color: colors.goldSoft,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  coordGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  coordBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  coordVal: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodyExtra,
  },
  coordName: {
    color: colors.muted,
    fontSize: 10,
    fontFamily: fonts.bodySemi,
    marginTop: 2,
  },
  scienceMetrics: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 12,
    borderRadius: radius.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  metricLabel: {
    color: colors.creamSoft,
    fontSize: 11,
    fontFamily: fonts.bodySemi,
  },
  metricValue: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  metricTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 6,
  },
  metricFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.gold,
  },
  demoSliderWrap: {
    height: 220,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.3)',
    position: 'relative',
    ...shadows.card,
  },
  demoImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface,
  },
  demoClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  demoDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    marginLeft: -1.25,
    backgroundColor: colors.gold,
  },
  demoHandle: {
    position: 'absolute',
    top: '50%',
    width: 36,
    height: 28,
    borderRadius: radius.full,
    marginLeft: -18,
    marginTop: -14,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: '#150d07',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoHandleArrow: {
    color: '#150d07',
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  demoTagL: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  demoTagR: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  demoTagText: {
    color: colors.cream,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
  },
  demoTip: {
    color: colors.goldDim,
    fontSize: 11,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: 8,
  },
  passportCard: {
    backgroundColor: '#23150c',
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    ...shadows.glowGold,
  },
  passportChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  passportChip: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.goldSoft,
    marginRight: 10,
    padding: 3,
  },
  passportChipInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#150d07',
    borderRadius: 2,
  },
  passportFoil: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    flex: 1,
  },
  passportYear: {
    color: colors.goldDim,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  passportMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  passportBigSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5a3422',
    marginRight: 14,
    borderWidth: 2,
    borderColor: colors.goldSoft,
  },
  passportDetail: { flex: 1 },
  passportName: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  passportMeta: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodySemi,
    marginTop: 2,
  },
  passportPerk: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  peachStoreTeaser: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 162, 78, 0.25)',
    paddingTop: 10,
  },
  peachTeaserKicker: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  peachTeaserText: {
    color: colors.creamSoft,
    fontSize: 11,
    fontFamily: fonts.body,
    lineHeight: 16,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
  },
  title: {
    color: colors.cream,
    fontSize: 30,
    fontFamily: fonts.display,
    lineHeight: 36,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 28,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.glowGold,
  },
  ctaText: {
    color: '#150d07',
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
});
