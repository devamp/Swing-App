import { StyleSheet, View } from 'react-native';
import Theme from '../theme';

// Decorative court lines for page backgrounds and dark match cards.
export default function CourtBackground({ variant = 'page' }: { variant?: 'page' | 'card' }) {
  const isCard = variant === 'card';
  return (
    <View
      style={styles.background}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[Theme.styles.backgroundBlobTop, isCard && styles.cardGlowTop]} />
      <View style={[Theme.styles.backgroundBlobBottom, isCard && styles.cardGlowBottom]} />
      <View style={[styles.court, isCard && styles.cardCourt]}>
        <View style={[styles.courtSidelineLeft, isCard && styles.cardLine]} />
        <View style={[styles.courtSidelineRight, isCard && styles.cardLine]} />
        <View style={[styles.courtNet, isCard && styles.cardLine]} />
        <View style={[styles.courtServiceLineTop, isCard && styles.cardLine]} />
        <View style={[styles.courtServiceLineBottom, isCard && styles.cardLine]} />
        <View style={[styles.courtCenterLine, isCard && styles.cardLine]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  court: {
    position: 'absolute',
    width: 300,
    height: 520,
    top: '12%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Theme.PRIMARY,
    opacity: 0.08,
    transform: [{ rotate: '-22deg' }],
  },
  cardCourt: {
    width: 230,
    height: 390,
    top: -55,
    right: -45,
    borderColor: '#FFFFFF',
    opacity: 0.14,
    transform: [{ rotate: '24deg' }],
  },
  cardLine: { borderColor: '#FFFFFF' },
  cardGlowTop: { backgroundColor: '#7DE4CE', opacity: 0.14 },
  cardGlowBottom: { backgroundColor: '#DFF599', opacity: 0.1 },
  courtSidelineLeft: {
    position: 'absolute',
    left: 32,
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderColor: Theme.PRIMARY,
  },
  courtSidelineRight: {
    position: 'absolute',
    right: 32,
    top: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderColor: Theme.PRIMARY,
  },
  courtNet: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    borderTopWidth: 3,
    borderColor: Theme.PRIMARY,
  },
  courtServiceLineTop: {
    position: 'absolute',
    top: '25%',
    left: 32,
    right: 32,
    borderTopWidth: 2,
    borderColor: Theme.PRIMARY,
  },
  courtServiceLineBottom: {
    position: 'absolute',
    bottom: '25%',
    left: 32,
    right: 32,
    borderTopWidth: 2,
    borderColor: Theme.PRIMARY,
  },
  courtCenterLine: {
    position: 'absolute',
    top: '25%',
    bottom: '25%',
    left: '50%',
    borderLeftWidth: 2,
    borderColor: Theme.PRIMARY,
  },
});
