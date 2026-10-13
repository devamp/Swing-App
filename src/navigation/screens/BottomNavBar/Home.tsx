import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import SwingAlert from '../../../components/SwingAlert';
import {
  hasCoordinates,
  selectNearbyMatches,
  type SearchCenter,
} from '../../../services/matchService/nearbyMatches';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
  const { fontScale, width } = useWindowDimensions();
  return (
    <View style={styles.emptyMatchCard}>
      <View style={styles.emptyMatchIcon}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={27} color={Theme.PRIMARY} />
      </View>
      <Text style={styles.emptyMatchTitle}>Ready to play?</Text>
      <Text style={styles.emptyMatchMessage}>Find a match nearby or create your own.</Text>
      <View
        style={[
          styles.emptyMatchActions,
          (fontScale > 1.3 || width < 360) && styles.stackedActions,
        ]}
      >
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

export function Home() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { fontScale, width } = useWindowDimensions();
  const [locationOverride, setLocationOverride] = useState<SearchCenter | null>(null);
  const [radiusOverride, setRadiusOverride] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const authUser = authService.getCurrentUser();
  const currentUserId = authUser?.uid;

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['loadInitialUser', currentUserId],
    queryFn: () => userService.getUserById(currentUserId!),
    enabled: Boolean(currentUserId),
  });

  const preferences = (user as User | undefined)?.onboardingPreferences;
  const savedArea = preferences?.searchCriteria;
  const savedCenter =
    savedArea?.type === 'Current' && hasCoordinates(savedArea)
      ? {
          ...savedArea,
          label: `Saved location (${savedArea.latitude.toFixed(2)}, ${savedArea.longitude.toFixed(2)})`,
        }
      : null;
  const center = locationOverride ?? savedCenter;
  const radius = radiusOverride ?? preferences?.radiusMiles ?? 10;
  const isDiscoveryEnabled = Boolean(currentUserId && center);
  const {
    data: discoverableMatches = [],
    isLoading: areNearbyMatchesLoading,
    isError: areNearbyMatchesError,
    refetch: refetchNearbyMatches,
  } = useQuery({
    queryKey: ['dashboardDiscovery', currentUserId],
    queryFn: () => matchService.getDiscoverableMatches(),
    enabled: isDiscoveryEnabled,
  });

  useFocusEffect(
    useCallback(() => {
      if (!isDiscoveryEnabled) return;

      void refetchNearbyMatches();
      return matchService.subscribeToDiscoverableMatchChanges(
        () => {
          // Invalidate instead of writing snapshots over an in-flight query result.
          void queryClient.invalidateQueries({
            queryKey: ['dashboardDiscovery', currentUserId],
            exact: true,
          });
        },
        (error) => {
          console.warn('Could not sync nearby match changes', error);
          void refetchNearbyMatches();
        },
      );
    }, [currentUserId, isDiscoveryEnabled, queryClient, refetchNearbyMatches]),
  );

  const nearbyMatches =
    center && currentUserId
      ? selectNearbyMatches(discoverableMatches, center, radius, currentUserId).slice(0, 2)
      : [];

  const useCurrentLocation = async () => {
    setLocating(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setPermissionBlocked(!permission.canAskAgain && !permission.granted);
      if (!permission.granted) {
        setLocationError('Allow location access to search for matches near you.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocationOverride({ ...location.coords, label: 'Current location' });
    } catch {
      setLocationError('Couldn’t get your location. Check location services and try again.');
    } finally {
      setLocating(false);
    }
  };

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
  // No notification feed or unread-count source exists yet; do not fabricate a badge.

  const openMatchDetails = (matchId: string) => {
    navigation.navigate('MatchDetail', { matchId });
  };
  const openPlayMap = () => navigation.navigate('Home', { screen: 'FindMatches' });
  const openCreateMatch = () => navigation.navigate('CreateMatch');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={Theme.styles.appContainer}>
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
                <Text style={[Theme.styles.screenHeader, styles.welcomeText]}>
                  Welcome, {firstName}!
                </Text>
                <MaterialCommunityIcons name="hand-wave" size={22} color={Theme.PRIMARY} />
              </View>
              <Text style={[Theme.styles.subtext, styles.headerSubtitle]}>
                Ready for your next game?
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() =>
                SwingAlert.alert('Notifications', 'Notifications are not available yet.')
              }
              hitSlop={8}
              style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="bell-outline" size={24} color={Theme.PRIMARY} />
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

          <Section title="Quick Actions" icon="gesture-double-tap">
            <View
              style={[
                styles.quickActionsMenu,
                (fontScale > 1.3 || width < 360) && styles.stackedActions,
              ]}
            >
              {(
                [
                  ['Create Match', 'plus', openCreateMatch],
                  [
                    'My Matches',
                    'calendar-outline',
                    () =>
                      SwingAlert.alert(
                        'My Matches',
                        'Your match list is not available yet. Your next hosted match appears above.',
                      ),
                  ],
                  ['Explore Map', 'map-search-outline', openPlayMap],
                ] as const
              ).map(([label, icon, onPress]) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  onPress={onPress}
                  style={({ pressed }) => [styles.quickActionButton, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name={icon} size={22} color={Theme.PRIMARY} />
                  <Text style={styles.quickActionLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section
            title="Matches Near You"
            icon="map-marker-radius-outline"
            headerAction={
              nearbyMatches.length > 0 && !areNearbyMatchesError ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open match discovery"
                  hitSlop={8}
                  onPress={openPlayMap}
                  style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
                >
                  <Text style={styles.inlineActionText}>See all</Text>
                  <MaterialCommunityIcons name="arrow-right" size={15} color={Theme.PRIMARY} />
                </Pressable>
              ) : undefined
            }
          >
            {isUserError && !center ? (
              <View style={styles.nearbyEmptyState}>
                <Text style={styles.loadErrorText}>Couldn’t load your search area.</Text>
                <Button onPress={() => refetchUser()}>Try again</Button>
              </View>
            ) : locating || areNearbyMatchesLoading ? (
              <View style={styles.sectionLoader} accessibilityLiveRegion="polite">
                <ActivityIndicator color={Theme.PRIMARY} />
                <Text style={styles.searchArea}>
                  {locating ? 'Finding your location…' : 'Finding nearby matches…'}
                </Text>
              </View>
            ) : areNearbyMatchesError ? (
              <View style={styles.nearbyEmptyState}>
                <Text style={styles.loadErrorText}>Couldn’t load nearby matches.</Text>
                <Button mode="text" onPress={() => refetchNearbyMatches()}>
                  Try again
                </Button>
              </View>
            ) : nearbyMatches.length ? (
              <View style={styles.nearbyMatchesRow}>
                {nearbyMatches.map((match) => (
                  <CompactMatchCard
                    key={match.id}
                    match={match}
                    onPress={() => openMatchDetails(match.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyMatchCard}>
                <View style={styles.emptyMatchIcon}>
                  <MaterialCommunityIcons
                    name="map-search-outline"
                    size={27}
                    color={Theme.PRIMARY}
                    accessible={false}
                  />
                </View>
                <Text accessibilityRole="header" style={styles.emptyMatchTitle}>
                  No matches nearby yet
                </Text>
                <Text style={styles.emptyMatchMessage}>
                  Couldn't find any open matches nearby. Visit the Play Map to explore a greater
                  area.
                </Text>
              </View>
            )}
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
    width: 44,
    height: 44,
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
  quickActionsMenu: { width: '100%', flexDirection: 'row', gap: 8 },
  stackedActions: { flexDirection: 'column' },
  quickActionButton: {
    flex: 1,
    minHeight: 68,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAEA',
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: Theme.PRIMARY, textAlign: 'center' },
  searchArea: { fontSize: 13, color: Theme.SUB_TEXT_COLOR },
  inlineAction: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inlineActionText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  nearbyMatchesRow: {
    gap: 10,
    paddingRight: 4,
  },
  nearbyEmptyState: {
    width: '100%',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  nearbyEmptyTitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
});
