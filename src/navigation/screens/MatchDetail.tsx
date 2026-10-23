import type { StaticScreenProps } from '@react-navigation/core';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Marker, type LatLng } from 'react-native-maps';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CourtBackground from '../../components/CourtBackground';
import MatchActionAnimation, {
  type MatchActionFeedback,
} from '../../components/MatchActionAnimation';
import MatchPlayerAvatar from '../../components/MatchPlayerAvatar';
import { useToast } from '../../components/ToastProvider';
import { formatSkillLevel, getRelativeDateLabel } from '../../components/MatchCards';
import { AppAlert, matchService } from '../../services';
import { authService } from '../../services/authService';
import {
  SwingBadRequestError,
  SwingError,
  SwingInternalServerError,
} from '../../services/errorService';
import { hasCoordinates, withViewerDistance } from '../../services/matchService/nearbyMatches';
import type { FoundMatch } from '../../services/matchService/types';
import Theme from '../../theme';
import { getPlayerInitials } from '../../utils';

type MatchDetailProps = StaticScreenProps<{ matchId: string }>;

export function MatchDetail({ route }: MatchDetailProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [actionFeedback, setActionFeedback] = useState<
    (MatchActionFeedback & { matchId: string }) | undefined
  >();
  const { matchId } = route.params;
  const userId = authService.getCurrentUser()?.uid;

  const {
    data: match,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['matchDetail', matchId],
    queryFn: () => matchService.getMatchDetailsById(matchId),
  });

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const { mutate: deleteMatch, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => matchService.deleteMatchById(id),
    onSuccess: () => {
      queryClient.setQueryData(['matchDetail', matchId], null);
      for (const key of [
        'upcomingMatch',
        'myMatches',
        'dashboardDiscovery',
        'loadInitialUser',
        'profile',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      goBack();
    },
    onError: (error) => SwingError.showAlert(error),
  });

  const { mutate: joinMatch, isPending: isJoining } = useMutation({
    mutationFn: ({ userId, matchId }: { userId: string; matchId: string }) =>
      matchService.joinMatch(userId, matchId),
    onSuccess: async (_, { userId, matchId }) => {
      await queryClient.cancelQueries({ queryKey: ['matchDetail', matchId], exact: true });
      queryClient.setQueryData<FoundMatch | null>(['matchDetail', matchId], (cachedMatch) => {
        if (!cachedMatch || (cachedMatch.members ?? []).includes(userId)) return cachedMatch;

        return {
          ...cachedMatch,
          members: [...(cachedMatch.members ?? []), userId],
          playersNeeded: Math.max(0, cachedMatch.playersNeeded - 1),
        };
      });
      for (const key of [
        'upcomingMatch',
        'myMatches',
        'dashboardDiscovery',
        'loadInitialUser',
        'profile',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      setActionFeedback((previous) => ({
        matchId,
        sequence: (previous?.sequence ?? 0) + 1,
        action: 'join',
      }));
      showToast("You're in!", "We'll let the host know about your interest.");
    },
    onError: (error) => SwingError.showAlert(error),
  });

  const { mutate: leaveMatch, isPending: isLeaving } = useMutation({
    mutationFn: ({ userId, matchId }: { userId: string; matchId: string }) =>
      matchService.leaveMatch(userId, matchId),
    onSuccess: async (_, { userId, matchId }) => {
      await queryClient.cancelQueries({ queryKey: ['matchDetail', matchId], exact: true });
      queryClient.setQueryData<FoundMatch | null>(['matchDetail', matchId], (cachedMatch) => {
        if (!cachedMatch || !(cachedMatch.members ?? []).includes(userId)) return cachedMatch;

        return {
          ...cachedMatch,
          members: cachedMatch.members.filter((memberId) => memberId !== userId),
          playersNeeded: cachedMatch.playersNeeded + 1,
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['upcomingMatch', userId],
          exact: true,
          refetchType: 'all',
        }),
        ...['myMatches', 'dashboardDiscovery', 'loadInitialUser', 'profile'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      ]);
      setActionFeedback((previous) => ({
        matchId,
        sequence: (previous?.sequence ?? 0) + 1,
        action: 'leave',
      }));
    },
    onError: (error) => SwingError.showAlert(error),
  });

  const confirmJoinMatch = () => {
    if (isJoining || isLeaving || !match) return;
    if (!userId) {
      new SwingBadRequestError('Please sign in before joining a match.').showAlert();
      return;
    }

    AppAlert.alert(
      'Join match?',
      `Are you sure you want to join "${match.matchName}"? The host will be notified.`,
      [
        {
          text: 'Join match',
          style: 'default',
          onPress: () => joinMatch({ userId, matchId: match.id }),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const confirmLeaveMatch = () => {
    if (!match || !userId || isJoining || isLeaving || match.userId === userId) return;
    if (!(match.members ?? []).includes(userId)) return;

    AppAlert.alert(
      'Leave match?',
      `Are you sure you want to leave "${match.matchName}"? Your spot will become available to other players.`,
      [
        {
          text: 'Leave match',
          style: 'destructive',
          onPress: () => leaveMatch({ userId, matchId: match.id }),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const confirmDeleteMatch = () => {
    if (!match || isDeleting || match.userId !== authService.getCurrentUser()?.uid) return;

    AppAlert.alert(
      'Delete match?',
      `Are you sure you want to delete "${match.matchName}"? This cannot be undone.`,
      [
        { text: 'Delete', style: 'destructive', onPress: () => deleteMatch(match.id) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={23} color={Theme.PRIMARY} />
          </Pressable>
          <Text style={styles.headerTitle}>Match Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={Theme.PRIMARY} />
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>Couldn’t load this match.</Text>
            <Button compact mode="text" onPress={() => refetch()}>
              Try again
            </Button>
          </View>
        ) : !match ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={34}
              color={Theme.PRIMARY}
            />
            <Text style={styles.stateTitle}>This match is no longer available.</Text>
          </View>
        ) : (
          <MatchInformation
            key={match.id}
            match={match}
            isHost={match.userId === userId}
            isDeleting={isDeleting}
            onDelete={confirmDeleteMatch}
          />
        )}
      </ScrollView>
      {match && !isLoading && !isError ? (
        <JoinMatchFooter
          key={match.id}
          match={match}
          actionFeedback={actionFeedback?.matchId === match.id ? actionFeedback : undefined}
          isJoining={isJoining}
          isLeaving={isLeaving}
          onJoin={confirmJoinMatch}
          onLeave={confirmLeaveMatch}
        />
      ) : null}
    </SafeAreaView>
  );
}

function MatchInformation({
  match,
  isHost,
  isDeleting,
  onDelete,
}: {
  match: FoundMatch;
  isHost: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    let active = true;
    const loadLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted || !active) return;
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
      } catch {
        // The court map remains available when device location is unavailable.
      }
    };
    void loadLocation();
    return () => {
      active = false;
    };
  }, []);

  const court = match.matchCourtLocation;
  const rawCoordinate = {
    latitude: court.courtLocation?.latitude ?? court.latitude,
    longitude: court.courtLocation?.longitude ?? court.longitude,
  };
  const userId = authService.getCurrentUser()?.uid;
  const coordinate = hasCoordinates(rawCoordinate) ? rawCoordinate : null;
  const distance = withViewerDistance(match, userLocation).matchCourtLocation.distanceMiles;
  const startDate = match.startsAt.toDate();
  const sportLabel = match.sport === 'tennis' ? 'Tennis' : 'Pickleball';
  const hostName = match.hostName?.trim() || 'Match host';
  const members = new Set(match.members ?? []);
  const joinedCount = new Set((match.members ?? []).filter((id) => id !== match.userId)).size;
  const spots = Math.max(0, match.playersNeeded);
  const hasStarted = startDate.getTime() <= Date.now();
  const statusLabel = hasStarted ? 'Match started' : spots > 0 ? 'Open match' : 'Match full';
  const courtTypeLabel = {
    public_outdoor: 'Public outdoor',
    public_indoor: 'Public indoor',
    private: 'Private court',
    unknown: 'Not specified',
  }[court.courtType ?? 'unknown'];

  const openDirections = async () => {
    const destination = coordinate
      ? `${coordinate.latitude},${coordinate.longitude}`
      : [court.name, court.address].filter(Boolean).join(', ');
    const query = encodeURIComponent(destination);
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${query}`
        : `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      new SwingInternalServerError('We couldn’t open maps. Please try again.', {
        cause: error,
      }).showAlert();
    }
  };

  return (
    <View style={styles.sections}>
      <View style={styles.hero}>
        <CourtBackground variant="card" />
        <View style={styles.heroTopRow}>
          <View style={styles.sportBadge}>
            <MaterialCommunityIcons
              name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
              size={18}
              color={Theme.SURFACE}
            />
            <Text style={styles.sportText}>{sportLabel}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.matchTitle}>{match.matchName}</Text>
        <View style={styles.heroLocation}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={18}
            color={Theme.ON_PRIMARY_MUTED}
          />
          <Text style={styles.heroSubtitle}>{court.name}</Text>
        </View>
        <View style={styles.heroTags}>
          <View style={styles.heroTag}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={14}
              color={Theme.ON_PRIMARY_MUTED}
            />
            <Text style={styles.heroTagText}>{match.gameType || sportLabel}</Text>
          </View>
          <View style={styles.heroTag}>
            <MaterialCommunityIcons name="trending-up" size={14} color={Theme.ON_PRIMARY_MUTED} />
            <Text style={styles.heroTagText}>{formatSkillLevel(match.skillLevel)}</Text>
          </View>
        </View>
        <View style={styles.scheduleCard}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>
              {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(startDate).toUpperCase()}
            </Text>
            <Text style={styles.dateDay}>{startDate.getDate()}</Text>
          </View>
          <View style={styles.flexCopy}>
            <Text style={styles.eyebrow}>{getRelativeDateLabel(startDate)}</Text>
            <Text style={styles.scheduleDate}>
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }).format(startDate)}
            </Text>
            <View style={styles.inlineRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={Theme.ON_PRIMARY_MUTED}
              />
              <Text style={styles.timeText}>
                {new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(startDate)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.heroHost}>
          <View style={styles.heroHostAvatar}>
            <Text style={styles.heroHostInitials}>{getPlayerInitials(hostName) || '?'}</Text>
          </View>
          <Text style={styles.heroCaption}>
            {isHost ? 'You’re hosting this match' : `Hosted by ${hostName}`}
          </Text>
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>The game plan</Text>
        <View style={[styles.card, styles.detailsCard]}>
          <DetailRow
            icon="trending-up"
            label="Skill level"
            value={formatSkillLevel(match.skillLevel)}
          />
          <DetailRow
            icon="trophy-outline"
            label="Game type"
            value={match.gameType || 'Not specified'}
          />
          <DetailRow icon="texture-box" label="Court type" value={courtTypeLabel} />
          <DetailRow
            icon="account-group-outline"
            label="Availability"
            value={
              hasStarted
                ? 'Match started'
                : spots > 0
                  ? `${spots} ${spots === 1 ? 'spot' : 'spots'} open`
                  : 'No open spots'
            }
            last
          />
        </View>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Meet at the court</Text>
        <View style={[styles.card, styles.venueCard]}>
          {coordinate ? (
            <MapView
              key={`${match.id}-${coordinate.latitude}-${coordinate.longitude}`}
              style={styles.map}
              initialRegion={{ ...coordinate, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
              showsUserLocation={userLocation !== null}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              loadingEnabled
              loadingIndicatorColor={Theme.PRIMARY}
              accessibilityLabel={`Map showing ${court.name}`}
            >
              <Marker
                coordinate={coordinate}
                title={court.name}
                description={court.address}
                pinColor={Theme.PRIMARY}
              />
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <MaterialCommunityIcons
                name="map-marker-question-outline"
                size={30}
                color={Theme.PRIMARY}
              />
              <Text style={styles.secondaryText}>Map preview unavailable</Text>
              <Text style={styles.fallbackHint}>Search for this court using directions below.</Text>
            </View>
          )}
          <View style={styles.venueCopy}>
            <Text style={styles.venueName}>{court.name}</Text>
            {court.address ? <Text style={styles.secondaryText}>{court.address}</Text> : null}
            {distance != null ? (
              <View style={styles.inlineRow}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={16}
                  color={Theme.PRIMARY}
                />
                <Text style={styles.distanceText}>{distance.toFixed(1)} mi away</Text>
              </View>
            ) : null}
            <Button
              mode="outlined"
              icon="directions"
              onPress={() => void openDirections()}
              textColor={Theme.PRIMARY}
              style={styles.directionsButton}
              contentStyle={styles.buttonContent}
              accessibilityLabel={`Get directions to ${court.name}`}
            >
              Get directions
            </Button>
          </View>
        </View>
      </View>

      <View>
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionTitle, styles.noBottomMargin]}>Who’s playing</Text>
          <Text style={styles.playerCount}>
            {joinedCount + 1} {joinedCount === 0 ? 'player' : 'players'}
          </Text>
        </View>
        <View style={[styles.card, styles.playersCard]}>
          <View style={styles.playerRow}>
            <MatchPlayerAvatar player={{ id: match.userId, name: hostName }} size={44} />
            <View style={styles.flexCopy}>
              <Text style={styles.playerName}>
                {hostName}
                {isHost ? ' (you)' : ''}
              </Text>
              <Text style={styles.playerRole}>Match host</Text>
            </View>
            <View style={styles.hostBadge}>
              <MaterialCommunityIcons name="account-star-outline" size={15} color={Theme.PRIMARY} />
              <Text style={styles.hostText}>HOST</Text>
            </View>
          </View>
          {joinedCount > 0 ? (
            <View style={styles.rosterSummary}>
              <MaterialCommunityIcons
                name="account-check-outline"
                size={20}
                color={Theme.PRIMARY}
              />
              <Text style={styles.secondaryText}>
                {members.has(userId!)
                  ? 'You have joined this match'
                  : `${joinedCount} ${joinedCount === 1 ? 'player has' : 'players have'} joined`}
              </Text>
            </View>
          ) : null}
          {!hasStarted && spots > 0 ? (
            <View style={styles.rosterSummary}>
              <MaterialCommunityIcons name="account-plus-outline" size={20} color={Theme.PRIMARY} />
              <Text style={styles.secondaryText}>
                Looking for {spots} more {spots === 1 ? 'player' : 'players'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {match.note?.trim() ? (
        <View style={styles.noteSection}>
          <View style={styles.inlineRow}>
            <MaterialCommunityIcons name="message-text-outline" size={19} color={Theme.PRIMARY} />
            <Text style={styles.noteHeading}>A note from the host</Text>
          </View>
          <Text style={styles.noteText}>{match.note}</Text>
        </View>
      ) : null}

      {isHost ? (
        <Button
          mode="text"
          icon="trash-can-outline"
          loading={isDeleting}
          disabled={isDeleting}
          onPress={onDelete}
          textColor="#B54747"
          style={styles.deleteButton}
          contentStyle={styles.buttonContent}
          accessibilityLabel="Delete match"
          accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
        >
          {isDeleting ? 'Deleting…' : 'Delete match'}
        </Button>
      ) : null}
    </View>
  );
}

function JoinMatchFooter({
  match,
  actionFeedback,
  isJoining,
  isLeaving,
  onJoin,
  onLeave,
}: {
  match: FoundMatch;
  actionFeedback?: MatchActionFeedback;
  isJoining: boolean;
  isLeaving: boolean;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width - insets.left - insets.right < 380 || fontScale >= 1.3;
  const userId = authService.getCurrentUser()?.uid;
  const isHost = match.userId === userId;
  const isMember = (match.members ?? []).includes(userId ?? '');
  const hasStarted = match.startsAt.toMillis() <= Date.now();
  const isFull = match.playersNeeded <= 0;
  const canJoin = !isHost && !isMember && !hasStarted && !isFull;
  const canLeave = !isHost && isMember;
  const isPending = isJoining || isLeaving;
  const isDisabled = (!canJoin && !canLeave) || isPending;
  const title = isHost
    ? 'You’re hosting'
    : isMember
      ? 'You’re on the list'
      : hasStarted
        ? 'Match has started'
        : isFull
          ? 'This match is full'
          : 'Ready to play?';
  const buttonLabel = isHost
    ? 'Your match'
    : isMember
      ? 'Leave match'
      : hasStarted
        ? 'Joining closed'
        : isFull
          ? 'Match full'
          : 'Join match';

  return (
    <View style={[styles.joinFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.joinFooterContent}>
        <View style={[styles.joinFooterRow, isCompact && styles.joinFooterStack]}>
          <View
            style={[styles.joinCopy, isCompact && styles.joinCopyStack]}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.joinTitle}>{title}</Text>
            <Text style={styles.joinSubtitle}>
              {isHost || isMember
                ? 'See you at the court.'
                : canJoin
                  ? `${match.playersNeeded} ${match.playersNeeded === 1 ? 'spot' : 'spots'} available`
                  : 'Explore other matches to play.'}
            </Text>
          </View>
          <MatchActionAnimation
            feedback={actionFeedback}
            isPending={isPending}
            fullWidth={isCompact}
          >
            <Button
              mode="contained"
              icon={
                isHost ? 'account-star-outline' : isMember ? 'exit-run' : 'account-plus-outline'
              }
              onPress={canLeave ? onLeave : onJoin}
              loading={isPending}
              disabled={isDisabled}
              buttonColor={canLeave ? '#B54747' : Theme.PRIMARY}
              textColor={Theme.SURFACE}
              style={[styles.joinButton, isCompact && styles.joinButtonFullWidth]}
              labelStyle={styles.joinButtonLabel}
              contentStyle={styles.joinButtonContent}
              accessibilityLabel={buttonLabel}
              accessibilityState={{ disabled: isDisabled, busy: isPending }}
            >
              {isLeaving ? 'Leaving…' : isJoining ? 'Joining…' : buttonLabel}
            </Button>
          </MatchActionAnimation>
        </View>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailDivider]}>
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={Theme.PRIMARY} />
      </View>
      <View style={styles.flexCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.BACKGROUND },
  scrollView: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
  },
  pressed: { opacity: 0.7 },
  headerTitle: { color: Theme.PRIMARY, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 42 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 60,
  },
  stateTitle: {
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sections: { gap: 24 },
  hero: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: Theme.PRIMARY,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.PRIMARY,
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF1A',
    borderWidth: 1,
    borderColor: '#FFFFFF26',
  },
  sportText: { color: Theme.SURFACE, fontSize: 14, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  statusText: { color: Theme.PRIMARY, fontSize: 11, fontWeight: '800' },
  matchTitle: { color: Theme.SURFACE, fontSize: 28, lineHeight: 35, fontWeight: '800' },
  heroLocation: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 10 },
  heroSubtitle: { flex: 1, color: Theme.ON_PRIMARY_MUTED, fontSize: 14, lineHeight: 20 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 20 },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: `${Theme.PRIMARY}99`,
  },
  heroTagText: { flexShrink: 1, color: Theme.ON_PRIMARY_MUTED, fontSize: 12, fontWeight: '600' },
  heroHost: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 },
  heroHostAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF20',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHostInitials: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  heroCaption: {
    flex: 1,
    color: Theme.ON_PRIMARY_MUTED,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Theme.SURFACE,
    borderWidth: 1,
    borderColor: Theme.PRIMARY_BORDER,
    borderRadius: 20,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: `${Theme.PRIMARY}B3`,
    borderWidth: 1,
    borderColor: '#FFFFFF26',
    borderRadius: 16,
  },
  dateBadge: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  dateMonth: { color: Theme.PRIMARY, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dateDay: { color: Theme.PRIMARY, fontSize: 30, lineHeight: 38, fontWeight: '800' },
  flexCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: Theme.ON_PRIMARY_MUTED, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  scheduleDate: {
    color: Theme.SURFACE,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    marginBottom: 6,
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  timeText: { flexShrink: 1, color: Theme.ON_PRIMARY_MUTED, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: Theme.TEXT, fontSize: 19, fontWeight: '800', marginBottom: 12 },
  detailsCard: { paddingHorizontal: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
  detailDivider: { borderBottomWidth: 1, borderBottomColor: Theme.PRIMARY_BORDER },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.PRIMARY_LIGHT,
  },
  detailLabel: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, marginBottom: 3 },
  detailValue: { color: Theme.TEXT, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  venueCard: { overflow: 'hidden' },
  map: { width: '100%', height: 210 },
  mapFallback: {
    minHeight: 160,
    padding: 24,
    gap: 8,
    backgroundColor: Theme.PRIMARY_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHint: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  venueCopy: { padding: 18, gap: 8 },
  venueName: { color: Theme.TEXT, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  secondaryText: { flexShrink: 1, color: Theme.SUB_TEXT_COLOR, fontSize: 13, lineHeight: 20 },
  distanceText: { color: Theme.PRIMARY, fontSize: 13, fontWeight: '600' },
  directionsButton: { marginTop: 6, borderRadius: 12, borderColor: Theme.PRIMARY_BORDER },
  deleteButton: { alignSelf: 'center', minWidth: 0 },
  buttonContent: { minHeight: 46 },
  sectionHeadingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  noBottomMargin: { marginBottom: 0 },
  playerCount: { color: Theme.PRIMARY, fontSize: 12, fontWeight: '700' },
  playersCard: { padding: 18 },
  playerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  playerName: { color: Theme.TEXT, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  playerRole: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, marginTop: 3 },
  hostBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hostText: { color: Theme.PRIMARY, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rosterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: Theme.PRIMARY_BORDER,
    paddingTop: 14,
    marginTop: 14,
  },
  noteSection: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.PRIMARY,
    paddingLeft: 16,
    paddingVertical: 4,
  },
  noteHeading: { flexShrink: 1, color: Theme.TEXT, fontSize: 15, fontWeight: '700' },
  noteText: { color: Theme.SUB_TEXT_COLOR, fontSize: 14, lineHeight: 22, marginTop: 8 },
  joinFooter: {
    width: '100%',
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.PRIMARY_BORDER,
    backgroundColor: Theme.SURFACE,
    shadowColor: Theme.PRIMARY,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 8,
  },
  joinFooterContent: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  joinFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  joinFooterStack: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  joinCopy: { flexShrink: 1, flexGrow: 1, flexBasis: 0, minWidth: 0 },
  joinCopyStack: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  joinTitle: { color: Theme.TEXT, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  joinSubtitle: { color: Theme.SUB_TEXT_COLOR, fontSize: 12, lineHeight: 18, marginTop: 3 },
  joinButton: { flexShrink: 0, borderRadius: 14, minWidth: 144 },
  joinButtonFullWidth: { width: '100%' },
  joinButtonContent: { minHeight: 52, paddingHorizontal: 8 },
  joinButtonLabel: { fontSize: 15, fontWeight: '700' },
});
