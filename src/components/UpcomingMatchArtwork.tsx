import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { StyleSheet, View } from 'react-native';
import type { Sport } from '../types';

// A decorative rally scene, independent of the actual match roster.
export default function UpcomingMatchArtwork({ sport }: { sport: Sport }) {
  const racket = sport === 'tennis' ? 'tennis' : 'table-tennis';

  return (
    <View
      style={styles.scene}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.court}>
        <View style={styles.singlesLines} />
        <View style={styles.serviceLines} />
        <View style={styles.centerLine} />
        <View style={styles.net} />
      </View>
      <View style={styles.nearPlayer}>
        <MaterialCommunityIcons name="run" size={27} color="#E6F1C1" />
        <View style={styles.racket}>
          <MaterialCommunityIcons name={racket} size={17} color="#E6F1C1" />
        </View>
      </View>
      <View style={styles.farPlayer}>
        <MaterialCommunityIcons name="run" size={27} color="#C4EAE8" />
        <View style={styles.racket}>
          <MaterialCommunityIcons name={racket} size={17} color="#C4EAE8" />
        </View>
      </View>
      <View style={styles.ballTrail} />
      <View style={styles.ball} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { width: 96, height: 64, flexShrink: 0 },
  court: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 9,
    bottom: 9,
    borderWidth: 1,
    borderColor: '#FFFFFF55',
    backgroundColor: '#FFFFFF08',
    transform: [{ rotate: '-8deg' }],
  },
  singlesLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 7,
    bottom: 7,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFFFFF33',
  },
  serviceLines: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: 7,
    bottom: 7,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFFFFF33',
  },
  centerLine: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: '50%',
    borderTopWidth: 1,
    borderColor: '#FFFFFF33',
  },
  net: {
    position: 'absolute',
    left: '50%',
    top: -3,
    bottom: -3,
    borderLeftWidth: 2,
    borderColor: '#FFFFFF99',
  },
  nearPlayer: { position: 'absolute', left: 4, bottom: 1 },
  farPlayer: { position: 'absolute', right: 3, top: 0, transform: [{ scaleX: -1 }] },
  racket: { position: 'absolute', left: 20, top: 1, transform: [{ rotate: '-30deg' }] },
  ball: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E6F1C1',
    left: 46,
    top: 26,
  },
  ballTrail: {
    position: 'absolute',
    width: 10,
    height: 1,
    backgroundColor: '#E6F1C166',
    left: 35,
    top: 31,
    transform: [{ rotate: '-25deg' }],
  },
});
