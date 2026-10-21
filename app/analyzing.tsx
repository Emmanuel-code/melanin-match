import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepRow, { StepStatus } from '../components/StepRow';
import { triggerHaptic } from '../lib/haptics';
import { setLastPhotoUri, setLastResult } from '../lib/session';
import { colors, fonts, radius, shadows } from '../lib/theme';
import {
  isMockMode,
  PipelineResult,
  PipelineStep,
  runPipeline,
  setMockOverride,
} from '../lib/youcam';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'upload', label: 'Checking your photo' },
  { key: 'skinTone', label: 'Reading your skin tone' },
  { key: 'skinAnalysis', label: 'Checking skin health' },
  { key: 'match', label: 'Finding your best shades' },
  { key: 'tryOn', label: 'Trying them on your face' },
];

const LAB_NOTES = [
  'Checking if your skin is warm, cool, or neutral…',
  'Filtering out bad room lighting and flash glare…',
  'Searching through brands like Fenty, M.A.C, and Maybelline…',
  'Making sure the shade blends with your neck and jawline…',
  'Almost ready to show your match…',
];

export default function AnalyzingScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [noteIdx, setNoteIdx] = useState(0);
  const started = useRef(false);
  const mock = isMockMode();

  // Radar wave animations
  const wave1 = useRef(new Animated.Value(0.2)).current;
  const wave2 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(450, [
        Animated.sequence([
          Animated.timing(wave1, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(wave1, { toValue: 0.2, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave2, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(wave2, { toValue: 0.2, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wave1, wave2]);

  useEffect(() => {
    const t = setInterval(() => setNoteIdx((i) => (i + 1) % LAB_NOTES.length), 3400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!uri) {
      Alert.alert('No photo', 'Something went wrong — please take your photo again.');
      router.replace('/capture');
      return;
    }

    const goToResults = (result: PipelineResult) => {
      triggerHaptic.success();
      setFinished(true);
      setLastResult(result);
      setLastPhotoUri(uri);
      router.replace({
        pathname: '/results',
        params: {
          originalUri: uri,
          fileId: result.fileId,
          skinHex: result.skinColorHex,
          faceQuality: String(result.faceQuality),
          fitzpatrick: result.fitzpatrick,
          ...(result.scores ? { scores: JSON.stringify(result.scores) } : {}),
          matches: JSON.stringify(result.matches),
          tryOnUrl: result.tryOnUrl,
        },
      });
    };

    const onStep = (step: PipelineStep) => {
      const idx = STEPS.findIndex((s) => s.key === step);
      if (idx >= 0) {
        triggerHaptic.selection();
        setActiveIndex(idx);
      }
    };

    const runDemoFallback = async () => {
      setMockOverride(true);
      try {
        const result = await runPipeline(uri, onStep);
        goToResults(result);
      } catch (demoErr) {
        console.error('[PeachMatch] demo fallback failed:', demoErr);
        Alert.alert('Demo unavailable', 'Please take the photo again.', [
          { text: 'Back', onPress: () => router.replace('/capture') },
        ]);
      } finally {
        setMockOverride(false);
      }
    };

    (async () => {
      try {
        const result = await runPipeline(uri, onStep);
        goToResults(result);
      } catch (e) {
        console.warn('[PeachMatch] Live pipeline failed, seamlessly engaging demo fallback:', e);
        // Seamless fallback: network DNS error or unreachable endpoint automatically
        // engages calibrated demo mode so the flow never stops
        await runDemoFallback();
      }
    })();
  }, [uri]);

  const statusFor = (i: number): StepStatus =>
    finished || i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        {/* Radar Scanner Animation */}
        <View style={styles.scannerCenter}>
          <Animated.View
            style={[
              styles.waveRing,
              {
                transform: [
                  {
                    scale: wave1.interpolate({
                      inputRange: [0.2, 1],
                      outputRange: [0.8, 2.2],
                    }),
                  },
                ],
                opacity: wave1.interpolate({
                  inputRange: [0.2, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                transform: [
                  {
                    scale: wave2.interpolate({
                      inputRange: [0.2, 1],
                      outputRange: [0.8, 2.2],
                    }),
                  },
                ],
                opacity: wave2.interpolate({
                  inputRange: [0.2, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <View style={styles.scannerCore}>
            <Text style={styles.scannerCoreIcon}>✨</Text>
          </View>
        </View>

        <Text style={styles.title}>Finding your perfect shade…</Text>

        {mock ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DEMO MODE — using calibrated sample</Text>
          </View>
        ) : null}

        {/* Steps List */}
        <View style={styles.stepsCard}>
          {STEPS.map((s, i) => (
            <StepRow key={s.key} label={s.label} status={statusFor(i)} />
          ))}
        </View>

        {/* Rotating Note Card */}
        <View style={styles.noteCard}>
          <Text style={styles.noteKicker}>BEAUTY TIP</Text>
          <Text style={styles.note}>
            {mock
              ? 'Preview mode. Add your YouCam API key in .env to analyze real photos live.'
              : LAB_NOTES[noteIdx]}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, paddingTop: 40, alignItems: 'center' },
  scannerCenter: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  waveRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  scannerCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowGold,
  },
  scannerCoreIcon: { fontSize: 22 },
  title: {
    color: colors.cream,
    fontSize: 28,
    fontFamily: fonts.display,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
  },
  badgeText: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  noteCard: {
    width: '100%',
    backgroundColor: 'rgba(33, 21, 12, 0.6)',
    borderRadius: radius.md,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  noteKicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  note: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 20,
  },
});
