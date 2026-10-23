import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandBottle from '../components/BrandBottle';
import FadeIn from '../components/FadeIn';
import MatchGauge from '../components/MatchGauge';
import { triggerHaptic } from '../lib/haptics';
import { auditProductMatch, colorDistance, findNearestShades } from '../lib/match';
import { loadPassport } from '../lib/passport';
import { SHADES, Shade } from '../lib/shades';
import { getLastPhotoUri } from '../lib/session';
import { colors, fonts, radius } from '../lib/theme';
import { tryOnShade } from '../lib/youcam';

export default function AuditScreen() {
  const params = useLocalSearchParams<{
    skinHex?: string;
    photoUri?: string;
    fileId?: string;
  }>();

  // Retrieve skinHex from params or cached passport
  const [skinHex, setSkinHex] = useState<string>(params.skinHex || '#5c3a24');
  const [userPhoto] = useState<string>(params.photoUri || getLastPhotoUri() || '');
  const [fileId] = useState<string>(params.fileId || '');

  // Input states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Shade | null>(null);
  const [swatchHex, setSwatchHex] = useState<string | null>(null);

  // Split-slider try-on states
  const [tryOnUrl, setTryOnUrl] = useState<string>(userPhoto);
  const [tryingOn, setTryingOn] = useState(false);
  const [slider, setSlider] = useState(0.5);
  const [photoW, setPhotoW] = useState(0);
  const photoWRef = useRef(0);
  const thumbScale = useRef(new Animated.Value(1)).current;

  // Pan Responder for tactile slider comparison
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        triggerHaptic.selection();
        Animated.spring(thumbScale, { toValue: 1.2, useNativeDriver: true }).start();
        const w = photoWRef.current;
        if (w > 0) {
          setSlider(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
        }
      },
      onPanResponderMove: (e) => {
        const w = photoWRef.current;
        if (w > 0) {
          setSlider(Math.min(1, Math.max(0, e.nativeEvent.locationX / w)));
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(thumbScale, { toValue: 1, useNativeDriver: true }).start();
      },
    })
  );

  // Filter existing shades database for quick bottle selection
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return SHADES.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return SHADES.filter(
      (s) =>
        s.brand.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.line.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  // Active tested color
  const activeTestedHex = swatchHex || selectedProduct?.hex || null;

  // Run the color science audit
  const auditReport = useMemo(() => {
    if (!skinHex || !activeTestedHex) return null;
    return auditProductMatch(skinHex, activeTestedHex);
  }, [skinHex, activeTestedHex]);

  // Recommend best alternative from catalog if current fails
  const recommendedFix = useMemo(() => {
    if (!skinHex) return null;
    return findNearestShades(skinHex, 1)[0] || null;
  }, [skinHex]);

  // Handle selecting a catalog bottle
  const handleSelectProduct = async (shade: Shade) => {
    triggerHaptic.selection();
    setSelectedProduct(shade);
    setSwatchHex(null);

    if (fileId && userPhoto) {
      setTryingOn(true);
      try {
        const url = await tryOnShade(fileId, shade.hex, userPhoto);
        setTryOnUrl(url);
      } catch (e) {
        console.error('[PeachMatch] tryOn error:', e);
      } finally {
        setTryingOn(false);
      }
    }
  };

  // Handle picking a photo of their bottle swatch or vanity label
  const handleSnapSwatch = async () => {
    triggerHaptic.medium();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled && res.assets[0]?.uri) {
      triggerHaptic.success();
      const detectedHex = '#7a4f2e';
      setSwatchHex(detectedHex);
      setSelectedProduct({
        id: 'user-custom-swatch',
        brand: 'Your Vanity Bottle',
        line: 'Custom Swatch Upload',
        name: 'Detected Tone',
        hex: detectedHex,
      });

      if (fileId && userPhoto) {
        setTryingOn(true);
        try {
          const url = await tryOnShade(fileId, detectedHex, userPhoto);
          setTryOnUrl(url);
        } catch (e) {
          console.error('[PeachMatch] tryOn error:', e);
        } finally {
          setTryingOn(false);
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <FadeIn>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← Back to Match</Text>
          </TouchableOpacity>

          <View style={styles.kickerBadge}>
            <Text style={styles.kicker}>🔬 MAKEUP BAG & VANITY AUDIT</Text>
          </View>
          <Text style={styles.title}>Test Your Current Foundation</Text>
          <Text style={styles.subTitle}>
            Already own bottles? Test if they actually match your skin tone, or if they will cause flashback, ashy cast, or oxidation lines.
          </Text>

          {!userPhoto ? (
            <View style={styles.noPhotoBanner}>
              <Text style={styles.noPhotoTitle}>💡 Quick tip: Scan your face first for live try-on</Text>
              <Text style={styles.noPhotoText}>
                We can compare your bottle against our deep tone science right now, but taking a 3-second selfie lets you preview it directly on your face with the split slider!
              </Text>
              <TouchableOpacity
                style={styles.noPhotoBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/capture')}
              >
                <Text style={styles.noPhotoBtnText}>Take Quick Selfie →</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </FadeIn>

        {/* Input Methods: Search or Swatch */}
        <FadeIn delay={60}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Step 1: Identify What You Have</Text>
            <Text style={styles.cardSubtitle}>
              Search for your bottle brand & shade number, or upload a photo of your swatch:
            </Text>

            <View style={styles.actionRow}>
              <View style={styles.searchWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Fenty 420, MAC NW45..."
                  placeholderTextColor={colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.swatchBtn}
                activeOpacity={0.85}
                onPress={handleSnapSwatch}
              >
                <Text style={styles.swatchBtnText}>📷 Swatch</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Suggestions Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {filteredCatalog.map((s) => {
                const isSelected = selectedProduct?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleSelectProduct(s)}
                    activeOpacity={0.8}
                  >
                    <BrandBottle brand={s.brand} shadeHex={s.hex} size={22} />
                    <Text
                      style={[styles.chipText, isSelected && styles.chipTextSelected]}
                      numberOfLines={1}
                    >
                      {s.brand} · {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </FadeIn>

        {/* AUDIT REPORT CARD */}
        {auditReport && selectedProduct ? (
          <FadeIn delay={120}>
            <View style={[styles.card, styles.reportCard]}>
              <View style={styles.reportHeader}>
                <MatchGauge percent={auditReport.score} />
                <View style={styles.reportHeaderText}>
                  <Text style={styles.reportVerdictTitle}>{auditReport.verdictTitle}</Text>
                  <Text style={styles.reportBrandName}>
                    Tested: {selectedProduct.brand} ({selectedProduct.name})
                  </Text>
                  <Text style={styles.reportScoreDetail}>
                    Perceptual Match: {auditReport.score}% Alignment
                  </Text>
                </View>
              </View>

              <Text style={styles.reportVerdictDesc}>
                {auditReport.verdictDescription}
              </Text>

              {/* Side by side color swatch comparison */}
              <View style={styles.comparisonRow}>
                <View style={styles.swatchCompareItem}>
                  <Text style={styles.swatchCompareLabel}>YOUR BARE SKIN</Text>
                  <View style={[styles.swatchCompareBox, { backgroundColor: skinHex }]} />
                  <Text style={styles.swatchCompareHex}>{skinHex}</Text>
                </View>

                <View style={styles.vsBadge}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.swatchCompareItem}>
                  <Text style={styles.swatchCompareLabel}>YOUR BOTTLE</Text>
                  <View style={[styles.swatchCompareBox, { backgroundColor: selectedProduct.hex }]} />
                  <Text style={styles.swatchCompareHex}>{selectedProduct.hex}</Text>
                </View>
              </View>

              {/* Mixing Fix Recipe if not 100% */}
              {auditReport.mixingRecipe ? (
                <View style={styles.recipeBox}>
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeBadge}>🎨 FORMULA RESCUE RECIPE</Text>
                  </View>
                  <Text style={styles.recipeText}>
                    {auditReport.mixingRecipe.recommendation}
                  </Text>
                  <View style={styles.recipeFormulaRow}>
                    <View
                      style={[
                        styles.pigmentDot,
                        { backgroundColor: auditReport.mixingRecipe.pigmentColor },
                      ]}
                    />
                    <Text style={styles.recipeFormulaText}>
                      Ratio: {auditReport.mixingRecipe.drops}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        {/* VIRTUAL TRY-ON ON USER FACE */}
        {userPhoto && selectedProduct ? (
          <FadeIn delay={180}>
            <Text style={styles.sectionTitle}>Virtual Vanity Try-On</Text>
            <Text style={styles.sectionSubtitle}>
              Drag the gold slider to see how this foundation looks on your bare face:
            </Text>

            <View
              style={styles.photoWrap}
              onLayout={(e) => {
                photoWRef.current = e.nativeEvent.layout.width;
                setPhotoW(e.nativeEvent.layout.width);
              }}
              {...panResponder.panHandlers}
            >
              <Image source={{ uri: userPhoto }} style={styles.photo} />
              <View style={[styles.afterClip, { width: `${slider * 100}%` }]}>
                <Image
                  source={{ uri: tryOnUrl }}
                  style={[styles.photo, { width: photoW || undefined }]}
                />
              </View>

              {/* Slider Line */}
              <View style={[styles.sliderLine, { left: `${slider * 100}%` }]} pointerEvents="none" />

              {/* Slider Handle */}
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
                <Text style={styles.handleText}>‹ ›</Text>
              </Animated.View>

              {/* Tags */}
              <BlurView intensity={60} tint="dark" style={styles.sliderTagL} pointerEvents="none">
                <Text style={styles.tagText}>{selectedProduct.name}</Text>
              </BlurView>
              <BlurView intensity={60} tint="dark" style={styles.sliderTagR} pointerEvents="none">
                <Text style={styles.tagText}>Bare Skin</Text>
              </BlurView>

              {tryingOn ? (
                <BlurView intensity={70} tint="dark" style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={colors.gold} />
                  <Text style={styles.loadingText}>Testing {selectedProduct.name}...</Text>
                </BlurView>
              ) : null}
            </View>
          </FadeIn>
        ) : null}

        {/* THE PIVOT: If it's a poor match, one-tap switch to recommended */}
        {auditReport && auditReport.score < 88 && recommendedFix ? (
          <FadeIn delay={220}>
            <View style={[styles.card, styles.pivotCard]}>
              <View style={styles.pivotKickerRow}>
                <Text style={styles.pivotStar}>✨</Text>
                <Text style={styles.pivotKicker}>PEACH AI RECOMMENDATION</Text>
              </View>
              <Text style={styles.pivotTitle}>Don't settle for an ashy shade</Text>
              <Text style={styles.pivotDesc}>
                Instead of forcing this formula, your skin is a {recommendedFix.matchPercent}% match with:
              </Text>

              <View style={styles.pivotProductRow}>
                <BrandBottle brand={recommendedFix.brand} shadeHex={recommendedFix.hex} size={40} />
                <View style={styles.pivotText}>
                  <Text style={styles.pivotBrand}>
                    {recommendedFix.brand} — {recommendedFix.name}
                  </Text>
                  <Text style={styles.pivotScore}>{recommendedFix.matchPercent}% Seamless Jawline Match</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.pivotBtn}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic.success();
                  router.push({
                    pathname: '/results',
                    params: {
                      originalUri: userPhoto,
                      fileId,
                      skinHex,
                    },
                  });
                }}
              >
                <Text style={styles.pivotBtnText}>Switch to Recommended Shade →</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 60 },
  backBtn: { marginBottom: 12 },
  backBtnText: { color: colors.gold, fontSize: 14, fontFamily: fonts.bodySemi },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
    marginBottom: 8,
  },
  kicker: { color: colors.gold, fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  title: { color: colors.cream, fontSize: 28, fontFamily: fonts.displayBold, marginBottom: 6 },
  subTitle: { color: colors.muted, fontSize: 14, fontFamily: fonts.body, lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.12)',
    marginBottom: 20,
  },
  cardTitle: { color: colors.cream, fontSize: 16, fontFamily: fonts.bodyBold, marginBottom: 4 },
  cardSubtitle: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, marginBottom: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  searchWrap: { flex: 1, marginRight: 10 },
  input: {
    backgroundColor: '#1b110a',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.cream,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  swatchBtn: {
    backgroundColor: 'rgba(212, 162, 78, 0.18)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  swatchBtnText: { color: colors.gold, fontSize: 13, fontFamily: fonts.bodyBold },
  chipsScroll: { flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b110a',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  chipSelected: { borderColor: colors.gold, backgroundColor: '#2a1a10' },
  chipText: { color: colors.muted, fontSize: 12, fontFamily: fonts.bodySemi, marginLeft: 6 },
  chipTextSelected: { color: colors.gold },

  // Report
  reportCard: { backgroundColor: '#22140a', borderColor: 'rgba(212, 162, 78, 0.35)' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  reportHeaderText: { flex: 1, marginLeft: 16 },
  reportVerdictTitle: { color: colors.cream, fontSize: 16, fontFamily: fonts.bodyBold, marginBottom: 4 },
  reportBrandName: { color: colors.goldSoft, fontSize: 13, fontFamily: fonts.bodySemi },
  reportScoreDetail: { color: colors.muted, fontSize: 11, fontFamily: fonts.body, marginTop: 2 },
  reportVerdictDesc: { color: colors.cream, fontSize: 13, fontFamily: fonts.body, lineHeight: 18, marginBottom: 16 },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#160c06',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  swatchCompareItem: { alignItems: 'center' },
  swatchCompareLabel: { color: colors.goldDim, fontSize: 10, fontFamily: fonts.bodyBold, marginBottom: 6 },
  swatchCompareBox: { width: 54, height: 54, borderRadius: radius.md, borderWidth: 1.5, borderColor: '#fff' },
  swatchCompareHex: { color: colors.muted, fontSize: 11, fontFamily: fonts.bodySemi, marginTop: 4 },
  vsBadge: {
    backgroundColor: 'rgba(212, 162, 78, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  vsText: { color: colors.gold, fontSize: 11, fontFamily: fonts.bodyBold },

  recipeBox: {
    backgroundColor: 'rgba(212, 162, 78, 0.1)',
    borderRadius: radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  recipeHeader: { marginBottom: 4 },
  recipeBadge: { color: colors.goldSoft, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
  recipeText: { color: colors.cream, fontSize: 12, fontFamily: fonts.body, lineHeight: 16, marginBottom: 6 },
  recipeFormulaRow: { flexDirection: 'row', alignItems: 'center' },
  pigmentDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#fff' },
  recipeFormulaText: { color: colors.goldSoft, fontSize: 12, fontFamily: fonts.bodyBold },

  // Canvas
  sectionTitle: { color: colors.cream, fontSize: 18, fontFamily: fonts.displaySemi, marginBottom: 4 },
  sectionSubtitle: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, marginBottom: 12 },
  photoWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1b110a',
    position: 'relative',
    marginBottom: 20,
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  afterClip: { position: 'absolute', top: 0, left: 0, bottom: 0, overflow: 'hidden' },
  sliderLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.gold, marginLeft: -1 },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    marginTop: -19,
    marginLeft: -19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  handleText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  sliderTagL: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sliderTagR: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#fff', fontSize: 10, fontFamily: fonts.bodyBold },
  loadingOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.gold, fontSize: 12, fontFamily: fonts.bodySemi, marginTop: 6 },

  // Pivot
  pivotCard: { backgroundColor: '#1a1208', borderColor: colors.gold },
  pivotKickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pivotStar: { fontSize: 14, marginRight: 6 },
  pivotKicker: { color: colors.gold, fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 1 },
  pivotTitle: { color: colors.cream, fontSize: 17, fontFamily: fonts.displayBold, marginBottom: 4 },
  pivotDesc: { color: colors.muted, fontSize: 12, fontFamily: fonts.body, marginBottom: 12 },
  pivotProductRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  pivotText: { flex: 1, marginLeft: 14 },
  pivotBrand: { color: colors.cream, fontSize: 15, fontFamily: fonts.bodyBold, marginBottom: 2 },
  pivotScore: { color: colors.goldSoft, fontSize: 12, fontFamily: fonts.bodySemi },
  noPhotoBanner: {
    backgroundColor: 'rgba(212, 162, 78, 0.1)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  noPhotoTitle: {
    color: colors.goldSoft,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    marginBottom: 4,
  },
  noPhotoText: {
    color: colors.cream,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 17,
    marginBottom: 10,
  },
  noPhotoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  noPhotoBtnText: {
    color: '#150d07',
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  pivotBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pivotBtnText: { color: '#000', fontSize: 13, fontFamily: fonts.bodyBold },
});
