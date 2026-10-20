import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';
import { markOnboardingSeen } from '../lib/session';

interface Slide {
  kicker: string;
  title: string;
  body: string;
  swatches: string[];
}

const SLIDES: Slide[] = [
  {
    kicker: 'THE PROBLEM',
    title: 'Made for deep skin. First.',
    body: '80% of women of color say they can’t find a foundation that matches. Store lighting lies, ranges stop at “medium”, and a wrong buy is money gone. We start where everyone else stops.',
    swatches: ['#a06a42', '#7d4f30', '#5c3a24', '#3d271b', '#2a1a10'],
  },
  {
    kicker: 'THE SECRET',
    title: 'It’s not just depth.\nIt’s undertone.',
    body: 'Two shades can be equally dark and one still looks ashy. The difference is undertone — warm, neutral, or cool. We detect yours and rank shades that flatter it, not just match your depth.',
    swatches: ['#d4a24e', '#c9a227', '#ab9a7e', '#b76e79', '#8e4a5b'],
  },
  {
    kicker: 'THE PROOF',
    title: 'See it on your face first.',
    body: 'Your match isn’t a guess — you try it on your own photo before you spend a cedi. No beautifying blur, just the honest shade. And if your photo’s lighting is bad, we’ll tell you to retake it instead of selling you a lie.',
    swatches: ['#e9c37e', '#d4a24e', '#b97f2e'],
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const slide = SLIDES[page];
  const last = page === SLIDES.length - 1;

  const finish = () => {
    markOnboardingSeen();
    router.replace('/capture');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <TouchableOpacity style={styles.skip} onPress={finish} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.swatches}>
          {slide.swatches.map((hex) => (
            <View key={hex} style={[styles.swatch, { backgroundColor: hex }]} />
          ))}
        </View>

        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => (last ? finish() : setPage(page + 1))}
          >
            <Text style={styles.ctaText}>{last ? 'Find my shade' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, paddingTop: 16 },
  skip: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  swatches: { flexDirection: 'row', gap: 10, marginTop: 40, marginBottom: 36 },
  swatch: { width: 44, height: 44, borderRadius: 22 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 3 },
  title: { color: colors.cream, fontSize: 36, fontWeight: '800', lineHeight: 42, marginTop: 14 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 16 },
  footer: { marginTop: 'auto' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceLight },
  dotActive: { backgroundColor: colors.gold, width: 24 },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#1a120b', fontSize: 18, fontWeight: '800' },
});
