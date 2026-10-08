import type { StaticScreenProps } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectableChip from '../../components/SelectableChip';
import { playMapService } from '../../services/playMap/service';
import { VENUES } from '../../services/playMap/fixtures';
import type { PlayMatch, Skill, Sport } from '../../services/playMap/types';
import Theme from '../../theme';

function Page({ title, children }: { title: string; children: ReactNode }) {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Play Map"
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.PRIMARY} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function PlayMapMatchDetail({ route }: StaticScreenProps<{ matchId: string }>) {
  const [match, setMatch] = useState<PlayMatch>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    playMapService
      .getMatch(route.params.matchId)
      .then((result) => {
        if (active) setMatch(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [route.params.matchId, attempt]);
  return (
    <Page title="Match Details">
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading match details" />
      ) : error ? (
        <>
          <Text style={styles.text}>Couldn’t load this match.</Text>
          <Button onPress={() => setAttempt((value) => value + 1)}>Retry</Button>
        </>
      ) : !match ? (
        <Text style={styles.text}>This match is no longer available.</Text>
      ) : (
        <View style={styles.card}>
          <MaterialCommunityIcons
            name={match.sport === 'Tennis' ? 'tennis' : 'table-tennis'}
            size={36}
            color={Theme.PRIMARY}
          />
          <Text style={styles.title}>{match.title}</Text>
          <Text style={styles.text}>
            {match.sport}
            {match.hosted ? ' · Hosting' : ''}
          </Text>
          <View style={styles.divider} />
          <Detail icon="map-marker-outline" text={match.venue} />
          <Detail
            icon="calendar-outline"
            text={new Date(match.startsAt).toLocaleDateString([], {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          />
          <Detail
            icon="clock-outline"
            text={new Date(match.startsAt).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          />
          <Detail icon="signal-cellular-2" text={match.skill} />
          <Detail
            icon="account-group-outline"
            text={`${match.openSpots} open ${match.openSpots === 1 ? 'spot' : 'spots'}`}
          />
          <Text style={styles.label}>Host note</Text>
          <Text style={styles.text}>{match.note}</Text>
        </View>
      )}
    </Page>
  );
}
function Detail({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={21} color={Theme.PRIMARY} />
      <Text style={[styles.text, { flex: 1 }]}>{text}</Text>
    </View>
  );
}
export function PlayMapCreateMatch({ route }: StaticScreenProps<{ sport: Sport }>) {
  const navigation = useNavigation();
  const [sport, setSport] = useState<Sport>(route.params.sport);
  const [skill, setSkill] = useState<Skill>('Intermediate');
  const [venueIndex, setVenueIndex] = useState(0);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(18);
  const [openSpots, setSpots] = useState(2);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<PlayMatch>();
  const [error, setError] = useState('');
  const submit = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    const starts = new Date();
    starts.setDate(starts.getDate() + day);
    starts.setHours(hour, 0, 0, 0);
    try {
      setCreated(
        await playMapService.createMatch({
          sport,
          skill,
          venueIndex,
          startsAt: starts.toISOString(),
          openSpots,
        }),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Couldn’t create your match.');
    } finally {
      setPending(false);
    }
  };
  return (
    <Page title="Create Match">
      {created ? (
        <View style={styles.card}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color={Theme.PRIMARY} />
          <Text style={styles.title}>Your match is ready</Text>
          <Text style={styles.text}>
            {created.sport} at {created.venue}. Return to the player and choose Invite to Match to
            send your invitation.
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Back to Play Map
          </Button>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Sport</Text>
            <View style={styles.options}>
              {(['Tennis', 'Pickleball'] as const).map((value) => (
                <SelectableChip
                  key={value}
                  label={value}
                  selected={value === sport}
                  onPress={() => setSport(value)}
                />
              ))}
            </View>
            <Text style={styles.label}>Choose a venue</Text>
            {VENUES.map((venue, index) => (
              <SelectableChip
                key={venue.name}
                label={venue.name}
                selected={index === venueIndex}
                onPress={() => setVenueIndex(index)}
              />
            ))}
            <Text style={styles.label}>When</Text>
            <View style={styles.options}>
              {[1, 2, 3].map((value) => (
                <SelectableChip
                  key={value}
                  label={value === 1 ? 'Tomorrow' : `In ${value} days`}
                  selected={day === value}
                  onPress={() => setDay(value)}
                />
              ))}
            </View>
            <View style={styles.options}>
              {[9, 14, 18].map((value) => (
                <SelectableChip
                  key={value}
                  label={value === 9 ? '9:00 AM' : value === 14 ? '2:00 PM' : '6:00 PM'}
                  selected={hour === value}
                  onPress={() => setHour(value)}
                />
              ))}
            </View>
            <Text style={styles.label}>Skill level</Text>
            <View style={styles.options}>
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((value) => (
                <SelectableChip
                  key={value}
                  label={value}
                  selected={value === skill}
                  onPress={() => setSkill(value)}
                />
              ))}
            </View>
            <Text style={styles.label}>Open spots</Text>
            <View style={styles.options}>
              {[1, 2, 3].map((value) => (
                <SelectableChip
                  key={value}
                  label={`${value} ${value === 1 ? 'spot' : 'spots'}`}
                  selected={value === openSpots}
                  onPress={() => setSpots(value)}
                />
              ))}
            </View>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: Theme.paperTheme.colors.error }}>
              {error}
            </Text>
          )}
          <Button mode="contained" loading={pending} disabled={pending} onPress={submit}>
            {pending ? 'Creating…' : 'Create Match'}
          </Button>
        </>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.BACKGROUND },
  content: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Theme.PRIMARY, flexShrink: 1 },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: Theme.SURFACE,
    borderColor: '#DDEAEA',
    borderWidth: 1,
    gap: 16,
  },
  text: { fontSize: 15, color: Theme.SUB_TEXT_COLOR, lineHeight: 23 },
  label: { fontSize: 16, fontWeight: '700', color: Theme.PRIMARY },
  divider: { height: 1, backgroundColor: '#E7EEEE' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
