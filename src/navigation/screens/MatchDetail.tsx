import type { StaticScreenProps } from '@react-navigation/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSkillLevel, getRelativeDateLabel } from '../../components/MatchCards';
import { matchService } from '../../services';
import { authService } from '../../services/authService';
import Theme from '../../theme';

type MatchDetailProps = StaticScreenProps<{ matchId: string }>;

export function MatchDetail({ route }: MatchDetailProps) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { matchId } = route.params;
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
      for (const key of ['upcomingMatch', 'dashboardDiscovery', 'loadInitialUser', 'profile']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      goBack();
    },
    onError: (error) => {
      Alert.alert(
        'Could not delete the match',
        error instanceof Error ? error.message : 'Please try again later.',
        undefined,
      );
    },
  });

  const confirmDeleteMatch = () => {
    if (!match || isDeleting || match.userId !== authService.getCurrentUser()?.uid) return;

    Alert.alert(
      'Delete match?',
      `Are you sure you want to delete "${match.matchName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMatch(match.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={Theme.styles.appContainer}>
      <ScrollView
        style={Theme.styles.scrollView}
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
          <View style={styles.detailCard}>
            <View style={styles.titleRow}>
              <View style={styles.sportIcon}>
                <MaterialCommunityIcons
                  name={match.sport === 'tennis' ? 'tennis' : 'table-tennis'}
                  size={28}
                  color={Theme.PRIMARY}
                />
              </View>
              <View style={styles.titleCopy}>
                <Text style={styles.matchTitle}>{match.matchName}</Text>
                <Text style={styles.matchSubtitle}>
                  {match.sport === 'tennis' ? 'Tennis' : 'Pickleball'} match
                </Text>
              </View>
            </View>
            {match.userId === authService.getCurrentUser()?.uid ? (
              <View style={styles.hostingContainer}>
                <View style={styles.hostingBadge}>
                  <MaterialCommunityIcons name="account-star" size={16} color={Theme.PRIMARY} />
                  <Text style={styles.hostingText}>Hosted by you</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete match"
                  accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
                  disabled={isDeleting}
                  onPress={confirmDeleteMatch}
                  style={({ pressed }) => [
                    styles.deleteHostMatchBadge,
                    (pressed || isDeleting) && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={16}
                    color="#B54747"
                  />
                  <Text style={styles.deleteHostMatchText}>
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.divider} />

            <DetailRow
              icon="calendar-outline"
              label={`${getRelativeDateLabel(match.startsAt.toDate())} · ${new Intl.DateTimeFormat(
                'en-US',
                { weekday: 'long', month: 'long', day: 'numeric' },
              ).format(match.startsAt.toDate())}`}
            />
            <DetailRow
              icon="clock-outline"
              label={new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }).format(match.startsAt.toDate())}
            />
            <DetailRow icon="signal-cellular-2" label={formatSkillLevel(match.skillLevel)} />
            <DetailRow
              icon="account-group-outline"
              label={`${match.playersNeeded} ${match.playersNeeded === 1 ? 'spot' : 'spots'} available`}
            />
            <DetailRow icon="map-marker-outline" label={match.matchCourtLocation.name} />
            {match.matchCourtLocation.address ? (
              <Text style={styles.address}>{match.matchCourtLocation.address}</Text>
            ) : null}

            {match.note ? (
              <View style={styles.noteSection}>
                <Text style={styles.noteHeading}>Host note</Text>
                <Text style={styles.noteText}>{match.note}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={19} color={Theme.PRIMARY} />
      <Text style={styles.detailText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#E4ECEC',
    backgroundColor: Theme.SURFACE,
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    color: Theme.PRIMARY,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 42,
  },
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
  detailCard: {
    padding: 18,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sportIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EAF5F5',
  },
  titleCopy: {
    flex: 1,
  },
  matchTitle: {
    color: Theme.TEXT,
    fontSize: 19,
    fontWeight: '800',
  },
  matchSubtitle: {
    marginTop: 2,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
  },
  hostingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  hostingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDEAEA',
    backgroundColor: '#EAF5F5',
  },
  hostingText: {
    color: Theme.PRIMARY,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  deleteHostMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2DADA',
    backgroundColor: '#FFF4F4',
  },
  deleteHostMatchText: {
    color: '#B54747',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 17,
    backgroundColor: '#E7EEEE',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 13,
  },
  detailText: {
    flex: 1,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  address: {
    marginTop: -7,
    marginLeft: 28,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 12,
    lineHeight: 18,
  },
  noteSection: {
    marginTop: 16,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E7EEEE',
  },
  noteHeading: {
    color: Theme.TEXT,
    fontSize: 13,
    fontWeight: '800',
  },
  noteText: {
    marginTop: 5,
    color: Theme.SUB_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 19,
  },
});
