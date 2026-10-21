import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoachTip from '../components/CoachTip';
import { triggerHaptic } from '../lib/haptics';
import { ONBOARDING_PROOF_IMG } from '../lib/images';
import { setLastPhotoUri } from '../lib/session';
import { colors, fonts, radius, shadows } from '../lib/theme';

const CHECKLIST = [
  'Face centered, filling the frame',
  'Even, natural daylight — face a window',
  'No sunglasses, hats, or heavy filters',
  'Forehead & jawline clearly visible',
];

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.85,
};

export default function CaptureScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);

  const normalizePhoto = async (uri: string): Promise<string> => {
    try {
      // Compress to 85% JPEG and return as a base64 data: URI.
      // This keeps the image self-contained in memory so it stays
      // accessible across navigation screens without any file path issues.
      // Note: youcam.ts handles data: URIs safely via decodeDataUri(),
      // so there is no longer a fetch(data:...) crash risk.
      const out = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });
      if (out.base64) {
        return `data:image/jpeg;base64,${out.base64}`;
      }
      return out.uri;
    } catch {
      return uri;
    }
  };

  const useSample = async () => {
    if (sampleBusy) return;
    triggerHaptic.light();
    setSampleBusy(true);
    try {
      setPhotoUri(ONBOARDING_PROOF_IMG);
      setLastPhotoUri(ONBOARDING_PROOF_IMG);
      triggerHaptic.success();
    } finally {
      setSampleBusy(false);
    }
  };

  const takePhoto = async () => {
    triggerHaptic.medium();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access so you can snap your selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) {
      triggerHaptic.success();
      const normalized = await normalizePhoto(result.assets[0].uri);
      setPhotoUri(normalized);
      setLastPhotoUri(normalized);
    }
  };

  const pickFromLibrary = async () => {
    triggerHaptic.light();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos needed', 'Allow photo access so you can pick a selfie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) {
      triggerHaptic.success();
      const normalized = await normalizePhoto(result.assets[0].uri);
      setPhotoUri(normalized);
      setLastPhotoUri(normalized);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.kickerBadge}>
          <Text style={styles.kicker}>STEP 1 OF 3</Text>
        </View>
        <Text style={styles.title}>Your selfie</Text>
        <Text style={styles.sub}>
          Good photo in, true match out. Natural lighting makes all the difference.
        </Text>

        {/* Studio Guide Frame (if no photo yet) */}
        {!photoUri && (
          <View style={styles.guideFrame}>
            <View style={styles.reticleOval}>
              <View style={styles.reticleInnerDot} />
              <Text style={styles.reticleText}>Align face here</Text>
            </View>
            <View style={styles.lightingTipBadge}>
              <Text style={styles.lightingTipText}>☀️ Face a window for best accuracy</Text>
            </View>
          </View>
        )}

        {photoUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic.light();
                  setPhotoUri(null);
                }}
              >
                <Text style={styles.btnGhostText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                activeOpacity={0.85}
                onPress={() => {
                  triggerHaptic.medium();
                  if (photoUri) setLastPhotoUri(photoUri);
                  router.push({ pathname: '/analyzing', params: { uri: photoUri } });
                }}
              >
                <Text style={styles.btnPrimaryText}>Analyze skin →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.checklist}>
              <Text style={styles.checklistHeader}>Quick photo tips</Text>
              {CHECKLIST.map((item) => (
                <View key={item} style={styles.checkRow}>
                  <View style={styles.checkIcon}>
                    <Text style={styles.check}>✓</Text>
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionColumn}>
              <TouchableOpacity
                style={styles.btnCamera}
                activeOpacity={0.85}
                onPress={takePhoto}
              >
                <Text style={styles.btnCameraIcon}>📸</Text>
                <Text style={styles.btnCameraText}>Take a photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnGallery}
                activeOpacity={0.85}
                onPress={pickFromLibrary}
              >
                <Text style={styles.btnGalleryText}>Choose from photo library</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sampleBtn}
              activeOpacity={0.8}
              onPress={useSample}
              disabled={sampleBusy}
            >
              <Text style={styles.sampleText}>
                {sampleBusy ? 'Preparing sample portrait…' : 'No photo handy? Try with our sample portrait'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacy}>
            Privacy promise: your photo is analyzed in real time by YouCam Skin AI to measure skin tone
            and Fitzpatrick depth. We never store or sell your photo.
          </Text>
        </View>
      </ScrollView>

      <CoachTip
        tourKey="capture"
        steps={[
          {
            title: 'Light is everything',
            body: 'Face a window if you can. Our AI quality gate checks for shadows — we’d rather prompt you to retake than sell you an inaccurate shade.',
          },
          {
            title: 'Your photo stays yours',
            body: 'It is analyzed only for your undertone and depth, and stays completely private on this device.',
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 162, 78, 0.12)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  kicker: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
  },
  title: {
    color: colors.cream,
    fontSize: 34,
    fontFamily: fonts.display,
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.body,
    lineHeight: 22,
    marginTop: 8,
  },
  guideFrame: {
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  reticleOval: {
    width: 110,
    height: 140,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(212, 162, 78, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
  reticleText: {
    color: colors.goldSoft,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
    marginTop: 8,
  },
  lightingTipBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(26, 18, 11, 0.85)',
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.2)',
  },
  lightingTipText: {
    color: colors.creamSoft,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
  },
  previewWrap: {
    marginTop: 24,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionColumn: {
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.gold,
    ...shadows.glowGold,
  },
  btnPrimaryText: {
    color: '#150d07',
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  btnGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  btnGhostText: {
    color: colors.creamSoft,
    fontSize: 15,
    fontFamily: fonts.bodySemi,
  },
  btnCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 18,
    ...shadows.glowGold,
  },
  btnCameraIcon: { fontSize: 18 },
  btnCameraText: {
    color: '#150d07',
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  btnGallery: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 162, 78, 0.3)',
  },
  btnGalleryText: {
    color: colors.cream,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  checklist: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.15)',
  },
  checklistHeader: {
    color: colors.cream,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    marginBottom: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 162, 78, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  check: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  checkText: {
    color: colors.creamSoft,
    fontSize: 13,
    fontFamily: fonts.body,
    flex: 1,
  },
  sampleBtn: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  sampleText: {
    color: colors.goldSoft,
    fontSize: 13,
    fontFamily: fonts.bodySemi,
    textDecorationLine: 'underline',
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 21, 12, 0.5)',
    borderRadius: radius.md,
    padding: 14,
    marginTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(212, 162, 78, 0.1)',
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: 10,
    marginTop: 2,
  },
  privacy: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    lineHeight: 18,
    flex: 1,
  },
});
