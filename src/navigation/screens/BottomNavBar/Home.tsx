import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompactMatchCard, UpcomingMatchCard } from '../../../components/MatchCards';
import { matchService } from '../../../services';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import Theme from '../../../theme';
import type { User } from '../../../types';
import { Section } from '../../../utils';

function NoUpcomingMatch({
  onFindMatch,
  onCreateMatch,
}: {
  onFindMatch: () => void;
  onCreateMatch: () => void;
}) {
  return (
    <View style={styles.emptyMatchCard}>
      <View style={styles.emptyMatchIcon}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={27} color={Theme.PRIMARY} />
      </View>
      <Text style={styles.emptyMatchTitle}>Ready to play?</Text>
      <Text style={styles.emptyMatchMessage}>Find a match nearby or create your own.</Text>
      <View style={styles.emptyMatchActions}>
        <Button
          compact
          mode="outlined"
          icon="map-search-outline"
          onPress={onFindMatch}
          textColor={Theme.PRIMARY}
          style={styles.emptyOutlinedButton}
        >
          Find a match
        </Button>
        <Button
          compact
          mode="contained"
          icon="plus"
          onPress={onCreateMatch}
          buttonColor={Theme.PRIMARY}
          textColor={Theme.SURFACE}
          style={styles.emptyContainedButton}
        >
          Create Match
        </Button>
      </View>
    </View>
  );
}

function NoNearbyMatches({
  onExploreMap,
  onCreateMatch,
}: {
  onExploreMap: () => void;
  onCreateMatch: () => void;
}) {
  return (
    <View style={styles.nearbyEmptyState}>
      <Text style={styles.nearbyEmptyTitle}>No matches nearby yet.</Text>
      <View style={styles.nearbyEmptyActions}>
        <Button compact mode="text" icon="map-search-outline" onPress={onExploreMap}>
          Explore Play Map
        </Button>
        <Button compact mode="text" icon="plus" onPress={onCreateMatch}>
          Create a Match
        </Button>
      </View>
    </View>
  );
}

export function Home() {
  const navigation = useNavigation();
  const authUser = authService.getCurrentUser();
  const currentUserId = authUser?.uid;

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['loadInitialUser', currentUserId],
    queryFn: () => userService.getUserById(currentUserId!),
    enabled: Boolean(currentUserId),
  });

  const {
    data: nearbyMatches = [],
    isLoading: areNearbyMatchesLoading,
    isError: areNearbyMatchesError,
    refetch: refetchNearbyMatches,
  } = useQuery({
    queryKey: ['getOpenMatches', currentUserId],
    queryFn: () => matchService.findMatches({ filter: { isOpenMatchesSearch: true }, size: 12 }),
    enabled: Boolean(currentUserId),
    select: (matches) =>
      matches
        .filter((match) => match.startsAt.toMillis() >= Date.now() && match.playersNeeded > 0)
        .sort((firstMatch, secondMatch) => {
          const firstDistance = firstMatch.matchCourtLocation.distanceMiles;
          const secondDistance = secondMatch.matchCourtLocation.distanceMiles;

          if (typeof firstDistance === 'number' && typeof secondDistance === 'number') {
            return firstDistance - secondDistance;
          }
          if (typeof firstDistance === 'number') return -1;
          if (typeof secondDistance === 'number') return 1;
          return firstMatch.startsAt.toMillis() - secondMatch.startsAt.toMillis();
        })
        .slice(0, 3),
  });

  const {
    data: upcomingMatch,
    isLoading: isUpcomingMatchLoading,
    isError: isUpcomingMatchError,
    refetch: refetchUpcomingMatch,
  } = useQuery({
    queryKey: ['upcomingMatch', currentUserId],
    queryFn: () => matchService.getUpcomingMatchForUser(currentUserId!),
    enabled: Boolean(currentUserId),
  });

  const userName = (user as User | null)?.username || authUser?.displayName || 'Player';
  const firstName = userName.trim().split(/\s+/)[0];
  const hasNotifications = false;

  const openMatchDetails = (matchId: string) => {
    navigation.navigate('MatchDetail', { matchId });
  };
  const openPlayMap = () => navigation.navigate('Home', { screen: 'FindMatches' });
  const openCreateMatch = () => navigation.navigate('CreateMatch');

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      {isUserLoading ? (
        <ActivityIndicator color={Theme.PRIMARY} />
      ) : (
        <ScrollView
          style={Theme.styles.scrollView}
          contentContainerStyle={Theme.styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <View style={styles.headerCopy}>
              <View style={styles.welcomeRow}>
                <Text style={[Theme.styles.screenHeader, styles.welcomeText]} numberOfLines={1}>
                  Welcome, {firstName}!
                </Text>
                <MaterialCommunityIcons name="hand-wave" size={22} color={Theme.PRIMARY} />
              </View>
              <Text style={[Theme.styles.subtext, styles.headerSubtitle]}>
                Take a moment to explore the app
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
              style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons
                name={hasNotifications ? 'bell-badge' : 'bell-outline'}
                size={24}
                color={hasNotifications ? Theme.ALERT : Theme.PRIMARY}
              />
            </Pressable>
          </View>

          <Section title="Upcoming Match" icon="calendar-clock">
            {isUpcomingMatchLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator color={Theme.PRIMARY} />
              </View>
            ) : isUpcomingMatchError ? (
              <View style={styles.loadError}>
                <Text style={styles.loadErrorText}>Couldn’t load your upcoming match.</Text>
                <Button compact mode="text" onPress={() => refetchUpcomingMatch()}>
                  Try again
                </Button>
              </View>
            ) : upcomingMatch ? (
              <UpcomingMatchCard
                match={upcomingMatch}
                onPress={() => openMatchDetails(upcomingMatch.id)}
              />
            ) : (
              <NoUpcomingMatch onFindMatch={openPlayMap} onCreateMatch={openCreateMatch} />
            )}
          </Section>

          <Section
            title="Matches Near You"
            icon="map-marker-radius-outline"
            headerAction={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all matches on the Play Map"
                hitSlop={8}
                onPress={openPlayMap}
                style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
              >
                <Text style={styles.inlineActionText}>See all</Text>
                <MaterialCommunityIcons name="arrow-right" size={15} color={Theme.PRIMARY} />
              </Pressable>
            }
          >
            {areNearbyMatchesLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator color={Theme.PRIMARY} />
              </View>
            ) : areNearbyMatchesError ? (
              <View style={styles.loadError}>
                <Text style={styles.loadErrorText}>Couldn’t load nearby matches.</Text>
                <Button compact mode="text" onPress={() => refetchNearbyMatches()}>
                  Try again
                </Button>
              </View>
            ) : nearbyMatches.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.nearbyMatchesScroll}
                contentContainerStyle={styles.nearbyMatchesRow}
              >
                {nearbyMatches.map((match) => (
                  <CompactMatchCard
                    key={match.id}
                    match={match}
                    onPress={() => openMatchDetails(match.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <NoNearbyMatches onExploreMap={openPlayMap} onCreateMatch={openCreateMatch} />
            )}
          </Section>

          <Section title="Quick Actions" icon="gesture-double-tap">
            <View style={styles.quickActionsMenu}>
              <View style={styles.quickActionsRow}>
                <Button
                  mode="contained"
                  icon={({ color }) => (
                    <MaterialCommunityIcons name="pencil-plus-outline" size={22} color={color} />
                  )}
                  onPress={openCreateMatch}
                  buttonColor={Theme.PRIMARY}
                  textColor={Theme.SURFACE}
                  style={styles.quickActionButton}
                  contentStyle={styles.quickActionContent}
                  labelStyle={styles.quickActionLabel}
                >
                  Create match
                </Button>
                <Button
                  mode="outlined"
                  icon={({ color }) => (
                    <MaterialCommunityIcons name="list-box-outline" size={22} color={color} />
                  )}
                  onPress={() => {}}
                  textColor={Theme.PRIMARY}
                  style={[styles.quickActionButton, styles.outlinedActionButton]}
                  contentStyle={styles.quickActionContent}
                  labelStyle={styles.quickActionLabel}
                >
                  My Matches
                </Button>
              </View>
              <Button
                mode="outlined"
                icon={({ color }) => (
                  <MaterialCommunityIcons name="map-search-outline" size={22} color={color} />
                )}
                onPress={openPlayMap}
                textColor={Theme.PRIMARY}
                style={styles.exploreMapActionButton}
                contentStyle={styles.quickActionContent}
                labelStyle={styles.quickActionLabel}
              >
                Explore On Map
              </Button>
            </View>
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  welcomeText: {
    flexShrink: 1,
    marginBottom: 2,
  },
  headerSubtitle: {
    marginBottom: 0,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: '#E4ECEC',
  },
  pressed: {
    opacity: 0.7,
  },
  sectionLoader: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
  },
  loadError: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadErrorText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
  },
  emptyMatchCard: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAEA',
    backgroundColor: Theme.SURFACE,
  },
  emptyMatchIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#EAF5F5',
  },
  emptyMatchTitle: {
    marginTop: 10,
    color: Theme.TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyMatchMessage: {
    marginTop: 4,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyMatchActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
  },
  emptyOutlinedButton: {
    flex: 1,
    borderColor: Theme.PRIMARY,
    borderRadius: 11,
  },
  emptyContainedButton: {
    flex: 1,
    borderRadius: 11,
  },
  quickActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  quickActionsMenu: {
    width: '100%',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
  },
  outlinedActionButton: {
    borderColor: Theme.PRIMARY,
  },
  exploreMapActionButton: {
    width: '100%',
    borderColor: Theme.PRIMARY,
    borderRadius: 12,
  },
  quickActionContent: {
    minHeight: 48,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inlineActionText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  nearbyMatchesScroll: {
    width: '100%',
  },
  nearbyMatchesRow: {
    gap: 10,
    paddingRight: 4,
  },
  nearbyEmptyState: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDEAEA',
    backgroundColor: Theme.SURFACE,
  },
  nearbyEmptyTitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  nearbyEmptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  mapCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 3,
  },
  mapCtaText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
});
