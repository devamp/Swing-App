import { View, Text, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import Theme from '../../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useRef, useState } from 'react';
import { getPlayerInitials } from '../../../utils';

const HOME_MAP_REGION: Region = {
  latitude: 45.3716,
  longitude: -122.742,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const NEARBY_PLAYERS = [
  {
    id: '1',
    name: 'Alex Chen',
    sport: 'Tennis',
    distance: '2.2 mi away',
    coordinate: { latitude: 45.40348, longitude: -122.7656 },
  },
  {
    id: '2',
    name: 'Maya Patel',
    sport: 'Pickleball',
    distance: '2.6 mi away',
    coordinate: { latitude: 45.3716, longitude: -122.71205 },
  },
  {
    id: '3',
    name: 'Jordan Lee',
    sport: 'Tennis',
    distance: '3.0 mi away',
    coordinate: { latitude: 45.34117, longitude: -122.80885 },
  },
] as const;

export function FindMatches() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const selectedPlayer = NEARBY_PLAYERS.find((player) => player.id === selectedPlayerId);

  const selectPlayer = (player: (typeof NEARBY_PLAYERS)[number]) => {
    setSelectedPlayerId(player.id);
  };

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
        contentContainerStyle={Theme.styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={HOME_MAP_REGION}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            loadingEnabled
            loadingIndicatorColor={Theme.PRIMARY}
          >
            {NEARBY_PLAYERS.map((player) => (
              <Marker
                key={player.id}
                coordinate={player.coordinate}
                title={player.name}
                description={`${player.sport} - ${player.distance}`}
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

          <View pointerEvents="none" style={styles.mapHintBadge}>
            <MaterialCommunityIcons name="gesture-tap" size={14} color={Theme.PRIMARY} />
            <Text style={styles.mapHintText}>Tap a player</Text>
          </View>

          {selectedPlayer ? (
            <View pointerEvents="none" style={styles.selectedPlayerCard}>
              <View style={styles.selectedPlayerAvatar}>
                <Text style={styles.selectedPlayerAvatarText}>
                  {getPlayerInitials(selectedPlayer.name)}
                </Text>
              </View>
              <View style={styles.selectedPlayerInfo}>
                <Text style={styles.selectedPlayerName}>{selectedPlayer.name}</Text>
                <Text style={styles.selectedPlayerMeta}>
                  {selectedPlayer.sport} · {selectedPlayer.distance}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  mapContainer: {
    height: 240,
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4ECEC',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapHintBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  mapHintText: {
    color: Theme.PRIMARY,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedPlayerCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.TEXT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedPlayerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY,
  },
  selectedPlayerAvatarText: {
    color: Theme.SURFACE,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedPlayerInfo: {
    flex: 1,
  },
  selectedPlayerName: {
    color: Theme.TEXT,
    fontSize: 14,
    fontWeight: '800',
  },
  selectedPlayerMeta: {
    marginTop: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 11,
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
  section: {
    gap: 11,
    marginTop: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    color: Theme.PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  optionalText: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  upcomingMatchCard: {
    width: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEAEA',
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
  },
  dateBadge: {
    width: 52,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5F5',
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
  },
  matchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchTitle: {
    flexShrink: 1,
    color: Theme.TEXT,
    fontSize: 17,
    fontWeight: '800',
  },
  matchOpponent: {
    marginTop: 4,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EAF5F5',
  },
  confirmedText: {
    color: Theme.PRIMARY,
    fontSize: 10,
    fontWeight: '700',
  },
  matchDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: '#E7EEEE',
  },
  matchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
  },
  matchDetailText: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    fontWeight: '500',
  },
  matchButton: {
    marginTop: 5,
    borderRadius: 12,
  },
  matchButtonContent: {
    height: 44,
  },
  matchButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
  },
  outlinedActionButton: {
    borderColor: Theme.PRIMARY,
  },
  quickActionContent: {
    minHeight: 48,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
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
  },
  statusDotGreen: {
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
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
