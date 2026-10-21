import { BlurView } from 'expo-blur';
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
import MatchGauge from '../components/MatchGauge';
import ScoreBar from '../components/ScoreBar';
import ShadeCard from '../components/ShadeCard';
import { triggerHaptic } from '../lib/haptics';
import { analyzeUndertone, explainMatch, findConcealerShade, MatchedShade } from '../lib/match';
import { lipPairingsFor } from '../lib/pairings';
import { savePassport } from '../lib/passport';
import { SHADES } from '../lib/shades';
import { getLastPhotoUri, getLastResult, recordMatchFeedback } from '../lib/session';
import { JUMIA_TRACKING, STORE_NAME } from '../lib/store';
import { colors, fonts, radius, shadows } from '../lib/theme';
import { FITZPATRICK_LABELS, isMockMode, SkinScores, tryOnShade } from '../lib/youcam';

const STORES = [
  { name: 'Jumia Ghana', detail: 'Online — delivers nationwide (jumia.com.gh)' },
  { name: 'The Body Shop', detail: 'Accra Mall, Spintex Road' },
  { name: 'Makola Market beauty stalls', detail: 'Ask for the shade by name or number' },
];

type TabKey = 'match' | 'skin' | 'buy';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'match', label: 'My Match' },
  { key: 'skin', label: 'Skin Tips' },
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
  // Prefer in-memory session photo (always the real uploaded image)
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
  const [segmentWidth, setSegmentWidth] = useState(0);
  const tabTranslateX = useRef(new Animated.Value(0)).current;

  const tabIndex = useMemo(() => TABS.findIndex((t) => t.key === tab), [tab]);

  useEffect(() => {
    if (segmentWidth > 0) {
      const tabWidth = (segmentWidth - 8) / TABS.length;
      Animated.spring(tabTranslateX, {
        toValue: tabIndex * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 70,
      }).start();
    }
  }, [tabIndex, segmentWidth]);

  const [slider, setSlider] = useState(0.5);
  const [photoW, setPhotoW] = useState(0);
  const photoWRef = useRef(0);
  const userTouchedSlider = useRef(false);
  const prevMidCrossed = useRef(false);

  // Spring animation for slider thumb scale
  const thumbScale = useRef(new Animated.Value(1)).current;

  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        userTouchedSlider.current = true;
        triggerHaptic.selection();
        Animated.spring(thumbScale, { toValue: 1.22, useNativeDriver: true, friction: 6 }).start();
        const w = photoWRef.current;
        if (w > 0) {
          const pos = Math.min(1, Math.max(0, e.nativeEvent.locationX / w));
          setSlider(pos);
        }
      },
      onPanResponderMove: (e) => {
        userTouchedSlider.current = true;
        const w = photoWRef.current;
        if (w > 0) {
          const pos = Math.min(1, Math.max(0, e.nativeEvent.locationX / w));
          setSlider(pos);

          // Subtle haptic tick when crossing the 50% comparison threshold
          const isMid = pos >= 0.48 && pos <= 0.52;
          if (isMid && !prevMidCrossed.current) {
            triggerHaptic.light();
            prevMidCrossed.current = true;
          } else if (!isMid) {
            prevMidCrossed.current = false;
          }
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(thumbScale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(thumbScale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
      },
    }),
  );

  const sessionTryOnUrl = getLastResult()?.tryOnUrl;
  // The "before" is ALWAYS the uploaded photo â€” never a sample fallback.
  // If displayUri is somehow empty we show a blank placeholder (not the demo image).
  const uploadedPhoto = displayUri || '';
  const [activeBeforeUri] = useState<string>(uploadedPhoto);
  const [tryOnUrl, setTryOnUrl] = useState<string>(
    () => sessionTryOnUrl ?? params.tryOnUrl ?? uploadedPhoto,
  );
  const [tryOnBroken, setTryOnBroken] = useState(false);
  const [tryingOn, setTryingOn] = useState(false);

  // Intro sweep
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

  // Save top match to Shade Passport
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
  }, []);

  if (!displayUri || matches.length === 0 || !current) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.title}>No results yet</Text>
          <Text style={styles.sub}>Find your shade first.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.replace('/')}>
            <Text style={styles.ctaText}>Start over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const giveFeedback = (good: boolean) => {
    triggerHaptic.medium();
    recordMatchFeedback(good);
    setFeedback(good ? 'yes' : 'no');
  };

  const searchShade = (engine: 'jumia' | 'google') => {
    triggerHaptic.light();
    const q = encodeURIComponent(`${current.brand} ${current.line} foundation shade ${current.name}`);
    const url =
      engine === 'jumia'
        ? `https://www.jumia.com.gh/catalog/?q=${q}&${JUMIA_TRACKING}`
        : `https://www.google.com/search?q=${q}+buy`;
    Linking.openURL(url).catch(() => {});
  };

  const selectShade = async (idx: number) => {
    if (idx === selectedIdx || tryingOn) return;
    triggerHaptic.selection();
    setSelectedIdx(idx);
    setTryingOn(true);
    setTryOnBroken(false);
    try {
      const url = await tryOnShade(fileId, matches[idx].hex, displayUri);
      setTryOnUrl(url);
    } catch (e) {
      console.error('[PeachMatch] shade re-render failed:', e);
    } finally {
      setTryingOn(false);
    }
  };

  const shareResult = async () => {
    triggerHaptic.medium();
    const msg =
      `My Peach Match: ${current.brand} ${current.line} â€” shade ${current.name} ` +
      `(${current.matchPercent}% match). Foundation that actually matches deep skin!`;
    try {
      await Share.share({ message: msg });
    } catch {
      // dismiss
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <View style={styles.kickerBadge}>
            <Text style={styles.kicker}>YOUR SHADE MATCH</Text>
          </View>
          <Text style={styles.title}>Your Foundation Match</Text>
          <Text style={styles.subTitleExplain}>
            Real foundation bottles you can buy in stores, matched to your exact skin tone.
          </Text>
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
            <Text style={styles.warnTitle}>Photo lighting tip</Text>
            <Text style={styles.warnText}>
              Your photo had a few shadows. For the most accurate result next time,
              take it facing a window in daylight without flash.
            </Text>
          </View>
        ) : null}

        {/* HERO: Before / After Try-On Canvas */}
        <View style={styles.heroShadow}>
          <View
            style={styles.photoWrap}
            onLayout={(e) => {
              photoWRef.current = e.nativeEvent.layout.width;
              setPhotoW(e.nativeEvent.layout.width);
            }}
            {...panResponder.panHandlers}
          >
            {/* Before: always the original uploaded photo, no fallback */}
            <Image
              source={activeBeforeUri ? { uri: activeBeforeUri } : undefined}
              style={styles.photo}
            />
            <View style={[styles.afterClip, { width: `${slider * 100}%` }]}>
              <Image
                source={{ uri: tryOnUrl }}
                style={[styles.photo, { width: photoW || undefined }]}
                onError={() => {
                  setTryOnBroken(true);
                  if (tryOnUrl !== activeBeforeUri) {
                    setTryOnUrl(activeBeforeUri);
                  }
                }}
              />
            </View>

            {/* Slider Dividing Hairline */}
            <View style={[styles.sliderLine, { left: `${slider * 100}%` }]} pointerEvents="none" />

            {/* Tactile Luxury Slider Handle */}
            <Animated.View
              style={[
                styles.sliderHandle,
                {
                  left: `${slider * 100}%`,
                  transform: [{ scale: thumbScale }],
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.handleArrowsRow}>
                <Text style={styles.handleArrow}>‹</Text>
                <View style={styles.handleGripLine} />
                <View style={styles.handleGripLine} />
                <Text style={styles.handleArrow}>›</Text>
              </View>
            </Animated.View>

            {/* Frosted Glass Tags */}
            <BlurView intensity={65} tint="dark" style={styles.sliderTagL} pointerEvents="none">
              <View style={styles.tagDotGold} />
              <Text style={styles.sliderTagText}>With Foundation</Text>
            </BlurView>
            <BlurView intensity={65} tint="dark" style={styles.sliderTagR} pointerEvents="none">
              <View style={styles.tagDotNeutral} />
              <Text style={styles.sliderTagText}>Your Photo</Text>
            </BlurView>

            {tryingOn ? (
              <BlurView intensity={70} tint="dark" style={styles.loadingOverlay}>
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.gold} />
                  <Text style={styles.loadingText}>Applying {matches[selectedIdx]?.name}...</Text>
                </View>
              </BlurView>
            ) : null}
          </View>
        </View>

        <Text style={styles.mockNote}>
          Drag the gold handle to see how the foundation looks on your face.
        </Text>

        {/* Apple-style Animated Segmented Control */}
        <View
          style={styles.segment}
          onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
        >
          {segmentWidth > 0 ? (
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: (segmentWidth - 8) / TABS.length,
                  transform: [{ translateX: tabTranslateX }],
                },
              ]}
            />
          ) : null}
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.segBtn}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic.selection();
                  setTab(t.key);
                }}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'match' ? (
          <>
            {matches[0].matchPercent < 75 ? (
              <View style={styles.warnCard}>
                <Text style={styles.warnTitle}>Good news — these are the closest shades for you</Text>
                <Text style={styles.warnText}>
                  Our {SHADES.length} shade database didn't find a 90%+ match today — these are the
                  closest formulas we have. We add new shades every week!
                </Text>
              </View>
            ) : null}

            {/* Clear Product Explainer Banner */}
            <FadeIn delay={40}>
              <View style={styles.productBanner}>
                <Text style={styles.productBannerKicker}>RECOMMENDED FOUNDATION BOTTLE</Text>
                <Text style={styles.productBannerSub}>
                  This is the exact brand, line, and shade number to ask for at beauty counters or order online:
                </Text>
              </View>
            </FadeIn>

            {/* Circular Match Gauge + Primary Card */}
            <FadeIn delay={60}>
              <View style={styles.matchRow}>
                <MatchGauge percent={current.matchPercent} />
                <View style={styles.matchCardWrap}>
                  <ShadeCard shade={current} large />
                </View>
              </View>
            </FadeIn>

            {/* Match Percentage Plain English Explainer */}
            <View style={styles.matchScoreExplain}>
              <Text style={styles.matchScoreExplainText}>
                💡 <Text style={{ fontFamily: fonts.bodyBold, color: colors.goldSoft }}>What does {current.matchPercent}% match mean?</Text> It means this bottle's depth and warmth are a {current.matchPercent}% match to your skin. When blended at your jawline, the makeup disappears into your neck without looking grey, ashy, or chalky.
              </Text>
            </View>

            {explanation && undertone ? (
              <FadeIn delay={120}>
                <View style={[styles.card, styles.cardSpaced]}>
                  <Text style={styles.cardTitle}>Why this bottle fits your skin</Text>
                  <View style={styles.whyRow}>
                    <Text style={styles.whyLabel}>Skin depth</Text>
                    <View style={styles.whyBar}>
                      <View style={[styles.whyFill, { width: `${explanation.depthScore}%` }]} />
                    </View>
                    <Text style={styles.whyValue}>{explanation.depthScore}% match</Text>
                  </View>
                  <View style={styles.whyRow}>
                    <Text style={styles.whyLabel}>Skin warmth</Text>
                    <Text style={styles.whyValue}>
                      {explanation.undertoneAligned ? '✓ Perfect match' : '≈ Very close'} ({undertone.label})
                    </Text>
                  </View>
                  <Text style={styles.undertoneTip}>{undertone.tip}</Text>
                  <Text style={styles.fine}>
                    A great foundation matches both your skin depth and its warm/cool undertone — so it blends at your jawline and never looks grey, ashy, or orange.
                  </Text>
                </View>
              </FadeIn>
            ) : null}

            {concealer ? (
              <FadeIn delay={180}>
                <View style={[styles.card, styles.cardSpaced]}>
                  <Text style={styles.cardTitle}>A concealer that goes with it</Text>
                  <View style={styles.lipRow}>
                    <View style={[styles.lipSwatch, { backgroundColor: concealer.hex }]} />
                    <View style={styles.lipText}>
                      <Text style={styles.lipName}>
                        {concealer.brand} — {concealer.name}
                      </Text>
                      <Text style={styles.lipNote}>
                        Pro tip: Pick a concealer 1–2 shades lighter than your foundation to brighten under your eyes without looking chalky.
                      </Text>
                    </View>
                  </View>
                </View>
              </FadeIn>
            ) : null}

            <Text style={styles.sectionTitle}>Other foundation bottles you can buy</Text>
            <Text style={styles.sectionSubtitle}>
              Tap any bottle below to preview how it looks on your face with the slider above:
            </Text>
            <View style={styles.chips}>
              {matches.map((m, i) => {
                const isSelected = i === selectedIdx;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    activeOpacity={0.8}
                    onPress={() => selectShade(i)}
                  >
                    <View style={[styles.chipSwatch, { backgroundColor: m.hex }]} />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {m.brand} · Shade {m.name}
                    </Text>
                    {isSelected ? <Text style={styles.chipCheck}> ✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feedback Interaction Card */}
            <View style={[styles.card, styles.cardSpaced]}>
              {feedback === null ? (
                <>
                  <Text style={styles.cardTitle}>Does this foundation shade look right on you?</Text>
                  <View style={styles.feedbackRow}>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, styles.feedbackYes]}
                      activeOpacity={0.85}
                      onPress={() => giveFeedback(true)}
                    >
                      <Text style={styles.feedbackYesText}>Yes, that's me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, styles.feedbackNo]}
                      activeOpacity={0.85}
                      onPress={() => giveFeedback(false)}
                    >
                      <Text style={styles.feedbackNoText}>Doesn't look right</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.feedbackThanks}>
                  {feedback === 'yes'
                    ? '✨ Great! We saved this shade to your phone so you can check it in-store.'
                    : 'No problem! Tap one of the other shades above to see how they look on your face.'}
                </Text>
              )}
            </View>
          </>
        ) : null}

        {tab === 'skin' ? (
          <>
            <Text style={styles.sectionTitle}>Your skin check</Text>
            <View style={styles.card}>
              {fitzLabel ? (
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Your skin tone</Text>
                  <Text style={styles.sumValue}>{fitzLabel}</Text>
                </View>
              ) : null}
              {undertone ? (
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Warm / cool hint</Text>
                  <Text style={styles.sumValue}>{undertone.label}</Text>
                </View>
              ) : null}
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Photo clarity</Text>
                <Text style={styles.sumValue}>{faceQuality}/100</Text>
              </View>
            </View>

            {scores ? (
              <View style={[styles.card, styles.cardSpaced]}>
                {scores.overall ? (
                  <View style={styles.scoreHead}>
                    <View>
                      <Text style={styles.scoreBig}>{scores.overall}</Text>
                      <Text style={styles.scoreCap}>Overall skin score (out of 100)</Text>
                    </View>
                    {scores.skinAge ? (
                      <View style={styles.ageChip}>
                        <Text style={styles.ageChipText}>Skin looks ~{scores.skinAge} yrs</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <ScoreBar label="Glow" value={scores.radiance} hint="How bright and healthy your skin looks." />
                <ScoreBar label="Moisture" value={scores.moisture} hint="How well your skin holds water." />
                <ScoreBar
                  label="Clear skin"
                  value={scores.acne}
                  hint="Higher = fewer visible spots or blemishes."
                />
                <ScoreBar
                  label="Oil balance"
                  value={100 - scores.oiliness}
                  hint="Not too oily, not too dry."
                />
                <ScoreBar label="Pores" value={scores.pore} hint="How visible your pores appear." />
                <ScoreBar
                  label="Smoothness"
                  value={scores.wrinkle}
                  hint="How smooth and even your skin texture is."
                />
                <ScoreBar label="Firmness" value={scores.firmness} hint="How firm and lifted your skin looks." />
                <Text style={styles.fine}>These are quick AI readings to guide your skincare — not a medical diagnosis.</Text>
                <Text style={styles.fine}>
                  Your skin can look slightly darker in sunny months and lighter in cold or rainy seasons. Check your shade again when the weather changes.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, styles.cardSpaced]}>
                <Text style={styles.cardTitle}>Skin check needs a closer photo</Text>
                <Text style={styles.storeDetail}>
                  For the skin details, try taking the photo a bit closer to your face next time. Your foundation shade match is still ready to use!
                </Text>
              </View>
            )}

            {undertone ? (
              <>
                <Text style={styles.sectionTitle}>
                  Lip colours that suit you
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
            <Text style={styles.sectionTitle}>Your saved foundation bottle</Text>
            <Text style={styles.sectionSubtitle}>
              Show this screen to any beauty counter assistant or stall seller:
            </Text>
            <View style={styles.card}>
              <View style={styles.passportHeader}>
                <View style={styles.passportDot} />
                <Text style={styles.cardTitle}>Saved on this phone</Text>
              </View>
              <View style={styles.passportRow}>
                <View style={[styles.passportSwatch, { backgroundColor: matches[0].hex }]} />
                <View style={styles.lipText}>
                  <Text style={styles.lipName}>
                    {matches[0].brand} {matches[0].line} — Shade {matches[0].name}
                  </Text>
                  <Text style={styles.lipNote}>
                    {matches[0].matchPercent}% match score · Saved on this phone · Check it anytime in beauty shops
                  </Text>
                </View>
              </View>
            </View>

            {/* Modern Peach Cosmetics Flagship Boutique Preview */}
            <View style={[styles.card, styles.peachFlagshipCard]}>
              <View style={styles.peachKickerRow}>
                <Text style={styles.peachCrown}>✦</Text>
                <Text style={styles.peachKicker}>FLAGSHIP BOUTIQUE</Text>
                <View style={styles.peachSoonPill}>
                  <Text style={styles.peachSoonPillText}>OPENING SOON</Text>
                </View>
              </View>
              <Text style={styles.peachFlagshipTitle}>{STORE_NAME}</Text>
              <Text style={styles.peachFlagshipDesc}>
                Order your exact shade directly from us with 100% jawline match guarantee. Free shade swap if it doesn't melt into your skin seamlessly.
              </Text>
              <TouchableOpacity
                style={styles.peachBoutiqueBtn}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic.selection();
                  router.push('/store');
                }}
              >
                <Text style={styles.peachBoutiqueBtnText}>Explore Boutique Shelves & VIP Waitlist →</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Available now in stores</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.store} onPress={() => searchShade('jumia')}>
                <Text style={styles.storeName}>Find this shade on Jumia Ghana →</Text>
                <Text style={styles.storeDetail}>
                  {current.brand} {current.line} — shade {current.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.store} onPress={() => searchShade('google')}>
                <Text style={styles.storeName}>Search prices on Google →</Text>
                <Text style={styles.storeDetail}>Compare prices across local beauty stores</Text>
              </TouchableOpacity>
              {STORES.slice(1).map((s) => (
                <View key={s.name} style={styles.store}>
                  <Text style={styles.storeName}>{s.name}</Text>
                  <Text style={styles.storeDetail}>{s.detail}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic.light();
            router.replace('/');
          }}
        >
          <Text style={styles.linkText}>← Start over with a new photo</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Frosted Glass Dock */}
      <BlurView intensity={85} tint="dark" style={styles.dock}>
        <View style={[styles.dockSwatch, { backgroundColor: current.hex }]} />
        <View style={styles.dockText}>
          <Text style={styles.dockName} numberOfLines={1}>
            Shade: {current.name}
          </Text>
          <Text style={styles.dockBrand} numberOfLines={1}>
            {current.brand} · {current.line}
          </Text>
        </View>
        <TouchableOpacity style={styles.dockBtn} activeOpacity={0.85} onPress={shareResult}>
          <Text style={styles.dockBtnText}>Share My Shade</Text>
        </TouchableOpacity>
      </BlurView>

      <CoachTip
        tourKey="results"
        steps={[
          {
            title: 'Slide to compare',
            body: 'Drag the gold circle left and right to see bare skin vs your new foundation. Tap any shade below to try it on your face!',
          },
          {
            title: 'Your match score',
            body: "The gold circle shows how close this shade is to your skin tone and undertone so it won't look grey or ashy.",
          },
          {
            title: 'Save your shade',
            body: 'Tap "Share My Shade" at the bottom anytime to save or send your shade details before you head to the beauty store.',
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 28, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
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
    fontSize: 32,
    fontFamily: fonts.display,
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 8,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  badgeGold: {
    backgroundColor: 'rgba(212, 162, 78, 0.18)',
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  badgeText: {
    color: colors.goldSoft,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  warnCard: {
    backgroundColor: 'rgba(43, 26, 12, 0.85)',
    borderRadius: radius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  warnTitle: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  warnText: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 19,
    marginTop: 4,
  },
  heroShadow: {
    marginTop: 22,
    borderRadius: 24,
    ...shadows.card,
  },
  photoWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  photo: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  afterClip: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    marginLeft: -1.25,
    backgroundColor: colors.gold,
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    width: 52,
    height: 36,
    borderRadius: radius.full,
    marginLeft: -26,
    marginTop: -18,
    backgroundColor: colors.gold,
    borderWidth: 2.5,
    borderColor: '#150d07',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowGold,
  },
  handleArrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  handleArrow: {
    color: '#150d07',
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    lineHeight: 16,
  },
  handleGripLine: {
    width: 1.5,
    height: 12,
    borderRadius: 1,
    backgroundColor: '#150d07',
  },
  sliderTagL: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
    overflow: 'hidden',
  },
  sliderTagR: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  tagDotGold: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.gold },
  tagDotNeutral: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#e2d7c9' },
  sliderTagText: {
    color: colors.cream,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(21, 13, 7, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.4)',
  },
  loadingText: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: fonts.bodySemi,
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
  mockNote: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 10,
    textAlign: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
    position: 'relative',
  },
  slidingPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    ...shadows.subtle,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.full, alignItems: 'center' },
  segBtnActive: {},
  segText: { color: colors.muted, fontSize: 13, fontFamily: fonts.bodyBold },
  segTextActive: { color: '#150d07' },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: '#26170c',
    ...shadows.subtle,
  },
  chipTextSelected: {
    color: colors.goldSoft,
  },
  chipCheck: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  peachFlagshipCard: {
    marginTop: 16,
    backgroundColor: 'rgba(38, 23, 12, 0.85)',
    borderColor: 'rgba(212, 162, 78, 0.4)',
    borderWidth: 1.5,
    ...shadows.card,
  },
  peachKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  peachCrown: {
    color: colors.gold,
    fontSize: 12,
  },
  peachKicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
    flex: 1,
  },
  peachSoonPill: {
    backgroundColor: 'rgba(212, 162, 78, 0.2)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  peachSoonPillText: {
    color: colors.goldSoft,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
  },
  peachFlagshipTitle: {
    color: colors.cream,
    fontSize: 22,
    fontFamily: fonts.displaySemi,
    marginBottom: 6,
  },
  peachFlagshipDesc: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 19,
    marginBottom: 14,
  },
  peachBoutiqueBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    ...shadows.glowGold,
  },
  peachBoutiqueBtnText: {
    color: '#150d07',
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  sectionTitle: {
    color: colors.cream,
    fontSize: 20,
    fontFamily: fonts.displaySemi,
    marginTop: 30,
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 14,
    lineHeight: 18,
  },
  subTitleExplain: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 6,
    lineHeight: 18,
  },
  productBanner: {
    marginTop: 18,
    marginBottom: 6,
  },
  productBannerKicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  productBannerSub: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 18,
  },
  matchScoreExplain: {
    backgroundColor: 'rgba(212, 162, 78, 0.08)',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.2)',
  },
  matchScoreExplainText: {
    color: colors.creamSoft,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 17,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  matchCardWrap: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  cardSpaced: { marginTop: 18 },
  cardTitle: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginBottom: 12,
  },
  whyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  whyLabel: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.bodySemi,
    width: 82,
  },
  whyBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
    marginRight: 10,
  },
  whyFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  whyValue: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  undertoneTip: {
    color: colors.goldSoft,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    marginTop: 4,
    lineHeight: 18,
  },
  fine: {
    color: colors.goldDim,
    fontSize: 11,
    fontFamily: fonts.body,
    marginTop: 8,
    lineHeight: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.12)',
  },
  chipSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipText: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: fonts.bodySemi,
  },
  lipRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  lipSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  lipText: { flex: 1 },
  lipName: {
    color: colors.cream,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  lipNote: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
    lineHeight: 17,
  },
  feedbackRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  feedbackBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackYes: { backgroundColor: colors.gold, ...shadows.subtle },
  feedbackYesText: { color: '#150d07', fontSize: 14, fontFamily: fonts.bodyBold },
  feedbackNo: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  feedbackNoText: { color: colors.goldSoft, fontSize: 14, fontFamily: fonts.bodySemi },
  feedbackThanks: {
    color: colors.cream,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    lineHeight: 21,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 162, 78, 0.08)',
  },
  sumLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.bodyMedium },
  sumValue: { color: colors.cream, fontSize: 14, fontFamily: fonts.bodyBold },
  scoreHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreBig: {
    color: colors.gold,
    fontSize: 42,
    fontFamily: fonts.display,
    lineHeight: 44,
  },
  scoreCap: { color: colors.muted, fontSize: 12, fontFamily: fonts.bodyMedium, marginTop: 2 },
  ageChip: {
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.25)',
  },
  ageChipText: { color: colors.goldSoft, fontSize: 12, fontFamily: fonts.bodyBold },
  passportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  passportDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: 8,
  },
  passportRow: { flexDirection: 'row', alignItems: 'center' },
  passportSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(212, 162, 78, 0.35)',
  },
  store: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 162, 78, 0.1)',
  },
  storeName: { color: colors.cream, fontSize: 15, fontFamily: fonts.bodyBold },
  storeDetail: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 3,
    lineHeight: 19,
  },
  storeLink: {
    color: colors.goldSoft,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    marginTop: 14,
  },
  divider: {
    color: colors.goldDim,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 4,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ctaText: { color: '#150d07', fontSize: 15, fontFamily: fonts.bodyBold },
  linkBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 8 },
  linkText: { color: colors.goldSoft, fontSize: 14, fontFamily: fonts.bodySemi },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 162, 78, 0.25)',
  },
  dockSwatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(212, 162, 78, 0.4)',
  },
  dockText: { flex: 1 },
  dockName: { color: colors.cream, fontSize: 15, fontFamily: fonts.bodyBold },
  dockBrand: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, marginTop: 1 },
  dockBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...shadows.glowGold,
  },
  dockBtnText: { color: '#150d07', fontSize: 14, fontFamily: fonts.bodyBold },
});
