import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StepRow, { StepStatus } from '../components/StepRow';
import { colors, radius } from '../lib/theme';
import { isMockMode, PipelineStep, runPipeline } from '../lib/youcam';

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: 'upload', label: 'Uploading photo' },
  { key: 'skinTone', label: 'Reading skin tone' },
  { key: 'skinAnalysis', label: 'Skin analysis' },
  { key: 'match', label: 'Matching your shade' },
  { key: 'tryOn', label: 'Trying it on' },
];

export default function AnalyzingScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const started = useRef(false);
  const mock = isMockMode();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!uri) {
      Alert.alert('No photo', 'Something went wrong — please take your photo again.');
      router.replace('/capture');
      return;
    }
    (async () => {
      try {
        const result = await runPipeline(uri, (step) => {
          const idx = STEPS.findIndex((s) => s.key === step);
          if (idx >= 0) setActiveIndex(idx);
        });
        setFinished(true);
        router.replace({
          pathname: '/results',
          params: {
            originalUri: uri,
            fileId: result.fileId,
            skinHex: result.skinColorHex,
            faceQuality: String(result.faceQuality),
            fitzpatrick: result.fitzpatrick,
            scores: JSON.stringify(result.scores),
            matches: JSON.stringify(result.matches),
            tryOnUrl: result.tryOnUrl,
          },
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Analysis failed';
        Alert.alert('Hmm, that didn’t work', `${msg}\n\nPlease try again with a clearer photo.`, [
          { text: 'Back', onPress: () => router.replace('/capture') },
        ]);
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
            : 'YouCam AI is reading your skin tone and trying on your match.'}
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
