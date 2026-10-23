import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Theme from '../theme';

export type MatchActionFeedback = { sequence: number; action: 'join' | 'leave' };

const COLORS = [Theme.PRIMARY, '#79B89C', '#E8BD55', '#E9957A', '#B3D9CF'];
const CONFETTI = Array.from({ length: 18 }, (_, index) => {
  const angle = ((index / 17) * 130 + 25) * (Math.PI / 180);
  const distance = 65 + (index % 4) * 16;
  return {
    x: Math.cos(angle) * distance,
    y: -Math.sin(angle) * distance,
    color: COLORS[index % COLORS.length],
    round: index % 3 === 0,
    rotation: index % 2 === 0 ? 240 : -280,
  };
});

/** Plays only for successful local actions, never for an initial membership load. */
export default function MatchActionAnimation({
  feedback,
  isPending,
  fullWidth,
  children,
}: {
  feedback?: MatchActionFeedback;
  isPending: boolean;
  fullWidth: boolean;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(1)).current;
  const lastSequence = useRef<number | undefined>(undefined);
  // Avoid playing motion before the device preference has loaded.
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!feedback || isPending || lastSequence.current === feedback.sequence) return;
    lastSequence.current = feedback.sequence;
    if (reduceMotion) return;

    const isJoin = feedback.action === 'join';
    scale.setValue(isJoin ? 0.9 : 0.94);
    burst.setValue(isJoin ? 0 : 1);
    const animation = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 260,
        damping: isJoin ? 10 : 13,
        mass: 0.7,
        useNativeDriver: true,
        isInteraction: false,
      }),
      ...(isJoin
        ? [
            Animated.timing(burst, {
              toValue: 1,
              duration: 950,
              easing: Easing.linear,
              useNativeDriver: true,
              isInteraction: false,
            }),
          ]
        : []),
    ]);
    animation.start();
    return () => {
      animation.stop();
      scale.setValue(1);
      burst.setValue(1);
    };
  }, [burst, feedback, isPending, reduceMotion, scale]);

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
      {feedback?.action === 'join' && !reduceMotion ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          {CONFETTI.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  backgroundColor: particle.color,
                  height: particle.round ? 6 : 10,
                  borderRadius: particle.round ? 3 : 1,
                  opacity: burst.interpolate({
                    inputRange: [0, 0.08, 0.65, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: burst.interpolate({
                        inputRange: [0, 0.45, 1],
                        outputRange: [0, particle.x * 0.75, particle.x],
                      }),
                    },
                    {
                      translateY: burst.interpolate({
                        inputRange: [0, 0.45, 0.7, 1],
                        outputRange: [0, particle.y, particle.y + 8, 18],
                      }),
                    },
                    {
                      rotate: burst.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${particle.rotation}deg`],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexShrink: 0, overflow: 'visible', zIndex: 1 },
  fullWidth: { width: '100%' },
  particle: { position: 'absolute', left: '50%', top: '50%', width: 6, marginLeft: -3 },
});
