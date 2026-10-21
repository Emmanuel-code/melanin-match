import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import { colors, radius } from '../lib/theme';
import { HERO_IMG } from '../lib/images';
import { loadPassport, ShadePassport } from '../lib/passport';
import { tourSeen } from '../lib/tour';

const STEPS = [
  { n: '1', title: 'Snap your selfie', desc: 'One clear photo, good light. That’s all we need.' },
  { n: '2', title: 'We read your skin', desc: 'YouCam AI measures your exact skin tone — tuned for deep tones.' },
  { n: '3', title: 'Try on your match', desc: 'See the foundation on YOUR face before you spend a cedi.' },
];

export default function HomeScreen() {
  const [passport, setPassport] = useState<ShadePassport | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPassport().then(setPassport).catch(() => {});
      tourSeen('onboarding').then(setOnboarded).catch(() => {});
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <Text style={styles.kicker}>FOR DEEP SKIN TONES</Text>
          <Text style={styles.title}>Peach{'\n'}Match</Text>
          <Text style={styles.tagline}>
            Foundation shades matched to YOUR skin. Built for the deep tones the beauty industry
            ignores.
          </Text>
        </FadeIn>

        <FadeIn delay={120}>
          <Image source={{ uri: HERO_IMG }} style={styles.hero} />
        </FadeIn>

        <FadeIn delay={220}>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.push(onboarded ? '/capture' : '/onboarding')}
          >
            <Text style={styles.ctaText}>Find my shade</Text>
          </TouchableOpacity>
        </FadeIn>

        {passport ? (
          <FadeIn delay={300}>
          <View style={styles.passport}>
            <Text style={styles.passportKicker}>YOUR SHADE PASSPORT</Text>
            <View style={styles.passportRow}>
              <View style={[styles.passportSwatch, { backgroundColor: passport.shadeHex }]} />
              <View style={styles.passportText}>
                <Text style={styles.passportShade}>
                  {passport.brand} {passport.line} — {passport.shadeName}
                </Text>
                <Text style={styles.passportMeta}>
                  {passport.matchPercent}% match · {passport.undertoneLabel} undertone
                  {passport.fitzpatrickLabel ? ` · ${passport.fitzpatrickLabel}` : ''}
                </Text>
                {passport.concealerLabel ? (
                  <Text style={styles.passportMeta}>Concealer: {passport.concealerLabel}</Text>
                ) : null}
                <Text style={styles.passportMeta}>
                  Saved {new Date(passport.savedAt).toLocaleDateString()} · kept on this device
                </Text>
              </View>
            </View>
          </View>
          </FadeIn>
        ) : null}

        <FadeIn delay={380}>
        <View style={styles.steps}>
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
          onPress={() => router.push({ pathname: '/onboarding', params: { replay: '1' } })}
        >
          <Text style={styles.linkText}>How Peach Match works →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/store')}
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
  scroll: { padding: 24, paddingTop: 40 },
  kicker: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: { color: colors.cream, fontSize: 56, fontWeight: '800', lineHeight: 58 },
  tagline: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 16 },
  hero: {
    width: '100%',
    aspectRatio: 1.55,
    borderRadius: radius.lg,
    marginTop: 24,
    backgroundColor: colors.surface,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: { color: '#1a120b', fontSize: 18, fontWeight: '800' },
  ctaGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.goldDim,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaGhostText: { color: colors.goldSoft, fontSize: 16, fontWeight: '700' },
  passport: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.goldDim,
  },
  passportKicker: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  passportRow: { flexDirection: 'row', alignItems: 'center' },
  passportSwatch: { width: 44, height: 44, borderRadius: 22, marginRight: 14 },
  passportText: { flex: 1 },
  passportShade: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  passportMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  steps: { marginTop: 36 },
  step: { flexDirection: 'row', marginBottom: 20 },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumText: { color: colors.goldSoft, fontSize: 16, fontWeight: '800' },
  stepText: { flex: 1 },
  stepTitle: { color: colors.cream, fontSize: 16, fontWeight: '700' },
  stepDesc: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 2 },
  fine: { color: colors.goldDim, fontSize: 12, textAlign: 'center', marginTop: 32 },
  linkBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 8 },
  linkText: { color: colors.goldSoft, fontSize: 15, fontWeight: '600' },
});
