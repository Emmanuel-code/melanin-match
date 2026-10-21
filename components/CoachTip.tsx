import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { triggerHaptic } from '../lib/haptics';
import { colors, fonts, radius, shadows } from '../lib/theme';
import { markTourSeen, tourSeen, TourKey } from '../lib/tour';

export interface CoachStep {
  title: string;
  body: string;
}

export default function CoachTip({ tourKey, steps }: { tourKey: TourKey; steps: CoachStep[] }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let live = true;
    tourSeen(tourKey).then((seen) => {
      if (live && !seen) setVisible(true);
    });
    return () => {
      live = false;
    };
  }, [tourKey]);

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  const last = step === steps.length - 1;
  const dismiss = () => {
    triggerHaptic.light();
    setVisible(false);
    markTourSeen(tourKey);
  };
  const next = () => {
    triggerHaptic.selection();
    if (last) dismiss();
    else setStep(step + 1);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          ],
        },
      ]}
    >
      <Text style={styles.kicker}>
        QUICK TOUR · {step + 1}/{steps.length}
      </Text>
      <Text style={styles.title}>{steps[step].title}</Text>
      <Text style={styles.body}>{steps[step].body}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={dismiss} activeOpacity={0.7} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip tour</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={next} activeOpacity={0.85} style={styles.nextBtn}>
          <Text style={styles.nextText}>{last ? 'Got it' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#26190f',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    padding: 18,
    zIndex: 50,
    ...shadows.card,
  },
  kicker: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 2,
  },
  title: {
    color: colors.cream,
    fontSize: 17,
    fontFamily: fonts.displaySemi,
    marginTop: 8,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.body,
    lineHeight: 20,
    marginTop: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  skipBtn: { paddingVertical: 8, paddingRight: 16 },
  skipText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  nextBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  nextText: {
    color: '#150d07',
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
