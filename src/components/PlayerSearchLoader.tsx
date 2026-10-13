import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Ionicons from "@react-native-vector-icons/ionicons/static";

const SWING_GREEN = '#008080';

type SearchPulseProps = {
  title?: string;
  subtitle?: string;
};

type PulseRingProps = {
  delay: number;
};

function PulseRing({ delay }: PulseRingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 2.6],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.45, 0],
  });

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export default function PlayerSearchLoader({
  title = 'Searching for players',
  subtitle = 'Depending on the availablity, this may take a moment.',
}: SearchPulseProps) {
  const pinPosition = useRef(new Animated.Value(0)).current;
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const pinAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pinPosition, {
          toValue: -7,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pinPosition, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pinAnimation.start();
    const dotInterval = setInterval(() => {
      setDotCount((count) => (count + 1) % 4);
    }, 450);

    return () => {
      pinAnimation.stop();
      clearInterval(dotInterval);
    };
  }, [pinPosition]);

  return (
    <View style={styles.container}>
      <View style={styles.animationContainer}>
        <PulseRing delay={0} />
        <PulseRing delay={700} />
        <PulseRing delay={1400} />

        <View style={styles.centerGlow}>
          <Animated.View
            style={{
              transform: [{ translateY: pinPosition }],
            }}
          >
            <View style={styles.pinContainer}>
              <Ionicons name="location" size={52} color={SWING_GREEN} />
            </View>
          </Animated.View>

          <View style={styles.pinShadow} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {title}
          <Text>{'.'.repeat(dotCount)}</Text>
        </Text>

        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  animationContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: SWING_GREEN,
    backgroundColor: 'rgba(0, 128, 128, 0.05)',
  },

  centerGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: SWING_GREEN,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },

  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pinShadow: {
    position: 'absolute',
    bottom: 16,
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },

  textContainer: {
    alignItems: 'center',
  },

  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 290,
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
