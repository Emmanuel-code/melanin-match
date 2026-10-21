import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepRow, { StepStatus } from '../components/StepRow';
import { colors, radius } from '../lib/theme';
import { setLastPhotoUri, setLastResult } from '../lib/session';
import {
  isMockMode,
  PipelineResult,
  PipelineStep,
  runPipeline,
  setMockOverride,
} from '../lib/youcam';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'upload', label: 'Uploading photo' },
  { key: 'skinTone', label: 'Reading skin tone' },
  { key: 'skinAnalysis', label: 'Skin analysis' },
  { key: 'match', label: 'Matching your shade' },
  { key: 'tryOn', label: 'Trying it on' },
];

// Rotating lab notes while the calls run — the wait should teach, not stall.
const LAB_NOTES = [
  'Reading your undertone — warm, neutral, or cool…',
  'Filtering out white-cast and flash reflection…',
  'Checking 78 shade formulas across 9 brands…',
  'Depth is measured in CIELAB — the colour space the labs use…',
  'A true match disappears at your jawline…',
];

export default function AnalyzingScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [noteIdx, setNoteIdx] = useState(0);
  const started = useRef(false);
  const mock = isMockMode();

  useEffect(() => {
    const t = setInterval(() => setNoteIdx((i) => (i + 1) % LAB_NOTES.length), 3200);
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
      if (idx >= 0) setActiveIndex(idx);
    };

    // Demo-day escape hatch: if the live run fails (venue Wi-Fi, a rejected
    // photo), one tap re-runs in demo mode so the story never dead-ends.
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
        // Surface the raw API error in the console for live-demo diagnosis;
        // the alert below carries the same message for the user.
        console.error('[PeachMatch] live pipeline failed:', e);
        const msg = e instanceof Error ? e.message : 'Analysis failed';
        Alert.alert(
          'Hmm, that didn’t work',
          `${msg}\n\nTry again with a clearer photo — or see a demo result right now.`,
          [
            { text: 'Back', style: 'cancel', onPress: () => router.replace('/capture') },
            { text: 'Demo result instead', onPress: () => void runDemoFallback() },
          ],
        );
      }
    })();
  }, [uri]);

  const statusFor = (i: number): StepStatus =>
    finished || i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Finding your shade…</Text>
        {mock ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DEMO MODE — no API key set</Text>
          </View>
        ) : null}
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <StepRow key={s.key} label={s.label} status={statusFor(i)} />
          ))}
        </View>
        <Text style={styles.note}>
          {mock
            ? 'Running on demo data. Add your YouCam API key to analyze real photos.'
            : LAB_NOTES[noteIdx]}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, padding: 24, paddingTop: 64 },
  title: { color: colors.cream, fontSize: 28, fontWeight: '800' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
  },
  badgeText: { color: colors.goldSoft, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  steps: { marginTop: 28 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 32 },
});
