import type { StaticScreenProps } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import Theme from '../../../theme';
import { useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PlayerSearchLoader from '../../../components/PlayerSearchLoader';
import type {
  OnboardingMatchedPlayerDetails,
  OnboardingMatchPreferencesParams,
} from './OnboardingFlowTypes';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { getPlayerInitials } from '../../../utils';
import { useQuery } from '@tanstack/react-query';
import { matchService } from '../../../services';
import type { DBMatch } from '../../../services/matchService/types';

export type OnboardingMatchedPlayersParams = OnboardingMatchPreferencesParams;

type OnboardingMatchedPlayersProps = StaticScreenProps<OnboardingMatchedPlayersParams>;

const MINIMUM_MAP_DELTA = 0.05;
const MAP_PADDING_MULTIPLIER = 1.3;

function getInitialMapRegion(
  matches: DBMatch[],
  fallbackCenter: Pick<Region, 'latitude' | 'longitude'>,
): Region {
  const playerLocations = matches.flatMap((match) => {
    const coordinate = getMatchCoordinate(match);
    return coordinate ? [coordinate] : [];
  });

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

function getMatchCoordinate(match: DBMatch): Pick<Region, 'latitude' | 'longitude'> | null {
  const latitude =
    match.matchCourtLocation.courtLocation?.latitude ?? match.matchCourtLocation.latitude;
  const longitude =
    match.matchCourtLocation.courtLocation?.longitude ?? match.matchCourtLocation.longitude;

  return typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

function getMatchId(match: DBMatch) {
  return `${match.userId}-${match.startsAt.seconds}-${match.startsAt.nanoseconds}`;
}

function getSportLabel(match: DBMatch): OnboardingMatchedPlayerDetails['sport'] {
  return match.sport === 'tennis' ? 'Tennis' : 'Pickleball';
}

function getSkillLevelLabel(
  match: DBMatch,
): OnboardingMatchedPlayerDetails['matchDetails']['skillLevel'] {
  if (match.skillLevel === 'any') return 'Casual';
  return `${match.skillLevel.charAt(0).toUpperCase()}${match.skillLevel.slice(1)}` as OnboardingMatchedPlayerDetails['matchDetails']['skillLevel'];
}

function getDistanceLabel(match: DBMatch) {
  const distance = match.matchCourtLocation.distanceMiles;
  return distance == null ? 'Distance unavailable' : `${distance.toFixed(1)} mi away`;
}

function getStartLabels(match: DBMatch) {
  const startsAt = match.startsAt.toDate();
  return {
    date: startsAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: startsAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function toPlayerDetails(
  match: DBMatch,
  fallbackCenter: Pick<Region, 'latitude' | 'longitude'>,
): OnboardingMatchedPlayerDetails {
  const coordinate = getMatchCoordinate(match) ?? fallbackCenter;
  const startsAt = getStartLabels(match);
  const courtType = match.matchCourtLocation.courtType;

  return {
    id: getMatchId(match),
    name: match.userId,
    sport: getSportLabel(match),
    matchDetails: {
      ...coordinate,
      distance: getDistanceLabel(match),
      gameType: match.gameType as OnboardingMatchedPlayerDetails['matchDetails']['gameType'],
      locationName: match.matchCourtLocation.name,
      numPlayers: match.playersNeeded,
      playDate: startsAt.date,
      playTime: startsAt.time,
      skillLevel: getSkillLevelLabel(match),
      courtType:
        courtType === 'public_indoor'
          ? 'Indoor'
          : courtType === 'public_outdoor'
            ? 'Outdoor'
            : undefined,
    },
  };
}

export function OnboardingMatchedPlayers({ route }: OnboardingMatchedPlayersProps) {
  const sport = route.params.selectedSport;
  const searchArea = route.params.searchCriteria;
  const navigation = useNavigation();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const params = {
    ...route.params,
  };

  const { data: matches = [], isLoading } = useQuery<DBMatch[]>({
    queryKey: ['findNearbyMatches'],
    queryFn: async () => {
      const matches = await matchService.findMatches();
      console.log(matches);

      if (!matches.length) {
        navigation.navigate('OnboardingMatchNotFound', route.params);
      }

      return matches;
    },
  });

  const mapCenter =
    searchArea.type === 'Current' && searchArea.latitude != null && searchArea.longitude != null
      ? {
          latitude: searchArea.latitude,
          longitude: searchArea.longitude,
        }
      : { latitude: 45.51512, longitude: -122.67948 };
  const initialMapRegion = getInitialMapRegion(matches, mapCenter);

  const selectMatch = (match: DBMatch) => {
    const coordinate = getMatchCoordinate(match) ?? mapCenter;

    setSelectedMatchId(getMatchId(match));
    mapRef.current?.animateCamera({ center: coordinate }, { duration: 350 });
  };

  const handleMatchCardPress = (match: DBMatch) => {
    if (selectedMatchId === getMatchId(match)) {
      navigation.navigate('OnboardingPlayerDetails', {
        ...params,
        ...toPlayerDetails(match, mapCenter),
      });
      return;
    }

    selectMatch(match);
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
              <Text style={styles.resultBadgeText}>{matches.length} matches found</Text>
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
              {matches.map((match) => {
                const matchId = getMatchId(match);
                const coordinate = getMatchCoordinate(match) ?? mapCenter;
                const sportLabel = getSportLabel(match);

                return (
                  <Marker
                    key={matchId}
                    coordinate={coordinate}
                    title={match.matchCourtLocation.name}
                    description={`${sportLabel} - ${getDistanceLabel(match)}`}
                    onPress={() => selectMatch(match)}
                    zIndex={selectedMatchId === matchId ? 1 : 0}
                  >
                    <View
                      style={[
                        styles.playerMarker,
                        selectedMatchId === matchId && styles.selectedPlayerMarker,
                      ]}
                    >
                      <Text
                        style={[
                          styles.playerMarkerText,
                          selectedMatchId === matchId && styles.selectedPlayerMarkerText,
                        ]}
                      >
                        {getPlayerInitials(match.userId)}
                      </Text>
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Available matches</Text>
            <Text style={styles.listHint}>Tap twice for details</Text>
          </View>

          {matches.map((match) => {
            const matchId = getMatchId(match);
            const isSelected = selectedMatchId === matchId;
            const sportLabel = getSportLabel(match);
            const startsAt = getStartLabels(match);

            return (
              <Pressable
                key={matchId}
                onPress={() => handleMatchCardPress(match)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={
                  isSelected
                    ? `View details for the match at ${match.matchCourtLocation.name}`
                    : `Select the match at ${match.matchCourtLocation.name}`
                }
                style={({ pressed }) => [
                  styles.matchCard,
                  isSelected && styles.selectedMatchCard,
                  pressed && styles.pressedCard,
                ]}
              >
                <View style={[styles.playerAvatar, isSelected && styles.selectedPlayerAvatar]}>
                  <Text
                    style={[styles.playerAvatarText, isSelected && styles.selectedPlayerAvatarText]}
                  >
                    {getPlayerInitials(match.userId)}
                  </Text>
                </View>

                <View style={styles.matchInfo}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.sportBadge}>
                      <MaterialCommunityIcons
                        name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
                        size={13}
                        color={Theme.PRIMARY}
                      />
                      <Text style={styles.sportBadgeText}>{sportLabel}</Text>
                    </View>
                    <Text style={styles.distanceText}>{getDistanceLabel(match)}</Text>
                  </View>

                  <Text style={styles.venueName} numberOfLines={1}>
                    {match.matchCourtLocation.name || 'Location shared later'}
                  </Text>

                  <View style={styles.locationDetails}>
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={14}
                      color={Theme.PRIMARY}
                    />
                    <Text style={styles.matchDetails}>{startsAt.date}</Text>
                    <View style={styles.metaDot} />
                    <MaterialCommunityIcons name="clock-outline" size={14} color={Theme.PRIMARY} />
                    <Text style={styles.matchDetails}>{startsAt.time}</Text>
                  </View>

                  <View style={styles.hostRow}>
                    <Text style={styles.hostText}>{match.playersNeeded} players needed</Text>
                    <View style={styles.skillPill}>
                      <Text style={styles.skillText}>{getSkillLevelLabel(match)}</Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[styles.chevronContainer, isSelected && styles.selectedChevronContainer]}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'arrow-right' : 'chevron-right'}
                    size={20}
                    color={isSelected ? Theme.SURFACE : Theme.PRIMARY}
                  />
                </View>
              </Pressable>
            );
          })}
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
