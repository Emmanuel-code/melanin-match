import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';
import { hasSeenOnboarding } from '../lib/session';

const STEPS = [
  { n: '1', title: 'Snap your selfie', desc: 'One clear photo, good light. That’s all we need.' },
  { n: '2', title: 'We read your skin', desc: 'YouCam AI measures your exact skin tone — tuned for deep tones.' },
  { n: '3', title: 'Try on your match', desc: 'See the foundation on YOUR face before you spend a cedi.' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>FOR DEEP SKIN TONES</Text>
        <Text style={styles.title}>Peach{'\n'}Match</Text>
        <Text style={styles.tagline}>
          Foundation shades matched to YOUR skin. Built for the deep tones the beauty industry
          ignores.
        </Text>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => router.push(hasSeenOnboarding() ? '/capture' : '/onboarding')}
        >
          <Text style={styles.ctaText}>Find my shade</Text>
        </TouchableOpacity>

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
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  ctaText: { color: '#1a120b', fontSize: 18, fontWeight: '800' },
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
});
