import type { StaticScreenProps } from '@react-navigation/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, Image, Platform, Pressable } from 'react-native';
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
      playTime: '12:30 PM',
      skillLevel: 'Casual',
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
      playTime: '2:30 PM',
      skillLevel: 'Advanced',
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
      playTime: '4:00 PM',
      skillLevel: 'Beginner',
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
      playTime: '9:00 AM',
      skillLevel: 'Intermediate',
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setMatchedPlayers(MOCK_MATCHES);
      setIsLoading(false);
    }, 1000);

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
      navigation.navigate('OnboardingPlayerDetails', { ...player });
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
          contentContainerStyle={Theme.styles.scrollContentContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View>
            <Text style={Theme.styles.screenHeader}>
              {sport === 'Both' ? 'Tennis and Pickleball players' : `${sport} players`} near
              {searchArea.type === 'Current' ? 'by' : ` ${searchArea.label}`}
            </Text>
            <Text style={Theme.styles.subtext}>
              Within {route.params.radiusMiles} miles - {route.params.skillLevel}
            </Text>
          </View>
          <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            <MapView
              ref={mapRef}
              style={{ width: '100%', height: 300 }}
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
              style={[styles.matchCard, selectedPlayerId === player.id && styles.selectedMatchCard]}
            >
              <View style={styles.logoContainer}>
                <Image source={require('../../../../assets/swing-logo.png')} style={styles.logo} />
              </View>

              <View style={styles.matchInfo}>
                <Text
                  style={[
                    styles.matchName,
                    selectedPlayerId === player.id && styles.selectedMatchCardText,
                  ]}
                >
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.matchDetails,
                    selectedPlayerId === player.id && styles.selectedMatchCardText,
                  ]}
                >
                  {player.sport} - {player.matchDetails.distance}
                </Text>
                <View style={styles.locationDetails}>
                  <MaterialCommunityIcons
                    name="map-marker-right-outline"
                    size={13}
                    color={selectedPlayerId === player.id ? Theme.SURFACE : Theme.PRIMARY}
                  />
                  <Text
                    style={[
                      styles.matchDetails,
                      styles.locationDetailsText,
                      selectedPlayerId === player.id && styles.selectedMatchCardText,
                    ]}
                  >
                    {player.matchDetails.locationName}
                  </Text>
                </View>
              </View>

              {selectedPlayerId === player.id && (
                <View style={styles.chevronContainer}>
                  <Text style={{ color: Theme.SURFACE, fontWeight: 600, fontSize: 14 }}>
                    Details
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={selectedPlayerId === player.id ? Theme.SURFACE : Theme.PRIMARY}
                  />
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  playerMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: Theme.PRIMARY,
    backgroundColor: Theme.SECONDARY,
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

  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 42,
    height: 42,
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  selectedMatchCard: {
    backgroundColor: Theme.PRIMARY,
  },

  selectedMatchCardText: {
    color: Theme.SURFACE,
  },

  matchInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 14,
    marginRight: 12,
  },

  matchName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: Theme.TEXT,
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

  locationDetailsText: {
    flex: 1,
    fontSize: 12,
  },

  chevronContainer: {
    width: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
