import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CompactMatchCard } from '../MatchCards';
import type { FoundMatch } from '../../services/matchService/types';
import type { PlayMatch, PlayResult } from '../../services/playMap/types';
import Theme from '../../theme';

/** Presentation-only adapter lets Play Map reuse Dashboard's match card without Firebase calls. */
export function asMatchCard(match: PlayMatch & { distanceMiles?: number }): FoundMatch {
  return {
    id: match.id,
    userId: match.hosted ? 'mock-host' : 'mock-player',
    sport: match.sport.toLowerCase(),
    gameType: match.title,
    skillLevel: match.skill.toLowerCase(),
    playersNeeded: match.openSpots,
    startsAt: {
      toDate: () => new Date(match.startsAt),
      toMillis: () => Date.parse(match.startsAt),
    },
    matchCourtLocation: {
      name: match.venue,
      ...match.coordinate,
      distanceMiles: match.distanceMiles,
    },
    note: match.note,
  } as FoundMatch;
}
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
export function ResultCard({
  result,
  selected,
  onPress,
}: {
  result: PlayResult;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.frame, selected && styles.selected]}>
      {selected && <Text style={styles.selection}>Selected on map</Text>}
      {result.kind === 'matches' ? (
        <CompactMatchCard match={asMatchCard(result)} onPress={onPress} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel={`Preview ${result.name}, ${result.sport}, ${result.skill}, ${result.area}, ${result.availability.join(', ')}`}
          onPress={onPress}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials(result.name)}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{result.name}</Text>
              <Text style={styles.meta}>
                {result.sport} · {result.skill}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color={Theme.PRIMARY} size={22} />
          </View>
          <Text style={styles.meta}>
            {result.area} · ~{result.distanceMiles.toFixed(1)} mi
          </Text>
          <Text style={styles.availability}>{result.availability.join(' · ')}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { borderRadius: 20, borderWidth: 2, borderColor: 'transparent', marginBottom: 10 },
  selected: { borderColor: Theme.PRIMARY, backgroundColor: '#EAF5F5' },
  selection: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  card: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAEA',
    padding: 16,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { fontSize: 17, fontWeight: '800', color: Theme.PRIMARY },
  copy: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: Theme.TEXT },
  meta: { fontSize: 14, color: Theme.SUB_TEXT_COLOR, marginTop: 3 },
  availability: { fontSize: 13, fontWeight: '600', color: Theme.PRIMARY },
});
