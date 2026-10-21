import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import { triggerHaptic } from '../lib/haptics';
import { HERO_IMG } from '../lib/images';
import { loadPassport, ShadePassport } from '../lib/passport';
import { colors, fonts, radius, shadows } from '../lib/theme';
import { tourSeen } from '../lib/tour';

const STEPS = [
  { n: '1', title: 'Snap your selfie', desc: 'One clear photo, natural light. That’s all we need.' },
  { n: '2', title: 'We read your skin', desc: 'YouCam AI measures your exact skin tone — tuned for deep tones.' },
  { n: '3', title: 'Try on your match', desc: 'See the foundation on YOUR face before you spend a cedi.' },
];

export default function HomeScreen() {
  const [passport, setPassport] = useState<ShadePassport | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [showHackathonCard, setShowHackathonCard] = useState(true);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // 3-second prominent hackathon model card auto-dismiss / collapse
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0.9,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPassport().then(setPassport).catch(() => {});
      tourSeen('onboarding').then(setOnboarded).catch(() => {});
    }, []),
  );

  const handleStart = () => {
    triggerHaptic.medium();
    router.push(onboarded ? '/capture' : '/onboarding');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Modern App Top Bar */}
        <FadeIn>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Text style={styles.brandPeachIcon}>🍑</Text>
              <Text style={styles.brandText}>PEACH MATCH</Text>
            </View>
            <View style={styles.youcamBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.youcamBadgeText}>YOUCAM AI ENGINE</Text>
            </View>
          </View>

          {/* 3-Second Hackathon Model Card */}
          {showHackathonCard ? (
            <Animated.View
              style={[
                styles.hackathonCard,
                { opacity: cardOpacity, transform: [{ scale: cardScale }] },
              ]}
            >
              <View style={styles.hackathonTop}>
                <View style={styles.hackathonKickerPill}>
                  <Text style={styles.hackathonKickerText}>⚡ OFFICIAL HACKATHON ENTRY</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowHackathonCard(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeCardX}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hackathonTitle}>Peach Match · Deep Skin AI</Text>
              <Text style={styles.hackathonDesc}>
                Precision CIELAB color-matching & Virtual Try-On for African and diaspora skin tones, powered by YouCam's Server-to-Server AI.
              </Text>
              <View style={styles.hackathonFooter}>
                <Text style={styles.youcamPowered}>POWERED BY YOUCAM SKIN AI & VTO</Text>
              </View>
            </Animated.View>
          ) : null}

          <Text style={styles.title}>Find Your True Foundation</Text>
          <Text style={styles.tagline}>
            No more ashy flashback or oxidation guesswork. One photo matches your exact jawline depth & undertone.
          </Text>
        </FadeIn>

        <FadeIn delay={120}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: HERO_IMG }} style={styles.hero} />
            <View style={styles.heroGlow} />
          </View>
        </FadeIn>

        <FadeIn delay={220}>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={handleStart}
          >
            <Text style={styles.ctaText}>Find my shade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.auditCta}
            activeOpacity={0.85}
            onPress={() => {
              triggerHaptic.selection();
              if (passport) {
                router.push({
                  pathname: '/audit',
                  params: { skinHex: passport.shadeHex },
                });
              } else {
                router.push('/audit');
              }
            }}
          >
            <Text style={styles.auditCtaText}>🔍 Test My Current Foundation (Makeup Bag Audit)</Text>
          </TouchableOpacity>
        </FadeIn>

        {passport ? (
          <FadeIn delay={300}>
            <View style={styles.passport}>
              <View style={styles.passportHeader}>
                <View style={styles.passportDot} />
                <Text style={styles.passportKicker}>YOUR SHADE PASSPORT</Text>
              </View>
              <View style={styles.passportRow}>
                <View style={[styles.passportSwatch, { backgroundColor: passport.shadeHex }]} />
                <View style={styles.passportText}>
                  <Text style={styles.passportShade}>
                    {passport.brand} {passport.line}
                  </Text>
                  <Text style={styles.passportShadeName}>
                    {passport.shadeName}
                  </Text>
                  <Text style={styles.passportMeta}>
                    {passport.matchPercent}% match · {passport.undertoneLabel} undertone
                    {passport.fitzpatrickLabel ? ` · ${passport.fitzpatrickLabel}` : ''}
                  </Text>
                  {passport.concealerLabel ? (
                    <Text style={styles.passportMeta}>Concealer: {passport.concealerLabel}</Text>
                  ) : null}
                  <Text style={styles.passportSaved}>
                    Saved on this device · re-scan each season
                  </Text>
                </View>
              </View>
            </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={360}>
          <View style={styles.steps}>
            <Text style={styles.sectionHeader}>How it works</Text>
            {STEPS.map((s) => (
              <View key={s.n} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.n}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeIn>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic.selection();
            router.push({ pathname: '/onboarding', params: { replay: '1' } });
          }}
        >
          <Text style={styles.linkText}>The story behind Peach Match →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic.selection();
            router.push('/store');
          }}
        >
          <Text style={styles.linkText}>Peach Cosmetics store — coming soon →</Text>
        </TouchableOpacity>

        <Text style={styles.fine}>Powered by YouCam Skin AI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 36, paddingBottom: 48 },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  kicker: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 162, 78, 0.15)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandPeachIcon: {
    fontSize: 20,
  },
  brandText: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
  },
  youcamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
  },
  youcamBadgeText: {
    color: colors.goldSoft,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.8,
  },
  hackathonCard: {
    backgroundColor: 'rgba(38, 23, 12, 0.92)',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.45)',
    marginBottom: 22,
    ...shadows.glowGold,
  },
  hackathonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hackathonKickerPill: {
    backgroundColor: 'rgba(212, 162, 78, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  hackathonKickerText: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
  },
  closeCardX: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    padding: 4,
  },
  hackathonTitle: {
    color: colors.cream,
    fontSize: 17,
    fontFamily: fonts.displayBold,
    marginBottom: 4,
  },
  hackathonDesc: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 17,
    marginBottom: 10,
  },
  hackathonFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 162, 78, 0.15)',
    paddingTop: 8,
  },
  youcamPowered: {
    color: colors.goldSoft,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
  },
  title: {
    color: colors.cream,
    fontSize: 34,
    fontFamily: fonts.displayBold,
    lineHeight: 40,
    letterSpacing: -0.2,
  },
  tagline: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 21,
    marginTop: 8,
  },
  heroWrap: {
    position: 'relative',
    marginTop: 26,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.25)',
    ...shadows.card,
  },
  hero: {
    width: '100%',
    aspectRatio: 1.55,
    backgroundColor: colors.surface,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    ...shadows.glowGold,
  },
  ctaText: {
    color: '#150d07',
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },
  auditCta: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.4)',
    backgroundColor: 'rgba(212, 162, 78, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditCtaText: {
    color: colors.goldSoft,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  passport: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.35)',
    ...shadows.subtle,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passportDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  passportKicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
  },
  passportRow: { flexDirection: 'row', alignItems: 'center' },
  passportSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  passportText: { flex: 1 },
  passportShade: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  passportShadeName: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.displaySemi,
    marginTop: 2,
  },
  passportMeta: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  passportSaved: {
    color: colors.goldDim,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    marginTop: 5,
  },
  sectionHeader: {
    color: colors.cream,
    fontSize: 20,
    fontFamily: fonts.displaySemi,
    marginBottom: 18,
  },
  steps: { marginTop: 38 },
  step: { flexDirection: 'row', marginBottom: 22 },
  stepNum: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumText: {
    color: colors.goldSoft,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  stepText: { flex: 1 },
  stepTitle: {
    color: colors.cream,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  stepDesc: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 19,
    marginTop: 3,
  },
  fine: {
    color: colors.goldDim,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    textAlign: 'center',
    marginTop: 36,
  },
  linkBtn: { alignItems: 'center', marginTop: 22, paddingVertical: 6 },
  linkText: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodySemi,
  },
});
