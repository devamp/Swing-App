import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';

import Theme from '../theme';
import CourtBackground from './CourtBackground';

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
  subtitle = 'Finding your next match may take a moment. Hang tight!',
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CourtBackground />

      <View style={styles.searchCard}>
        <View style={styles.searchBadge}>
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={16}
            color={Theme.PRIMARY}
          />
          <Text style={styles.searchBadgeText}>LET’S GET YOU PLAYING</Text>
        </View>
        <View
          style={styles.animationContainer}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.radarOuter} />
          <View style={styles.radarInner} />
          <View style={[styles.playerMarker, styles.playerMarkerTop]}>
            <MaterialCommunityIcons name="account-outline" size={20} color={Theme.PRIMARY} />
          </View>
          <View style={[styles.playerMarker, styles.playerMarkerBottom]}>
            <MaterialCommunityIcons name="account-outline" size={20} color={Theme.PRIMARY} />
          </View>
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
                <MaterialCommunityIcons name="map-marker-outline" size={52} color={Theme.PRIMARY} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Theme.BACKGROUND,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },

  searchCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderRadius: 28,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  searchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Theme.BACKGROUND,
  },
  searchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Theme.PRIMARY,
  },
  radarOuter: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: Theme.PRIMARY,
    opacity: 0.1,
  },
  radarInner: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: Theme.PRIMARY,
    opacity: 0.04,
  },
  playerMarker: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.BACKGROUND,
    borderWidth: 3,
    borderColor: Theme.SURFACE,
  },
  playerMarkerTop: { top: 30, right: 24 },
  playerMarkerBottom: { bottom: 34, left: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 320,
  },
  footerText: {
    flexShrink: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
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
    borderColor: Theme.PRIMARY,
    backgroundColor: `${Theme.PRIMARY}0D`,
  },

  centerGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.PRIMARY,
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
    color: Theme.TEXT,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 290,
    marginTop: 8,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
