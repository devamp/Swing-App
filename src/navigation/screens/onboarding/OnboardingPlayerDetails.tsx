import type { StaticScreenProps } from '@react-navigation/core';
import { View, Text, StyleSheet, ScrollView, Image, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OnboardingMatchedPlayerDetails } from './OnboardingFlowTypes';
import MapView, { Marker, Region } from 'react-native-maps';
import { getPlayerInitials } from '../../../utils';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import MapViewDirections from 'react-native-maps-directions';
import { Button } from 'react-native-paper';

export type OnboardingPlayerDetailsParams = OnboardingMatchedPlayerDetails;

type OnboardingPlayerDetailsProps = StaticScreenProps<OnboardingPlayerDetailsParams>;

type MapCoordinate = Pick<Region, 'latitude' | 'longitude'>;

const MAP_PADDING_MULTIPLIER = 1.4;

function getVisibleRegion(initialRegion: Region, userLocation: MapCoordinate | null): Region {
  if (!userLocation) {
    return initialRegion;
  }

  const latitudeDistance = Math.abs(initialRegion.latitude - userLocation.latitude);
  const longitudeDistance = Math.abs(initialRegion.longitude - userLocation.longitude);

  return {
    latitude: (initialRegion.latitude + userLocation.latitude) / 2,
    longitude: (initialRegion.longitude + userLocation.longitude) / 2,
    latitudeDelta: Math.max(initialRegion.latitudeDelta, latitudeDistance * MAP_PADDING_MULTIPLIER),
    longitudeDelta: Math.max(
      initialRegion.longitudeDelta,
      longitudeDistance * MAP_PADDING_MULTIPLIER,
    ),
  };
}

const matchDetailsRow = (data: any) => {
  return (
    <View style={styles.matchDetailsLocationContainer}>
      <MaterialCommunityIcons name={data.iconName} size={20} color={Theme.PRIMARY} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>{data.value}</Text>
    </View>
  );
};

export function OnboardingPlayerDetails(props: OnboardingPlayerDetailsProps) {
  const { id, name, sport, matchDetails } = props.route.params;
  const { distance, latitude, longitude, locationName, playTime, numPlayers, skillLevel } =
    matchDetails;
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);

  const initialRegion: Region = {
    latitude: latitude ?? 45.51512,
    longitude: longitude ?? -122.67948,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const visibleRegion = getVisibleRegion(initialRegion, userLocation);

  useEffect(() => {
    let isMounted = true;
    let locationSubscription: Location.LocationSubscription | undefined;

    const watchUserLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
        },
        ({ coords }) => {
          if (isMounted) {
            setUserLocation({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
          }
        },
      );

      if (!isMounted) {
        locationSubscription.remove();
      }
    };

    void watchUserLocation();

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, []);

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={Theme.styles.scrollContentContainer}
        showsHorizontalScrollIndicator={false}
      >
        <View>
          <Text style={Theme.styles.screenHeader}>{name}'s Match Details</Text>
          <Text style={Theme.styles.subtext}>Some secondary text here to add later.</Text>
        </View>

        <View style={styles.matchDetailsContainer}>
          <View style={styles.matchDetailsLocationContainer}>
            <MaterialCommunityIcons
              name="map-marker-right-outline"
              size={20}
              color={Theme.PRIMARY}
            />
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>
              {locationName}
            </Text>
          </View>

          <View style={styles.matchDetailsLocationContainer}>
            <MaterialCommunityIcons name="tennis" size={20} color={Theme.PRIMARY} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>
              {sport} @ {playTime}
            </Text>
          </View>

          <View style={styles.matchDetailsLocationContainer}>
            <MaterialCommunityIcons name="account" size={20} color={Theme.PRIMARY} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>
              {numPlayers}
            </Text>
          </View>

          <View style={styles.matchDetailsLocationContainer}>
            <MaterialCommunityIcons name="trending-up" size={20} color={Theme.PRIMARY} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>
              {skillLevel}
            </Text>
          </View>

          <View style={styles.matchDetailsLocationContainer}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.PRIMARY }}>
              {distance}
            </Text>
          </View>
        </View>

        <View style={{ borderRadius: 12, overflow: 'hidden' }}>
          <MapView
            style={{ width: '100%', height: 200 }}
            region={visibleRegion}
            showsUserLocation={true}
            loadingEnabled
            loadingIndicatorColor={Theme.PRIMARY}
          >
            <Marker
              key={id}
              coordinate={{
                latitude: initialRegion.latitude,
                longitude: initialRegion.longitude,
              }}
              title={name}
              description={`${sport} - ${distance}`}
            >
              <View style={styles.playerMarker}>
                <Text style={styles.playerMarkerText}>{getPlayerInitials(name)}</Text>
              </View>
            </Marker>
          </MapView>
        </View>

        <Button
          icon="camera"
          mode="contained"
          buttonColor={Theme.PRIMARY}
          textColor={Theme.SURFACE}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
          onPress={() => console.log('Pressed')}
        >
          Press me
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 16,
  },

  primaryButtonContent: {
    minHeight: 52,
  },

  primaryButtonLabel: {
    color: Theme.SURFACE,
    fontSize: 16,
    fontWeight: '700',
  },

  matchDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },

  matchDetailsLocationContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },

  playerMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: Theme.SURFACE,
    backgroundColor: Theme.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },

  playerMarkerText: {
    color: Theme.SURFACE,
    fontSize: 14,
    fontWeight: '800',
  },
});
