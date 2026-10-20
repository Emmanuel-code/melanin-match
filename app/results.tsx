import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScoreBar from '../components/ScoreBar';
import ShadeCard from '../components/ShadeCard';
import { analyzeUndertone, explainMatch, findConcealerShade, MatchedShade } from '../lib/match';
import { lipPairingsFor } from '../lib/pairings';
import { SHADES } from '../lib/shades';
import { STORE_NAME } from '../lib/store';
import { recordMatchFeedback } from '../lib/session';
import { colors, radius } from '../lib/theme';
import { FITZPATRICK_LABELS, isMockMode, SkinScores, tryOnShade } from '../lib/youcam';

const STORES = [
  { name: 'Jumia Ghana', detail: 'Online — delivers nationwide (jumia.com.gh)' },
  { name: 'The Body Shop', detail: 'Accra Mall, Spintex Road' },
  { name: 'Makola Market beauty stalls', detail: 'Ask for the shade by name or number' },
];

function parse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    originalUri?: string;
    fileId?: string;
    skinHex?: string;
    faceQuality?: string;
    fitzpatrick?: string;
    scores?: string;
    matches?: string;
    tryOnUrl?: string;
  }>();

  const originalUri = params.originalUri ?? '';
  const fileId = params.fileId ?? '';
  const matches = useMemo(
    () => parse<MatchedShade[]>(params.matches, []),
    [params.matches],
  );
  const scores = useMemo(
    () => parse<SkinScores>(params.scores, { acne: 0, oiliness: 0, moisture: 0, radiance: 0 }),
    [params.scores],
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [view, setView] = useState<'before' | 'after'>('after');
  const [tryOnUrl, setTryOnUrl] = useState(params.tryOnUrl ?? originalUri);
  const [tryingOn, setTryingOn] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const mock = isMockMode();

  if (!originalUri || matches.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.title}>No results yet</Text>
          <Text style={styles.sub}>Run the shade finder first.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.replace('/')}>
            <Text style={styles.ctaText}>Start over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const current = matches[selectedIdx];
  const fitzLabel = FITZPATRICK_LABELS[params.fitzpatrick ?? ''] ?? params.fitzpatrick ?? '';
  const skinHex = params.skinHex ?? '';
  const faceQuality = Number(params.faceQuality ?? '100');
  const undertone = useMemo(
    () => (skinHex ? analyzeUndertone(skinHex) : null),
    [skinHex],
  );
  const explanation = useMemo(
    () => (skinHex ? explainMatch(skinHex, current) : null),
    [skinHex, current],
  );
  const concealer = useMemo(
    () => (skinHex ? findConcealerShade(skinHex) : null),
    [skinHex],
  );
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const giveFeedback = (good: boolean) => {
    recordMatchFeedback(good);
    setFeedback(good ? 'yes' : 'no');
  };

  const searchShade = (engine: 'jumia' | 'google') => {
    const q = encodeURIComponent(`${current.brand} ${current.line} foundation shade ${current.name}`);
    const url =
      engine === 'jumia'
        ? `https://www.jumia.com.gh/catalog/?q=${q}`
        : `https://www.google.com/search?q=${q}+buy`;
    Linking.openURL(url).catch(() => {});
  };

  const selectShade = async (idx: number) => {
    if (idx === selectedIdx || tryingOn) return;
    setSelectedIdx(idx);
    setTryingOn(true);
    try {
      const url = await tryOnShade(fileId, matches[idx].hex, originalUri);
      setTryOnUrl(url);
      setView('after');
    } catch {
      // keep the previous try-on image; the shade card still updates
    } finally {
      setTryingOn(false);
    }
  };

  const shareResult = async () => {
    const msg =
      `My Peach Match result: ${current.brand} ${current.line} — shade ${current.name} ` +
      `(${current.matchPercent}% match). Fitzpatrick ${params.fitzpatrick}. ` +
      `Foundation shades matched to YOUR skin.`;
    try {
      await Share.share({ message: msg });
    } catch {
      // user dismissed — nothing to do
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your match</Text>
        <View style={styles.badgeRow}>
          {fitzLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{fitzLabel}</Text>
            </View>
          ) : null}
          {undertone ? (
            <View style={[styles.badge, styles.badgeGold]}>
              <Text style={styles.badgeText}>{undertone.label} undertone</Text>
            </View>
          ) : null}
        </View>

        {!mock && faceQuality < 60 ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>Lighting wasn't ideal</Text>
            <Text style={styles.warnText}>
              The photo quality scored {faceQuality}/100 — your match may be off. Retake facing a
              window, no flash, for a sharper result.
            </Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <ShadeCard shade={current} large />
          <Text style={styles.best}>Best match · {current.matchPercent}%</Text>
        </View>

        {matches[0].matchPercent < 75 ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>No perfect match in our catalog</Text>
            <Text style={styles.warnText}>
              Our {SHADES.length} shades didn't nail it this time — these are the closest we
              found. We're adding brands every week; check back soon.
            </Text>
          </View>
        ) : null}

        {explanation && undertone ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Why this match</Text>
            <View style={styles.whyRow}>
              <Text style={styles.whyLabel}>Depth</Text>
              <View style={styles.whyBar}>
                <View style={[styles.whyFill, { width: `${explanation.depthScore}%` }]} />
              </View>
              <Text style={styles.whyValue}>{explanation.depthScore}%</Text>
            </View>
            <View style={styles.whyRow}>
              <Text style={styles.whyLabel}>Undertone</Text>
              <Text style={styles.whyValue}>
                {explanation.undertoneAligned ? '✓' : '≈'} {explanation.undertonePair}
                {undertone ? ` · hue ${undertone.hueAngle}°` : ''}
              </Text>
            </View>
            <Text style={styles.fine}>{undertone.tip}</Text>
            <Text style={styles.fine}>
              Match score blends CIELAB depth closeness (ΔE) with undertone alignment — the same
              color space the cosmetics labs use.
            </Text>
          </View>
        ) : null}

        {concealer ? (
          <View style={[styles.card, styles.cardSpaced]}>
            <Text style={styles.cardTitle}>Complete the base</Text>
            <View style={styles.lipRow}>
              <View style={[styles.lipSwatch, { backgroundColor: concealer.hex }]} />
              <View style={styles.lipText}>
                <Text style={styles.lipName}>
                  Concealer: {concealer.brand} {concealer.name}
                </Text>
                <Text style={styles.lipNote}>
                  Makeup-artist rule: same family, a few steps lighter to brighten — this is the
                  closest in our catalog.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Alternate shades */}
        <Text style={styles.sectionTitle}>Also close</Text>
        <View style={styles.chips}>
          {matches.map((m, i) => (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, i === selectedIdx && styles.chipSelected]}
              activeOpacity={0.8}
              onPress={() => selectShade(i)}
            >
              <View style={[styles.chipSwatch, { backgroundColor: m.hex }]} />
              <Text style={styles.chipText}>
                {m.brand} {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Before / after */}
        <Text style={styles.sectionTitle}>See it on you</Text>
        <View style={styles.toggle}>
          {(['before', 'after'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setView(v)}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
                {v === 'before' ? 'Before' : 'Try-on'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.photoWrap}>
          <Image
            source={{ uri: view === 'before' ? originalUri : tryOnUrl }}
            style={styles.photo}
          />
          {tryingOn ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : null}
        </View>
        {mock ? (
          <Text style={styles.mockNote}>
            Demo mode — with a YouCam API key this shows the real virtual try-on.
          </Text>
        ) : null}
        <Text style={styles.mockNote}>
          Blend check: when you buy it, stripe the shade at your jawline — the right one
          disappears into your neck.
        </Text>

        {/* Match feedback — the start of our validation loop */}
        <View style={[styles.card, styles.cardSpaced]}>
          {feedback === null ? (
            <>
              <Text style={styles.cardTitle}>Was this your shade?</Text>
              <View style={styles.feedbackRow}>
                <TouchableOpacity
                  style={[styles.feedbackBtn, styles.feedbackYes]}
                  activeOpacity={0.85}
                  onPress={() => giveFeedback(true)}
                >
                  <Text style={styles.feedbackYesText}>Yes, that’s me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackBtn, styles.feedbackNo]}
                  activeOpacity={0.85}
                  onPress={() => giveFeedback(false)}
                >
                  <Text style={styles.feedbackNoText}>Not quite</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.feedbackThanks}>
              {feedback === 'yes'
                ? 'Love it. That confirmation makes the next match smarter.'
                : 'Noted — honest misses are how this gets better. Try an alternate shade above.'}
            </Text>
          )}
        </View>

        {/* Skin scores */}
        <Text style={styles.sectionTitle}>Your skin, by the numbers</Text>
        <View style={styles.card}>
          <ScoreBar label="Radiance" value={scores.radiance} />
          <ScoreBar label="Moisture" value={scores.moisture} />
          <ScoreBar
            label="Clarity"
            value={scores.acne}
            hint="Higher means fewer visible blemishes."
          />
          <ScoreBar
            label="Oil balance"
            value={100 - scores.oiliness}
            hint="How balanced your skin's oil is."
          />
          <Text style={styles.fine}>Estimates from AI analysis, not medical advice.</Text>
          <Text style={styles.fine}>
            Skin tone can shift up to 4 shades across the year — re-scan each season to keep your
            match true.
          </Text>
        </View>

        {/* Lip pairings */}
        {undertone ? (
          <>
            <Text style={styles.sectionTitle}>Pairs with your {undertone.label.toLowerCase()} undertone</Text>
            <View style={styles.card}>
              {lipPairingsFor(undertone.undertone).map((lip) => (
                <View key={lip.name} style={styles.lipRow}>
                  <View style={[styles.lipSwatch, { backgroundColor: lip.hex }]} />
                  <View style={styles.lipText}>
                    <Text style={styles.lipName}>
                      {lip.brand} — {lip.name}
                    </Text>
                    <Text style={styles.lipNote}>{lip.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Buy — our own store first, marketplaces as the fallback */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => setShowStores((s) => !s)}
        >
          <Text style={styles.ctaText}>{showStores ? 'Hide buying options' : 'Buy my shade'}</Text>
        </TouchableOpacity>
        {showStores ? (
          <View style={styles.card}>
            <Text style={styles.storeName}>{STORE_NAME} — our own store</Text>
            <Text style={styles.storeDetail}>
              Coming soon: order your exact shade directly from us, right inside Peach Match —
              matched, tried on, and delivered by the same people who built your matcher. Until
              we open, find your shade below.
            </Text>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/store')}>
              <Text style={styles.storeLink}>Peek at what's coming →</Text>
            </TouchableOpacity>

            <Text style={styles.divider}>Find your shade now</Text>
            <TouchableOpacity style={styles.store} onPress={() => searchShade('jumia')}>
              <Text style={styles.storeName}>Search this shade on Jumia Ghana →</Text>
              <Text style={styles.storeDetail}>
                {current.brand} {current.line} — shade {current.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.store} onPress={() => searchShade('google')}>
              <Text style={styles.storeName}>Search this shade on Google →</Text>
              <Text style={styles.storeDetail}>Compare prices across sellers</Text>
            </TouchableOpacity>
            {STORES.slice(1).map((s) => (
              <View key={s.name} style={styles.store}>
                <Text style={styles.storeName}>{s.name}</Text>
                <Text style={styles.storeDetail}>{s.detail}</Text>
              </View>
            ))}
            <Text style={styles.fine}>Physical store locations are demo data.</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.cta, styles.ctaGhost]}
          activeOpacity={0.85}
          onPress={shareResult}
        >
          <Text style={styles.ctaGhostText}>Share my result</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.linkText}>← Start over</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: colors.cream, fontSize: 32, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 15, marginTop: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeGold: { backgroundColor: '#3a2c14' },
  badgeText: { color: colors.goldSoft, fontSize: 13, fontWeight: '700' },
  warnCard: {
    backgroundColor: '#3a2413',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#7a5a2a',
  },
  warnTitle: { color: '#f0c46c', fontSize: 14, fontWeight: '800' },
  warnText: { color: colors.cream, fontSize: 13, lineHeight: 19, marginTop: 4 },
  hero: { marginTop: 20 },
  best: { color: colors.goldSoft, fontSize: 14, fontWeight: '700', marginTop: 10 },
  sectionTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: colors.gold },
  chipSwatch: { width: 22, height: 22, borderRadius: 11, marginRight: 8 },
  chipText: { color: colors.cream, fontSize: 13, fontWeight: '600' },
  toggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.gold },
  toggleText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  toggleTextActive: { color: '#1a120b' },
  photoWrap: { marginTop: 12, borderRadius: radius.lg, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,18,11,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockNote: { color: colors.muted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  cardSpaced: { marginTop: 16 },
  cardTitle: { color: colors.cream, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  whyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  whyLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', width: 76 },
  whyBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    marginRight: 10,
  },
  whyFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  whyValue: { color: colors.cream, fontSize: 13, fontWeight: '700' },
  fine: { color: colors.goldDim, fontSize: 11, marginTop: 10 },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaText: { color: '#1a120b', fontSize: 16, fontWeight: '800' },
  ctaGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.goldDim },
  ctaGhostText: { color: colors.goldSoft, fontSize: 16, fontWeight: '700' },
  store: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceLight },
  lipRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  lipSwatch: { width: 30, height: 30, borderRadius: 15, marginRight: 12 },
  lipText: { flex: 1 },
  lipName: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  lipNote: { color: colors.muted, fontSize: 12, marginTop: 1 },
  feedbackRow: { flexDirection: 'row', gap: 10 },
  feedbackBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  feedbackYes: { backgroundColor: colors.gold },
  feedbackYesText: { color: '#1a120b', fontSize: 14, fontWeight: '800' },
  feedbackNo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.goldDim },
  feedbackNoText: { color: colors.goldSoft, fontSize: 14, fontWeight: '700' },
  feedbackThanks: { color: colors.cream, fontSize: 14, lineHeight: 20 },
  storeName: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  storeDetail: { color: colors.muted, fontSize: 13, marginTop: 2 },
  storeLink: { color: colors.goldSoft, fontSize: 14, fontWeight: '700', marginTop: 14 },
  divider: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 2,
  },
  linkBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  linkText: { color: colors.goldSoft, fontSize: 15, fontWeight: '600' },
});
