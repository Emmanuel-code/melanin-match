import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  PanResponder,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoachTip from '../components/CoachTip';
import FadeIn from '../components/FadeIn';
import ScoreBar from '../components/ScoreBar';
import ShadeCard from '../components/ShadeCard';
import { analyzeUndertone, explainMatch, findConcealerShade, MatchedShade } from '../lib/match';
import { lipPairingsFor } from '../lib/pairings';
import { savePassport } from '../lib/passport';
import { SHADES } from '../lib/shades';
import { getLastPhotoUri, getLastResult, recordMatchFeedback } from '../lib/session';
import { JUMIA_TRACKING, STORE_NAME } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { FITZPATRICK_LABELS, isMockMode, SkinScores, tryOnShade } from '../lib/youcam';

const STORES = [
  { name: 'Jumia Ghana', detail: 'Online — delivers nationwide (jumia.com.gh)' },
  { name: 'The Body Shop', detail: 'Accra Mall, Spintex Road' },
  { name: 'Makola Market beauty stalls', detail: 'Ask for the shade by name or number' },
];

type TabKey = 'match' | 'skin' | 'buy';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'match', label: 'Try-On & Match' },
  { key: 'skin', label: 'Skin Health' },
  { key: 'buy', label: 'Where to Buy' },
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
  // The photo the user actually picked, byte-exact from the session. Route
  // params can corrupt %-escaped content:// gallery URIs — when that
  // happened, the "before" image silently failed and showed flat colour.
  const displayUri = getLastPhotoUri() ?? originalUri;
  const fileId = params.fileId ?? '';
  const matches = useMemo(
    () => parse<MatchedShade[]>(params.matches, []),
    [params.matches],
  );
  const scores = useMemo(
    () =>
      params.scores
        ? parse<SkinScores>(params.scores, {
            acne: 0,
            oiliness: 0,
            moisture: 0,
            radiance: 0,
            pore: 0,
            wrinkle: 0,
            firmness: 0,
            overall: 0,
            skinAge: 0,
          })
        : null,
    [params.scores],
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [tab, setTab] = useState<TabKey>('match');
  const [slider, setSlider] = useState(0.5);
  const [photoW, setPhotoW] = useState(0);
  const photoWRef = useRef(0);
  const userTouchedSlider = useRef(false);
  /* eslint-disable react-hooks/refs -- PanResponder.create is a one-time
     factory; the refs it closes over are read only inside gesture
     callbacks, never during render. */
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // Claim moves only when they're mostly horizontal — vertical swipes
      // belong to the page scroll, not the comparison slider.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        userTouchedSlider.current = true;
        const w = photoWRef.current;
        if (w > 0) setSlider(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
      },
      onPanResponderMove: (e) => {
        userTouchedSlider.current = true;
        const w = photoWRef.current;
        if (w > 0) setSlider(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
      },
    }),
  );
  /* eslint-enable react-hooks/refs */
  // The signed try-on URL comes from the in-memory session (set by the
  // analyzing screen) — route params are only a fallback; long signed URLs
  // can be mangled by navigation serialization.
  const sessionTryOnUrl = getLastResult()?.tryOnUrl;
  const [tryOnUrl, setTryOnUrl] = useState(
    () => sessionTryOnUrl ?? params.tryOnUrl ?? originalUri,
  );
  const [tryOnBroken, setTryOnBroken] = useState(false);
  const [beforeBroken, setBeforeBroken] = useState(false);
  const [tryingOn, setTryingOn] = useState(false);

  // Intro sweep: when the results land, wipe the comparison open and closed
  // once so the transformation reveals itself — the thumb's hint that it
  // drags. Stops the moment the user drags.
  useEffect(() => {
    const v = new Animated.Value(0.5);
    const sub = v.addListener(({ value }) => {
      if (!userTouchedSlider.current) setSlider(value);
    });
    const anim = Animated.sequence([
      Animated.delay(500),
      Animated.timing(v, { toValue: 0.94, duration: 750, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0.06, duration: 1150, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0.5, duration: 650, useNativeDriver: false }),
    ]);
    anim.start();
    return () => {
      v.removeListener(sub);
      anim.stop();
    };
  }, []);
  const mock = isMockMode();

  const current = matches[selectedIdx] ?? matches[0];
  const fitzLabel = FITZPATRICK_LABELS[params.fitzpatrick ?? ''] ?? params.fitzpatrick ?? '';
  const skinHex = params.skinHex ?? '';
  const faceQuality = Number(params.faceQuality ?? '100');
  const undertone = useMemo(
    () => (skinHex ? analyzeUndertone(skinHex) : null),
    [skinHex],
  );
  const explanation = useMemo(
    () => (skinHex && current ? explainMatch(skinHex, current) : null),
    [skinHex, current],
  );
  const concealer = useMemo(
    () => (skinHex ? findConcealerShade(skinHex) : null),
    [skinHex],
  );
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  // Shade Passport: keep the top match on-device for the home screen.
  useEffect(() => {
    const top = matches[0];
    if (!top) return;
    savePassport({
      skinHex,
      fitzpatrickLabel: fitzLabel,
      undertoneLabel: undertone?.label ?? '',
      brand: top.brand,
      line: top.line,
      shadeName: top.name,
      shadeHex: top.hex,
      matchPercent: top.matchPercent,
      concealerLabel: concealer ? `${concealer.brand} ${concealer.name}` : undefined,
      savedAt: new Date().toISOString(),
    });
    // once per results view — the passport tracks the top match
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!displayUri || matches.length === 0 || !current) {
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

  const giveFeedback = (good: boolean) => {
    recordMatchFeedback(good);
    setFeedback(good ? 'yes' : 'no');
  };

  const searchShade = (engine: 'jumia' | 'google') => {
    const q = encodeURIComponent(`${current.brand} ${current.line} foundation shade ${current.name}`);
    const url =
      engine === 'jumia'
        ? `https://www.jumia.com.gh/catalog/?q=${q}&${JUMIA_TRACKING}`
        : `https://www.google.com/search?q=${q}+buy`;
    Linking.openURL(url).catch(() => {});
  };

  const selectShade = async (idx: number) => {
    if (idx === selectedIdx || tryingOn) return;
    setSelectedIdx(idx);
    setTryingOn(true);
    setTryOnBroken(false);
    try {
      const url = await tryOnShade(fileId, matches[idx].hex, displayUri);
      setTryOnUrl(url);
    } catch (e) {
      console.error('[PeachMatch] shade re-render failed:', e);
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
        <FadeIn>
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
        </FadeIn>

        {!mock && faceQuality < 60 ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>Lighting wasn’t ideal</Text>
            <Text style={styles.warnText}>
              The photo quality scored {faceQuality}/100 — your match may be off. Retake facing a
              window, no flash, for a sharper result.
            </Text>
          </View>
        ) : null}

        {/* HERO — the before/after try-on is the showcase, not a mid-page card */}
        <View style={styles.heroShadow}>
          <View
            style={styles.photoWrap}
            onLayout={(e) => {
              photoWRef.current = e.nativeEvent.layout.width;
              setPhotoW(e.nativeEvent.layout.width);
            }}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: displayUri }}
              style={styles.photo}
              onError={() => setBeforeBroken(true)}
            />
            <View style={[styles.afterClip, { width: `${slider * 100}%` }]}>
              <Image
                source={{ uri: tryOnUrl }}
                style={[styles.photo, { width: photoW || undefined }]}
                onError={() => setTryOnBroken(true)}
              />
            </View>
            <View style={[styles.sliderLine, { left: `${slider * 100}%` }]} pointerEvents="none" />
            <View style={[styles.sliderHandle, { left: `${slider * 100}%` }]} pointerEvents="none">
              <Text style={styles.sliderHandleText}>‹›</Text>
            </View>
            <View style={styles.sliderTagL} pointerEvents="none">
              <View style={styles.tagDotGold} />
              <Text style={styles.sliderTagText}>Matched Shade</Text>
            </View>
            <View style={styles.sliderTagR} pointerEvents="none">
              <View style={styles.tagDotNeutral} />
              <Text style={styles.sliderTagText}>Bare Skin</Text>
            </View>
            {tryingOn ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.gold} />
              </View>
            ) : null}
            {tryOnBroken && !tryingOn ? (
              <View style={styles.loadingOverlay}>
                <Text style={styles.warnText}>
                  The try-on preview couldn’t load — your match below is still exact.
                </Text>
              </View>
            ) : null}
            {beforeBroken ? (
              <View
                style={[styles.beforeNote, { width: `${(1 - slider) * 100}%` }]}
                pointerEvents="none"
              >
                <Text style={styles.warnText}>
                  Your original photo couldn’t be displayed here — the other side is your real
                  try-on render.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.mockNote}>
          Bare skin on one side, your shade on you on the other — drag the gold handle.
        </Text>
        {mock ? (
          <Text style={styles.mockNote}>
            Demo mode — with a YouCam API key this shows the real virtual try-on.
          </Text>
        ) : null}
        <Text style={styles.mockNote}>
          Blend check: when you buy it, stripe the shade at your jawline — the right one
          disappears into your neck.
        </Text>

        {/* iOS-style segmented control */}
        <View style={styles.segment}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.segBtn, tab === t.key && styles.segBtnActive]}
              activeOpacity={0.85}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.segText, tab === t.key && styles.segTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'match' ? (
          <>
            {matches[0].matchPercent < 75 ? (
              <View style={styles.warnCard}>
                <Text style={styles.warnTitle}>No perfect match in our catalog</Text>
                <Text style={styles.warnText}>
                  Our {SHADES.length} shades didn’t nail it this time — these are the closest we
                  found. We’re adding brands every week; check back soon.
                </Text>
              </View>
            ) : null}

            <FadeIn delay={60}>
              <View style={styles.matchRow}>
                <View style={styles.ring}>
                  <Text style={styles.ringPct}>{current.matchPercent}%</Text>
                  <Text style={styles.ringCap}>MATCH</Text>
                </View>
                <View style={styles.matchCardWrap}>
                  <ShadeCard shade={current} large />
                </View>
              </View>
            </FadeIn>

            {explanation && undertone ? (
              <FadeIn delay={120}>
                <View style={[styles.card, styles.cardSpaced]}>
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
                    Match score blends CIELAB depth closeness (ΔE) with undertone alignment — the
                    same color space the cosmetics labs use.
                  </Text>
                </View>
              </FadeIn>
            ) : null}

            {concealer ? (
              <FadeIn delay={180}>
                <View style={[styles.card, styles.cardSpaced]}>
                  <Text style={styles.cardTitle}>Complete the base</Text>
                  <View style={styles.lipRow}>
                    <View style={[styles.lipSwatch, { backgroundColor: concealer.hex }]} />
                    <View style={styles.lipText}>
                      <Text style={styles.lipName}>
                        Concealer: {concealer.brand} {concealer.name}
                      </Text>
                      <Text style={styles.lipNote}>
                        Makeup-artist rule: same family, a few steps lighter to brighten — this is
                        the closest in our catalog.
                      </Text>
                    </View>
                  </View>
                </View>
              </FadeIn>
            ) : null}

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
          </>
        ) : null}

        {tab === 'skin' ? (
          <>
            <Text style={styles.sectionTitle}>Your skin, by the numbers</Text>
            <View style={styles.card}>
              {fitzLabel ? (
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Fitzpatrick</Text>
                  <Text style={styles.sumValue}>{fitzLabel}</Text>
                </View>
              ) : null}
              {undertone ? (
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Undertone</Text>
                  <Text style={styles.sumValue}>{undertone.label}</Text>
                </View>
              ) : null}
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Photo quality</Text>
                <Text style={styles.sumValue}>{faceQuality}/100</Text>
              </View>
            </View>

            {scores ? (
              <View style={[styles.card, styles.cardSpaced]}>
                {scores.overall ? (
                  <View style={styles.scoreHead}>
                    <View>
                      <Text style={styles.scoreBig}>{scores.overall}</Text>
                      <Text style={styles.scoreCap}>Overall skin score / 100</Text>
                    </View>
                    {scores.skinAge ? (
                      <View style={styles.ageChip}>
                        <Text style={styles.ageChipText}>Skin age {scores.skinAge}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
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
                  hint="How balanced your skin’s oil is."
                />
                <ScoreBar label="Pore clarity" value={scores.pore} />
                <ScoreBar
                  label="Smoothness"
                  value={scores.wrinkle}
                  hint="Higher means fewer visible lines."
                />
                <ScoreBar label="Firmness" value={scores.firmness} />
                <Text style={styles.fine}>Estimates from AI analysis, not medical advice.</Text>
                <Text style={styles.fine}>
                  Skin tone can shift up to 4 shades across the year — re-scan each season to keep
                  your match true.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, styles.cardSpaced]}>
                <Text style={styles.cardTitle}>Skin scores unavailable for this photo</Text>
                <Text style={styles.storeDetail}>
                  The detailed analysis needs your face to fill more of the frame. Your shade
                  match is unaffected — retake closer, facing a window, to unlock the full report.
                </Text>
              </View>
            )}

            {undertone ? (
              <>
                <Text style={styles.sectionTitle}>
                  Pairs with your {undertone.label.toLowerCase()} undertone
                </Text>
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
          </>
        ) : null}

        {tab === 'buy' ? (
          <>
            <Text style={styles.sectionTitle}>Your Shade Passport</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✓ Saved to your Shade Passport</Text>
              <View style={styles.passportRow}>
                <View style={[styles.passportSwatch, { backgroundColor: matches[0].hex }]} />
                <View style={styles.lipText}>
                  <Text style={styles.lipName}>
                    {matches[0].brand} {matches[0].line} — {matches[0].name}
                  </Text>
                  <Text style={styles.lipNote}>
                    {matches[0].matchPercent}% match · kept on this device · find it on your home
                    screen anytime
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Get this shade</Text>
            <View style={styles.card}>
              <Text style={styles.storeName}>{STORE_NAME} — our own store</Text>
              <Text style={styles.storeDetail}>
                Coming soon: order your exact shade directly from us, right inside Peach Match —
                matched, tried on, and delivered by the same people who built your matcher. Until
                we open, find your shade below.
              </Text>
              <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/store')}>
                <Text style={styles.storeLink}>Peek at what’s coming →</Text>
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
          </>
        ) : null}

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.linkText}>← Start over</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky bottom dock — the shade + share, always within thumb reach */}
      <View style={styles.dock}>
        <View style={[styles.dockSwatch, { backgroundColor: current.hex }]} />
        <View style={styles.dockText}>
          <Text style={styles.dockName} numberOfLines={1}>
            {current.name}
          </Text>
          <Text style={styles.dockBrand} numberOfLines={1}>
            {current.brand} · {current.line}
          </Text>
        </View>
        <TouchableOpacity style={styles.dockBtn} activeOpacity={0.85} onPress={shareResult}>
          <Text style={styles.dockBtnText}>Share Passport</Text>
        </TouchableOpacity>
      </View>

      <CoachTip
        tourKey="results"
        steps={[
          {
            title: 'Drag the slider',
            body: 'On your photo, drag the gold handle to compare bare skin against your shade. Tapping a shade under "Also close" re-renders the try-on.',
          },
          {
            title: 'Your match — and why',
            body: 'The ring is your match score. "Why this match" shows the working: depth closeness plus undertone alignment — the two things shops never tell you.',
          },
          {
            title: 'Three tabs, one dock',
            body: 'Skin Health holds your full report; Where to Buy starts with your Shade Passport. The dock at the bottom shares your passport anytime.',
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 32, paddingBottom: 32 },
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
  heroShadow: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  photoWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
  },
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  afterClip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: colors.gold,
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: -19,
    marginTop: -19,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: '#1a120b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHandleText: { color: '#1a120b', fontSize: 15, fontWeight: '800' },
  sliderTagL: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,18,11,0.75)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sliderTagR: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,18,11,0.75)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagDotGold: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  tagDotNeutral: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d8cfc0' },
  sliderTagText: { color: colors.cream, fontSize: 11, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,18,11,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beforeNote: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  mockNote: { color: colors.muted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
    marginTop: 20,
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.gold },
  segText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  segTextActive: { color: '#1a120b' },
  sectionTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 12,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: { color: colors.cream, fontSize: 22, fontWeight: '800' },
  ringCap: { color: colors.goldSoft, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  matchCardWrap: { flex: 1 },
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
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  sumLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  sumValue: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  scoreHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreBig: { color: colors.gold, fontSize: 40, fontWeight: '800', lineHeight: 42 },
  scoreCap: { color: colors.muted, fontSize: 12, marginTop: 2 },
  ageChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ageChipText: { color: colors.goldSoft, fontSize: 13, fontWeight: '700' },
  passportRow: { flexDirection: 'row', alignItems: 'center' },
  passportSwatch: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  store: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceLight },
  storeName: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  storeDetail: { color: colors.muted, fontSize: 13, marginTop: 2, lineHeight: 19 },
  storeLink: { color: colors.goldSoft, fontSize: 14, fontWeight: '700', marginTop: 14 },
  divider: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 2,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaText: { color: '#1a120b', fontSize: 16, fontWeight: '800' },
  linkBtn: { alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  linkText: { color: colors.goldSoft, fontSize: 15, fontWeight: '600' },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(37, 26, 15, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 162, 78, 0.25)',
  },
  dockSwatch: { width: 40, height: 40, borderRadius: 20 },
  dockText: { flex: 1 },
  dockName: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  dockBrand: { color: colors.muted, fontSize: 12, marginTop: 1 },
  dockBtn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dockBtnText: { color: '#1a120b', fontSize: 14, fontWeight: '800' },
});
