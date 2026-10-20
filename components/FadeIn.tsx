import { ReactNode, useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

// Gentle entrance: fade + rise, native-driven so it never janks the JS
// thread. Stagger siblings with increasing `delay` (0, 90, 180, ...).

export default function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    });
    t.start();
    return () => t.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
