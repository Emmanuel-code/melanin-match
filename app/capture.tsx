import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
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
import { ONBOARDING_PROOF_IMG } from '../lib/images';
import { colors, radius } from '../lib/theme';

const CHECKLIST = [
  'Your face fills the frame',
  'Even, natural lighting — no harsh shadows',
  'No glasses or heavy filters',
  'Forehead visible (push hair back)',
];

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.8,
};

export default function CaptureScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);

  // Gallery picks come back as content:// URIs on Android: the pipeline can
  // READ those, but the results screen's <Image> cannot DISPLAY them (the
  // "before" photo failed as flat colour — confirmed on device, twice: a
  // plain file copy of the same bytes failed too, so the issue is the
  // source format/address, not the transport). Transcode every pick to a
  // plain JPEG in the app cache through the native imaging stack — that
  // decodes content://, HEIC and WebP sources into a file every view can
  // show.
  const normalizePhoto = async (uri: string): Promise<string> => {
    if (uri.startsWith('file://')) return uri;
    try {
      const out = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return out.uri;
    } catch {
      // fall through to a plain copy, then to the original URI
    }
    try {
      const dest = `${FileSystem.cacheDirectory}peach-photo-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    } catch {
      return uri;
    }
  };

  // Demo-day safety net: a bundled portrait, written to a real file so the
  // whole pipeline (including the upload) treats it exactly like a selfie.
  const useSample = async () => {
    if (sampleBusy) return;
    setSampleBusy(true);
    try {
      const base64 = ONBOARDING_PROOF_IMG.split(',')[1];
      const dest = `${FileSystem.cacheDirectory}peach-sample-selfie.jpg`;
      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPhotoUri(dest);
    } catch {
      Alert.alert(
        'Sample unavailable',
        'The sample photo could not be prepared — please take a photo instead.',
      );
    } finally {
      setSampleBusy(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access so you can snap your selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(await normalizePhoto(result.assets[0].uri));
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos needed', 'Allow photo access so you can pick a selfie.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(await normalizePhoto(result.assets[0].uri));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your selfie</Text>
        <Text style={styles.sub}>
          Good photo in, good match out. Quick checklist first:
        </Text>

        <View style={styles.checklist}>
          {CHECKLIST.map((item) => (
            <View key={item} style={styles.checkRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.privacy}>
          Privacy: your photo is analyzed by YouCam’s AI to read your skin tone. We never store
          your photo.
        </Text>

        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                activeOpacity={0.85}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={styles.btnGhostText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/analyzing', params: { uri: photoUri } })}
              >
                <Text style={styles.btnPrimaryText}>Looks good →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                activeOpacity={0.85}
                onPress={takePhoto}
              >
                <Text style={styles.btnPrimaryText}>Take a photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                activeOpacity={0.85}
                onPress={pickFromLibrary}
              >
                <Text style={styles.btnGhostText}>From gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.sampleBtn}
              activeOpacity={0.8}
              onPress={useSample}
              disabled={sampleBusy}
            >
              <Text style={styles.sampleText}>
                {sampleBusy ? 'Preparing sample…' : 'No photo handy? Try a sample photo'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <CoachTip
        tourKey="capture"
        steps={[
          {
            title: 'Light is everything',
            body: 'Face a window if you can. Our quality gate warns you if the light would throw your match off — we’d rather ask for a retake than guess.',
          },
          {
            title: 'Your photo stays yours',
            body: 'It’s analyzed only to read your skin tone, and never stored. Take a photo or pick one — then we do the science.',
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingTop: 32 },
  title: { color: colors.cream, fontSize: 32, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  checklist: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 20,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  check: { color: colors.gold, fontSize: 16, fontWeight: '700', marginRight: 10 },
  checkText: { color: colors.cream, fontSize: 14 },
  privacy: { color: colors.goldDim, fontSize: 12, lineHeight: 17, marginTop: 14 },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    marginTop: 24,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.gold },
  btnPrimaryText: { color: '#1a120b', fontSize: 16, fontWeight: '800' },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.goldDim },
  btnGhostText: { color: colors.goldSoft, fontSize: 16, fontWeight: '700' },
  sampleBtn: { alignItems: 'center', marginTop: 18, paddingVertical: 8 },
  sampleText: {
    color: colors.goldSoft,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
