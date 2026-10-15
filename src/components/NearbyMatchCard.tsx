import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoundMatch } from '../services/matchService/types';
import Theme from '../theme';
import CourtBackground from './CourtBackground';
import { formatSkillLevel, getRelativeDateLabel } from './MatchCards';

export default function NearbyMatchCard({
  match,
  onPress,
}: {
  match: FoundMatch;
  onPress: () => void;
}) {
  const startDate = match.startsAt.toDate();
  const sport = match.sport === 'tennis' ? 'Tennis' : 'Pickleball';
  const startTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(startDate);
  const distance = match.matchCourtLocation.distanceMiles;
  const spots = Math.max(0, match.playersNeeded);
  const spotsLabel = spots > 0 ? `${spots} ${spots === 1 ? 'spot' : 'spots'} open` : 'Match full';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${match.matchName}, ${sport}${match.gameType ? `, ${match.gameType}` : ''}, ${formatSkillLevel(match.skillLevel)}, ${getRelativeDateLabel(startDate)} at ${startTime}, ${match.matchCourtLocation.name}, ${spotsLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headingSection}>
        <CourtBackground variant="card" />
        <View style={styles.headingRow}>
          <View style={styles.sportIcon}>
            <MaterialCommunityIcons
              name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
              size={21}
              color={Theme.SURFACE}
            />
          </View>
          <View style={styles.headingCopy}>
            <Text style={styles.title} numberOfLines={2}>
              {match.matchName} · {sport}
            </Text>
            <Text style={styles.skill}>
              {match.gameType ? `${match.gameType} · ` : ''}
              {formatSkillLevel(match.skillLevel)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.scheduleRow}>
          <MaterialCommunityIcons name="clock-outline" size={15} color={Theme.PRIMARY} />
          <Text style={styles.scheduleText}>
            {getRelativeDateLabel(startDate)} · {startTime}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={Theme.PRIMARY} />
          <Text style={styles.locationName} numberOfLines={2}>
            {match.matchCourtLocation.name}
            {typeof distance === 'number' && Number.isFinite(distance)
              ? ` · ${distance.toFixed(1)} mi`
              : ''}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.spotsBadge}>
            <Text style={styles.spotsText}>{spotsLabel}</Text>
          </View>
          <View style={styles.detailsLink}>
            <Text style={styles.detailsText}>View match</Text>
            <MaterialCommunityIcons name="arrow-right" size={15} color={Theme.PRIMARY} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    overflow: 'hidden',
    backgroundColor: Theme.SURFACE,
  },
  pressed: { opacity: 0.8 },
  headingSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Theme.PRIMARY,
    overflow: 'hidden',
  },
  body: { paddingHorizontal: 14, paddingVertical: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sportIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#FFFFFF26',
  },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { color: Theme.SURFACE, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  skill: { color: Theme.ON_PRIMARY_MUTED, fontSize: 11, lineHeight: 16, marginTop: 2, fontWeight: '600' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scheduleText: { flex: 1, color: Theme.TEXT, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 7 },
  locationName: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 9,
  },
  spotsBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  spotsText: { color: Theme.PRIMARY, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailsText: { color: Theme.PRIMARY, fontSize: 12, lineHeight: 18, fontWeight: '700' },
});
