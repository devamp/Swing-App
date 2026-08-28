import type { StaticScreenProps } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import Theme from '../../../theme';
import { useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PlayerSearchLoader from '../../../components/PlayerSearchLoader';
import type {
  OnboardingMatchedPlayerDetails,
  OnboardingMatchPreferencesParams,
} from './OnboardingFlowTypes';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { getPlayerInitials } from '../../../utils';

export type OnboardingMatchedPlayersParams = OnboardingMatchPreferencesParams;

type OnboardingMatchedPlayersProps = StaticScreenProps<OnboardingMatchedPlayersParams>;

type MatchedPlayer = OnboardingMatchedPlayerDetails;

const MOCK_MATCHES: MatchedPlayer[] = [
  {
    id: '1',
    name: 'Alex Chen',
    sport: 'Tennis',
    matchDetails: {
      numPlayers: 2,
      distance: '2.2 mi away',
      latitude: 45.40348,
      longitude: -122.7656,
      locationName: 'Portland Tennis Center',
      playDate: 'Today',
      playTime: '12:30 PM',
      skillLevel: 'Casual',
      gameType: 'Singles',
      courtType: 'Indoor',
      playerStatus: 'Confirmed',
    },
  },
  {
    id: '2',
    name: 'Maya Patel',
    sport: 'Pickleball',
    matchDetails: {
      numPlayers: 1,
      distance: '2.6 mi away',
      latitude: 45.3716,
      longitude: -122.71205,
      locationName: 'Chase State Park',
      playDate: 'Tomorrow',
      playTime: '2:30 PM',
      skillLevel: 'Advanced',
      gameType: 'Doubles',
      courtType: 'Outdoor',
      playerStatus: 'Confirmed',
    },
  },
  {
    id: '3',
    name: 'Jordan Lee',
    sport: 'Tennis',
    matchDetails: {
      numPlayers: 4,
      distance: '3.0 mi away',
      latitude: 45.34117,
      longitude: -122.80885,
      locationName: 'Irving Public Park',
      playDate: 'Sat, Aug 15',
      playTime: '4:00 PM',
      skillLevel: 'Beginner',
      gameType: 'Open Play',
      courtType: 'Outdoor',
      playerStatus: 'Confirmed',
    },
  },
  {
    id: '4',
    name: 'Devam Patel',
    sport: 'Tennis',
    matchDetails: {
      numPlayers: 3,
      distance: '3.8 mi away',
      latitude: 45.33537,
      longitude: -122.70793,
      locationName: 'Tualatin Hills Tennis Center',
      playDate: 'Sun, Aug 16',
      playTime: '9:00 AM',
      skillLevel: 'Intermediate',
      gameType: 'Doubles',
      courtType: 'Indoor',
      playerStatus: 'Confirmed',
    },
  },
];

const MINIMUM_MAP_DELTA = 0.05;
const MAP_PADDING_MULTIPLIER = 1.3;

function getInitialMapRegion(
  players: MatchedPlayer[],
  fallbackCenter: Pick<Region, 'latitude' | 'longitude'>,
): Region {
  const playerLocations = players.flatMap((player) =>
    typeof player.matchDetails.latitude === 'number' &&
    Number.isFinite(player.matchDetails.latitude) &&
    typeof player.matchDetails.longitude === 'number' &&
    Number.isFinite(player.matchDetails.longitude)
      ? [{ latitude: player.matchDetails.latitude, longitude: player.matchDetails.longitude }]
      : [],
  );

  if (!playerLocations.length) {
    return {
      ...fallbackCenter,
      latitudeDelta: MINIMUM_MAP_DELTA,
      longitudeDelta: MINIMUM_MAP_DELTA,
    };
  }

  const latitude =
    playerLocations.reduce((total, location) => total + location.latitude, 0) /
    playerLocations.length;
  const longitude =
    playerLocations.reduce((total, location) => total + location.longitude, 0) /
    playerLocations.length;

  const latitudeDelta =
    Math.max(...playerLocations.map((location) => Math.abs(location.latitude - latitude))) *
    2 *
    MAP_PADDING_MULTIPLIER;
  const longitudeDelta =
    Math.max(...playerLocations.map((location) => Math.abs(location.longitude - longitude))) *
    2 *
    MAP_PADDING_MULTIPLIER;

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(latitudeDelta, MINIMUM_MAP_DELTA),
    longitudeDelta: Math.max(longitudeDelta, MINIMUM_MAP_DELTA),
  };
}

export function OnboardingMatchedPlayers({ route }: OnboardingMatchedPlayersProps) {
  const sport = route.params.selectedSport;
  const searchArea = route.params.searchCriteria;
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchedPlayers, setMatchedPlayers] = useState<MatchedPlayer[]>(MOCK_MATCHES);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const params = {
    ...route.params,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMatchedPlayers(MOCK_MATCHES);
      setIsLoading(false);
    }, 2500);

    const matches = MOCK_MATCHES;

    // if (!matches.length) {
    //   navigation.navigate('OnboardingMatchNotFound', route);
    // }

    return () => clearTimeout(timer);
  }, []);

  const mapCenter =
    searchArea.type === 'Current' && searchArea.latitude != null && searchArea.longitude != null
      ? {
          latitude: searchArea.latitude,
          longitude: searchArea.longitude,
        }
      : { latitude: 45.51512, longitude: -122.67948 };
  const initialMapRegion = getInitialMapRegion(matchedPlayers, mapCenter);

  const selectPlayer = (player: MatchedPlayer) => {
    const coordinate = {
      latitude: player.matchDetails.latitude ?? mapCenter.latitude,
      longitude: player.matchDetails.longitude ?? mapCenter.longitude,
    };

    setSelectedPlayerId(player.id);
    mapRef.current?.animateCamera({ center: coordinate }, { duration: 350 });
  };

  const handleMatchCardPress = (player: MatchedPlayer) => {
    if (selectedPlayerId === player.id) {
      navigation.navigate('OnboardingPlayerDetails', { ...params, ...player });
      return;
    }

    selectPlayer(player);
  };

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <PlayerSearchLoader />
        </View>
      ) : (
        <ScrollView
          style={Theme.styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={Theme.styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.TEXT} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.resultBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.resultBadgeText}>{matchedPlayers.length} matches found</Text>
            </View>
            <Text style={styles.screenTitle}>
              Matches near {searchArea.type === 'Current' ? 'you' : searchArea.label}
            </Text>
            <Text style={styles.screenSubtitle}>
              Pick a match to preview it on the map, then view the details when you're ready.
            </Text>
            <View style={styles.filterRow}>
              <View style={styles.filterPill}>
                <MaterialCommunityIcons
                  name={sport === 'Pickleball' ? 'table-tennis' : 'tennis'}
                  size={15}
                  color={Theme.PRIMARY}
                />
                <Text style={styles.filterText}>{sport}</Text>
              </View>
              <View style={styles.filterPill}>
                <MaterialCommunityIcons name="trending-up" size={15} color={Theme.PRIMARY} />
                <Text style={styles.filterText}>{route.params.skillLevel}</Text>
              </View>
              <View style={styles.filterPill}>
                <MaterialCommunityIcons name="map-marker-radius" size={15} color={Theme.PRIMARY} />
                <Text style={styles.filterText}>{route.params.radiusMiles} mi</Text>
              </View>
            </View>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialMapRegion}
              showsUserLocation={true}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              loadingEnabled
              loadingIndicatorColor={Theme.PRIMARY}
            >
              {matchedPlayers.map((player) => (
                <Marker
                  key={player.id}
                  coordinate={{
                    latitude: player.matchDetails.latitude ?? mapCenter.latitude,
                    longitude: player.matchDetails.longitude ?? mapCenter.longitude,
                  }}
                  title={player.name}
                  description={`${player.sport} - ${player.matchDetails.distance}`}
                  onPress={() => selectPlayer(player)}
                  zIndex={selectedPlayerId === player.id ? 1 : 0}
                >
                  <View
                    style={[
                      styles.playerMarker,
                      selectedPlayerId === player.id && styles.selectedPlayerMarker,
                    ]}
                  >
                    <Text
                      style={[
                        styles.playerMarkerText,
                        selectedPlayerId === player.id && styles.selectedPlayerMarkerText,
                      ]}
                    >
                      {getPlayerInitials(player.name)}
                    </Text>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Available matches</Text>
            <Text style={styles.listHint}>Tap twice for details</Text>
          </View>

          {matchedPlayers.map((player) => (
            <Pressable
              key={player.id}
              onPress={() => handleMatchCardPress(player)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPlayerId === player.id }}
              accessibilityLabel={
                selectedPlayerId === player.id
                  ? `View details for ${player.name}`
                  : `Select ${player.name}`
              }
              style={({ pressed }) => [
                styles.matchCard,
                selectedPlayerId === player.id && styles.selectedMatchCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View
                style={[
                  styles.playerAvatar,
                  selectedPlayerId === player.id && styles.selectedPlayerAvatar,
                ]}
              >
                <Text
                  style={[
                    styles.playerAvatarText,
                    selectedPlayerId === player.id && styles.selectedPlayerAvatarText,
                  ]}
                >
                  {getPlayerInitials(player.name)}
                </Text>
              </View>

              <View style={styles.matchInfo}>
                <View style={styles.cardTopRow}>
                  <View style={styles.sportBadge}>
                    <MaterialCommunityIcons
                      name={player.sport === 'Tennis' ? 'tennis' : 'table-tennis'}
                      size={13}
                      color={Theme.PRIMARY}
                    />
                    <Text style={styles.sportBadgeText}>{player.sport}</Text>
                  </View>
                  <Text style={styles.distanceText}>{player.matchDetails.distance}</Text>
                </View>

                <Text style={styles.venueName} numberOfLines={1}>
                  {player.matchDetails.locationName ?? 'Location shared later'}
                </Text>

                <View style={styles.locationDetails}>
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={14}
                    color={Theme.PRIMARY}
                  />
                  <Text style={styles.matchDetails}>{player.matchDetails.playDate ?? 'Today'}</Text>
                  <View style={styles.metaDot} />
                  <MaterialCommunityIcons name="clock-outline" size={14} color={Theme.PRIMARY} />
                  <Text style={styles.matchDetails}>
                    {player.matchDetails.playTime ?? 'Time TBD'}
                  </Text>
                </View>

                <View style={styles.hostRow}>
                  <Text style={styles.hostText}>Hosted by {player.name}</Text>
                  <View style={styles.skillPill}>
                    <Text style={styles.skillText}>{player.matchDetails.skillLevel}</Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.chevronContainer,
                  selectedPlayerId === player.id && styles.selectedChevronContainer,
                ]}
              >
                <MaterialCommunityIcons
                  name={selectedPlayerId === player.id ? 'arrow-right' : 'chevron-right'}
                  size={20}
                  color={selectedPlayerId === player.id ? Theme.SURFACE : Theme.PRIMARY}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  hero: {
    marginTop: 14,
    marginBottom: 18,
  },
  resultBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F6F0',
    marginBottom: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#29966F',
  },
  resultBadgeText: {
    color: '#247A5C',
    fontSize: 12,
    fontWeight: '700',
  },
  screenTitle: {
    color: Theme.TEXT,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EAF5F5',
  },
  filterText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4ECEC',
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Theme.TEXT,
    fontSize: 19,
    fontWeight: '800',
  },
  listHint: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
  },
  playerMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: Theme.SURFACE,
    backgroundColor: '#DCECEC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },

  selectedPlayerMarker: {
    borderColor: Theme.SURFACE,
    backgroundColor: Theme.PRIMARY,
  },

  playerMarkerText: {
    color: Theme.PRIMARY,
    fontSize: 14,
    fontWeight: '800',
  },

  selectedPlayerMarkerText: {
    color: Theme.SURFACE,
  },

  playerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  selectedPlayerAvatar: {
    backgroundColor: Theme.PRIMARY,
  },
  playerAvatarText: {
    color: Theme.PRIMARY,
    fontSize: 14,
    fontWeight: '800',
  },
  selectedPlayerAvatarText: {
    color: Theme.SURFACE,
  },

  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '500',
  },

  matchCard: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4ECEC',
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  selectedMatchCard: {
    backgroundColor: '#F0F8F8',
    borderColor: Theme.PRIMARY,
    borderWidth: 2,
    padding: 14,
  },
  pressedCard: {
    opacity: 0.75,
  },

  matchInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 7,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EAF5F5',
  },
  sportBadgeText: {
    color: Theme.PRIMARY,
    fontSize: 11,
    fontWeight: '700',
  },
  distanceText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 11,
    fontWeight: '600',
  },
  venueName: {
    color: Theme.TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },

  matchDetails: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 20,
  },

  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9AA4A4',
    marginHorizontal: 2,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  hostText: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
  },
  skillPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0F8F8',
  },
  skillText: {
    color: Theme.PRIMARY,
    fontSize: 10,
    fontWeight: '700',
  },

  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#EAF5F5',
  },
  selectedChevronContainer: {
    backgroundColor: Theme.PRIMARY,
  },
});
