import type { StaticScreenProps } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Button, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../../theme';
import { getPlayerInitials } from '../../../utils';
import type { OnboardingMatchedPlayerDetails } from './OnboardingFlowTypes';
import { OnboardingMatchedPlayersParams } from './OnboardingFoundMatches';

export type OnboardingPlayerDetailsParams = OnboardingMatchedPlayerDetails;

type OnboardingPlayerDetailsProps = StaticScreenProps<
  OnboardingPlayerDetailsParams & OnboardingMatchedPlayersParams
>;

type MapCoordinate = Pick<Region, 'latitude' | 'longitude'>;
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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

function InfoCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={21} color={Theme.PRIMARY} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function OnboardingPlayerDetails({ route }: OnboardingPlayerDetailsProps) {
  const navigation = useNavigation();
  const { id, name, sport, matchDetails } = route.params;
  const {
    courtType,
    distance,
    gameType,
    latitude,
    longitude,
    locationName,
    numPlayers,
    playDate,
    playTime,
    playerStatus,
    skillLevel,
    members,
  } = matchDetails;
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [isInterested, setIsInterested] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const initialRegion: Region = {
    latitude: latitude ?? 45.51512,
    longitude: longitude ?? -122.67948,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const visibleRegion = getVisibleRegion(initialRegion, userLocation);
  const displayLocation = locationName ?? 'Location shared after joining';
  const displayGameType = gameType ?? (numPlayers <= 2 ? 'Singles' : 'Doubles');

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

  const handleViewLocation = () => {
    const query = encodeURIComponent(`${initialRegion.latitude},${initialRegion.longitude}`);
    void Linking.openURL(`https://maps.apple.com/?q=${query}`);
  };

  const showDialog = () => setIsDialogVisible(true);
  const hideDialog = () => setIsDialogVisible(false);

  const handleSignUpClick = () => {
    hideDialog();
    navigation.navigate('SignUp', route.params);
  };

  const handleOnInterestedPress = () => showDialog();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
      <View style={styles.screen}>
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
            <View style={styles.sportBadge}>
              <MaterialCommunityIcons
                name={sport === 'Tennis' ? 'tennis' : 'table-tennis'}
                size={16}
                color={Theme.PRIMARY}
              />
              <Text style={styles.sportBadgeText}>{sport}</Text>
            </View>
            <Text style={styles.locationTitle}>{displayLocation}</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={17}
                  color={Theme.PRIMARY}
                />
                <Text style={styles.scheduleText}>{playDate ?? 'Today'}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <MaterialCommunityIcons name="clock-outline" size={17} color={Theme.PRIMARY} />
                <Text style={styles.scheduleText}>{playTime ?? 'Time TBD'}</Text>
              </View>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleItem}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={17}
                  color={Theme.PRIMARY}
                />
                <Text style={styles.scheduleText}>{distance}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mapSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationCaption}>{displayLocation}</Text>
            </View>
            <Pressable
              onPress={handleViewLocation}
              accessibilityRole="link"
              accessibilityLabel={`View ${displayLocation} in maps`}
              hitSlop={8}
              style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}
            >
              <Text style={styles.mapLinkText}>View location</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={17} color={Theme.PRIMARY} />
            </Pressable>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={visibleRegion}
              showsUserLocation
              loadingEnabled
              loadingIndicatorColor={Theme.PRIMARY}
            >
              <Marker
                key={id}
                coordinate={{
                  latitude: initialRegion.latitude,
                  longitude: initialRegion.longitude,
                }}
                title={displayLocation}
                description={`${sport} · ${distance}`}
              >
                <View style={styles.playerMarker}>
                  <Text style={styles.playerMarkerText}>{getPlayerInitials(name)}</Text>
                </View>
              </Marker>
            </MapView>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Match details</Text>
            <View style={styles.openSpotsPill}>
              <View style={styles.statusDot} />
              <Text style={styles.openSpotsText}>Open match</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoCard icon="trending-up" label="Skill level" value={skillLevel} />
            <InfoCard
              icon="account-group-outline"
              label="Players"
              value={`${numPlayers} ${numPlayers === 1 ? 'player' : 'players'}`}
            />
            <InfoCard icon="trophy-outline" label="Game type" value={displayGameType} />
            <InfoCard icon="texture-box" label="Court type" value={courtType ?? 'Outdoor'} />
          </View>

          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>{getPlayerInitials(name)}</Text>
            </View>
            <View style={styles.playerDetails}>
              <View style={styles.playerNameRow}>
                <Text style={styles.playerName}>{name}</Text>
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              </View>
              <Text style={styles.playerMeta}>{skillLevel} player</Text>
            </View>
            <View style={styles.confirmedStatus}>
              <MaterialCommunityIcons name="check-circle" size={16} color={Theme.PRIMARY} />
              <Text style={styles.confirmedStatusText}>{playerStatus ?? 'Confirmed'}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.stickyFooter}>
          <View style={styles.footerCopy}>
            <Text style={styles.footerTitle}>
              {isInterested ? 'Interest sent' : 'Ready to play?'}
            </Text>
            <Text style={styles.footerSubtitle}>
              {isInterested
                ? `${name} will be notified`
                : `Let ${name.split(' ').at(0) ?? 'the host'} know!`}
            </Text>
          </View>
          <Button
            icon={isInterested ? 'check-circle' : 'hand-wave-outline'}
            mode="contained"
            buttonColor={Theme.PRIMARY}
            textColor={Theme.SURFACE}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            labelStyle={styles.primaryButtonLabel}
            onPress={() => handleOnInterestedPress()}
            accessibilityLabel={isInterested ? 'Withdraw interest' : "I'm interested"}
          >
            {isInterested ? 'Interested' : "I'm Interested"}
          </Button>

          <Portal>
            <Dialog visible={isDialogVisible} onDismiss={hideDialog} style={styles.profileDialog}>
              <Dialog.Content style={styles.dialogContent}>
                <View style={styles.dialogIconContainer}>
                  <Image
                    source={require('../../../../assets/swing-logo.png')}
                    style={styles.logo}
                  />
                </View>
                <Text style={styles.dialogTitle}>Create your Swing profile</Text>
                <Text style={styles.dialogDescription}>
                  Add a few details about yourself so we can introduce you to the host and send your
                  interest.
                </Text>
                <View style={styles.dialogReassurance}>
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={18}
                    color={Theme.PRIMARY}
                  />
                  <Text style={styles.dialogReassuranceText}>Takes about a minute</Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions style={styles.dialogActions}>
                <Button
                  onPress={hideDialog}
                  textColor={Theme.SUB_TEXT_COLOR}
                  labelStyle={styles.dialogSecondaryLabel}
                >
                  Not yet
                </Button>
                <Button
                  mode="contained"
                  icon="arrow-right"
                  contentStyle={styles.dialogPrimaryButtonContent}
                  buttonColor={Theme.PRIMARY}
                  textColor={Theme.SURFACE}
                  style={styles.dialogPrimaryButton}
                  labelStyle={styles.dialogPrimaryLabel}
                  onPress={handleSignUpClick}
                >
                  Create profile
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.BACKGROUND,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  hero: {
    marginBottom: 12,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.PRIMARY_LIGHT,
    marginBottom: 10,
  },
  sportBadgeText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  locationTitle: {
    color: Theme.TEXT,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scheduleText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9AA4A4',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Theme.TEXT,
    fontSize: 19,
    fontWeight: '800',
  },
  openSpotsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F6F0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#29966F',
  },
  openSpotsText: {
    color: '#247A5C',
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  infoCard: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 120,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY_LIGHT,
    marginBottom: 12,
  },
  infoLabel: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  infoValue: {
    color: Theme.TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    marginTop: 12,
    marginBottom: 28,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY,
    marginRight: 12,
  },
  playerAvatarText: {
    color: Theme.SURFACE,
    fontSize: 15,
    fontWeight: '800',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  playerName: {
    color: Theme.TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  hostBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  hostBadgeText: {
    color: Theme.PRIMARY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  playerMeta: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
  },
  confirmedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedStatusText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  mapSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  locationCaption: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    marginTop: 4,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  mapLinkText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
  mapContainer: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: '100%',
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
  stickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: Theme.SURFACE,
    borderTopWidth: 1,
    borderTopColor: Theme.PRIMARY_BORDER,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  footerCopy: {
    flex: 1,
  },
  footerTitle: {
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  footerSubtitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 11,
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 14,
  },
  primaryButtonContent: {
    minHeight: 48,
    paddingHorizontal: 6,
  },
  primaryButtonLabel: {
    color: Theme.SURFACE,
    fontSize: 14,
    fontWeight: '700',
  },
  profileDialog: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
  },
  dialogContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    paddingBottom: 8,
  },
  dialogIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  dialogTitle: {
    color: Theme.TEXT,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  dialogDescription: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  dialogReassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  dialogReassuranceText: {
    color: Theme.PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  dialogActions: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 6,
  },
  dialogSecondaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogPrimaryButton: {
    borderRadius: 13,
  },
  dialogPrimaryButtonContent: {
    minHeight: 46,
    flexDirection: 'row-reverse',
    paddingHorizontal: 4,
  },
  dialogPrimaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  logo: {
    width: 125,
    height: 125,
  },
});
