import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, fonts } from '../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  percent: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
}

export default function MatchGauge({ percent, size = 96, strokeWidth = 8 }: Props) {
  const animatedVal = useRef(new Animated.Value(0)).current;
  const [displayNumber, setDisplayNumber] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedPercent = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    // Listener to update the numeric counter in sync with the animation
    const listenerId = animatedVal.addListener(({ value }) => {
      setDisplayNumber(Math.round(value));
    });

    Animated.timing(animatedVal, {
      toValue: clampedPercent,
      duration: 1100,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedVal.removeListener(listenerId);
    };
  }, [clampedPercent, animatedVal]);

  const strokeDashoffset = animatedVal.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference * (1 - clampedPercent / 100)],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.goldSoft} />
            <Stop offset="100%" stopColor={colors.gold} />
          </LinearGradient>
        </Defs>

        {/* Ambient Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceLight}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Active Animated Gauge */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#goldGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Centered Typography */}
      <View style={styles.centerText}>
        <View style={styles.numberRow}>
          <Text style={styles.number}>{displayNumber}</Text>
          <Text style={styles.percentSymbol}>%</Text>
        </View>
        <Text style={styles.label}>MATCH</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  number: {
    fontFamily: fonts.bodyExtra,
    fontSize: 24,
    color: colors.cream,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  percentSymbol: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.goldSoft,
    marginLeft: 1,
    marginTop: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.goldDim,
    letterSpacing: 2,
    marginTop: 2,
  },
});
