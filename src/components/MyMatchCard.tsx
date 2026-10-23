import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { MyMatch } from '../data/myMatches';
import Theme from '../theme';
import MatchPlayerAvatar from './MatchPlayerAvatar';
import { formatSkillLevel } from './MatchCards';

export default function MyMatchCard({ item, onPress }: { item: MyMatch; onPress: () => void }) {
  const { match, players, role } = item;
  const { fontScale, width } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.3;
  const date = match.startsAt.toDate();
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(
    date,
  );
  const sport = match.sport === 'tennis' ? 'Tennis' : 'Pickleball';
  const spots = match.playersNeeded;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.matchName}, ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${time}, ${match.matchCourtLocation.name}, ${role === 'hosted' ? 'you’re hosting' : 'you’ve joined'}. View match details.`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.mainRow}>
        <View style={[styles.datePanel, compact && styles.compactDate]}>
          <Text style={styles.weekday}>
            {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
          </Text>
          <Text style={styles.day}>{date.getDate()}</Text>
          <Text style={styles.month}>{date.toLocaleDateString('en-US', { month: 'short' })}</Text>
          <View style={styles.dateDivider} />
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{match.matchName}</Text>
            <MaterialCommunityIcons name="arrow-top-right" size={19} color={Theme.PRIMARY} />
          </View>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={15}
              color={Theme.SUB_TEXT_COLOR}
            />
            <Text style={styles.location}>{match.matchCourtLocation.name}</Text>
          </View>
          <View style={styles.tags}>
            <View style={styles.sportLabel}>
              <MaterialCommunityIcons
                name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
                size={14}
                color={Theme.PRIMARY}
              />
              <Text style={styles.sportText}>{sport}</Text>
            </View>
            <View style={styles.skillBadge}>
              <Text style={styles.skillText}>{formatSkillLevel(match.skillLevel)}</Text>
            </View>
          </View>
          <View style={styles.roleRow}>
            <MaterialCommunityIcons
              name={role === 'hosted' ? 'account-star-outline' : 'check-circle-outline'}
              size={14}
              color={Theme.PRIMARY}
            />
            <Text style={styles.roleText}>
              {role === 'hosted' ? 'You’re hosting' : 'You’re playing'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.playersRow}>
          <View style={styles.avatars}>
            {players.map((player, index) => (
              <View
                key={player.id}
                style={{ marginLeft: index === 0 ? 0 : -9, zIndex: players.length - index }}
              >
                <MatchPlayerAvatar player={player} size={28} />
              </View>
            ))}
          </View>
          <Text style={styles.spots}>
            {spots > 0 ? `+${spots} ${spots === 1 ? 'spot' : 'spots'}` : 'All set!'}
          </Text>
        </View>
        <View style={styles.detailsLink}>
          <Text style={styles.detailsText}>View match</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color={Theme.PRIMARY} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.985 }], backgroundColor: '#F0F5F0' },
  mainRow: { flexDirection: 'row', gap: 12 },
  datePanel: {
    width: 62,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: Theme.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDate: { width: 58 },
  weekday: { color: Theme.ON_PRIMARY_MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 1.3 },
  day: {
    color: Theme.SURFACE,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  month: { color: Theme.ON_PRIMARY_MUTED, fontSize: 12, fontWeight: '600' },
  dateDivider: { height: 1, width: 22, backgroundColor: '#FFFFFF30', marginVertical: 5 },
  time: { color: Theme.SURFACE, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  copy: { flex: 1, minWidth: 0, paddingVertical: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: {
    flex: 1,
    color: Theme.PRIMARY,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  location: { flex: 1, color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  sportLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sportText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '600' },
  skillBadge: {
    borderRadius: 7,
    backgroundColor: Theme.PRIMARY_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  skillText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '700' },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '500' },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.PRIMARY_LIGHT,
    marginTop: 9,
    paddingTop: 8,
  },
  playersRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatars: { flexDirection: 'row' },
  spots: { color: Theme.SUB_TEXT_COLOR, fontSize: 11, fontWeight: '500' },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  detailsText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '700' },
});
