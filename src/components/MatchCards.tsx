import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { FoundMatch } from '../services/matchService/types';
import Theme from '../theme';
import UpcomingMatchArtwork from './UpcomingMatchArtwork';
import { authService } from '../services';

type MatchCardProps = {
  match: FoundMatch;
  onPress: () => void;
};

// Only the displayed fields are required, so drafts can share the exact same card.
type UpcomingMatchCardData = Pick<
  FoundMatch,
  'matchName' | 'playersNeeded' | 'skillLevel' | 'userId'
> & {
  sport: FoundMatch['sport'] | null;
  gameType: string | null;
  startsAt: { toDate: () => Date } | null;
  matchCourtLocation: Pick<FoundMatch['matchCourtLocation'], 'name'>;
};

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function formatSkillLevel(skillLevel: FoundMatch['skillLevel']) {
  return skillLevel === 'any' ? 'Any skill level' : capitalize(skillLevel);
}

export function getRelativeDateLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const matchDay = new Date(date);
  matchDay.setHours(0, 0, 0, 0);
  const daysAway = Math.round((matchDay.getTime() - today.getTime()) / 86_400_000);

  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function UpcomingMatchCard({
  match,
  onPress,
  dateTimeLabel,
}: {
  match: UpcomingMatchCardData;
  onPress?: () => void;
  dateTimeLabel?: string;
}) {
  const { fontScale } = useWindowDimensions();
  const startDate = match.startsAt?.toDate();
  const month = startDate
    ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate).toUpperCase()
    : 'DATE';
  const day = startDate
    ? new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(startDate)
    : '–';
  const startTime = startDate
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(startDate)
    : 'Choose time';
  const dateTime =
    dateTimeLabel ??
    (startDate ? `${getRelativeDateLabel(startDate)} · ${startTime}` : 'Choose date & time');
  const sportLabel = match.sport
    ? match.sport === 'tennis'
      ? 'Tennis'
      : 'Pickleball'
    : 'Choose a sport';
  const spots = Math.max(0, match.playersNeeded);
  const playersNeededLabel =
    spots > 0 ? `${spots} ${spots === 1 ? 'spot' : 'spots'} open` : 'Match full';
  const hostId = match.userId;
  const userId = authService.getCurrentUser()?.uid;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${onPress ? 'View upcoming match' : 'Match preview'} ${match.matchName}, ${sportLabel}, ${dateTime}, ${formatSkillLevel(match.skillLevel)}, ${match.matchCourtLocation.name}, ${hostId === userId ? 'hosting, ' : ''}${playersNeededLabel}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.upcomingMatchCard, pressed && styles.pressed]}
    >
      <View style={styles.matchCardTopRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>

        <View style={styles.matchSummary}>
          <Text style={styles.headerSport}>{sportLabel}</Text>
          {match.gameType ? <Text style={styles.headerGameType}>{match.gameType}</Text> : null}
          {hostId === userId ? (
            <View style={styles.hostingBadge}>
              <MaterialCommunityIcons
                name="account-star"
                size={12}
                color={Theme.ON_PRIMARY_MUTED}
              />
              <Text style={styles.hostingText}>Hosting</Text>
            </View>
          ) : null}
        </View>
        {fontScale < 1.3 && match.sport ? <UpcomingMatchArtwork sport={match.sport} /> : null}
      </View>

      <View style={styles.upcomingBody}>
        <Text style={styles.matchTitle} numberOfLines={2}>
          {match.matchName}
        </Text>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="clock-outline" size={17} color={Theme.PRIMARY} />
          <Text style={styles.detailText}>
            {dateTime} · {formatSkillLevel(match.skillLevel)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={17} color={Theme.PRIMARY} />
          <Text style={styles.detailText} numberOfLines={2}>
            {match.matchCourtLocation.name}
          </Text>
        </View>
        <View style={styles.upcomingFooter}>
          <View style={styles.openSpotsBadge}>
            <Text style={styles.openSpotsText}>{playersNeededLabel}</Text>
          </View>
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>View details</Text>
            <MaterialCommunityIcons name="arrow-right" size={15} color={Theme.PRIMARY} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function CompactMatchCard({ match, onPress }: MatchCardProps) {
  const startDate = match.startsAt.toDate();
  const startTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(startDate);
  const sportLabel = match.sport === 'tennis' ? 'Tennis' : 'Pickleball';
  const distance = match.matchCourtLocation.distanceMiles;
  const spotsLabel = `${match.playersNeeded} ${match.playersNeeded === 1 ? 'spot' : 'spots'} left`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${sportLabel} ${match.gameType} match at ${match.matchCourtLocation.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
    >
      <View style={styles.compactTopRow}>
        <View style={styles.sportIcon}>
          <MaterialCommunityIcons
            name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
            size={21}
            color={Theme.PRIMARY}
          />
        </View>
        <View style={styles.compactHeading}>
          <Text style={styles.compactTitle}>
            {match.matchName} · {sportLabel}
          </Text>
          <Text style={styles.skillText}>{formatSkillLevel(match.skillLevel)}</Text>
        </View>
      </View>

      <Text style={styles.compactDateTime}>
        {getRelativeDateLabel(startDate)} · {startTime}
      </Text>
      <View style={styles.compactLocationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={Theme.PRIMARY} />
        <Text style={styles.compactLocation}>
          {match.matchCourtLocation.name}
          {typeof distance === 'number' ? ` · ${distance.toFixed(1)} mi` : ''}
        </Text>
      </View>
      <Text style={styles.spotsText}>{spotsLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
  },
  upcomingMatchCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  matchCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Theme.PRIMARY,
  },
  headerSport: { color: Theme.SURFACE, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  headerGameType: { color: Theme.ON_PRIMARY_MUTED, fontSize: 11, lineHeight: 16, marginTop: 2 },
  upcomingBody: { paddingHorizontal: 14, paddingVertical: 12 },
  upcomingFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  openSpotsBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  openSpotsText: { color: Theme.PRIMARY, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  dateBadge: {
    width: 52,
    minHeight: 58,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  dateMonth: {
    color: Theme.PRIMARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dateDay: {
    color: Theme.PRIMARY,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 27,
  },
  matchSummary: {
    flex: 1,
    minWidth: 0,
  },
  matchTitle: {
    flexShrink: 1,
    color: Theme.TEXT,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 8,
  },
  hostingBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF1A',
  },
  hostingText: {
    color: Theme.ON_PRIMARY_MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewDetailsText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  compactCard: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sportIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  compactHeading: {
    flex: 1,
  },
  compactTitle: {
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  skillText: {
    marginTop: 2,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 11,
    fontWeight: '600',
  },
  compactDateTime: {
    marginTop: 11,
    color: Theme.TEXT,
    fontSize: 13,
    fontWeight: '700',
  },
  compactLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  compactLocation: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
  },
  spotsText: {
    marginTop: 9,
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
});
