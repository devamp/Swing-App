import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import type { PlayMatch, PlayPlayer } from '../../services/playMap/types';
import { playMapService } from '../../services/playMap/service';
import Theme from '../../theme';
import { Sheet } from './Sheet';
import { initials } from './ResultCard';
export function PlayerPreview({
  player,
  onClose,
  onCreate,
}: {
  player: PlayPlayer;
  onClose: () => void;
  onCreate: () => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const [matches, setMatches] = useState<PlayMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!choosing) return;
    let active = true;
    setLoading(true);
    setError('');
    playMapService
      .getHostedMatches(player)
      .then((data) => {
        if (active) setMatches(data);
      })
      .catch(() => {
        if (active) setError('Couldn’t load your hosted matches.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [choosing, player, attempt]);
  const invite = async (match: PlayMatch) => {
    if (sending) return;
    setSending(match.id);
    setError('');
    try {
      await playMapService.invite(player, match.id);
      setSent(match.title);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Couldn’t send invitation.');
    } finally {
      setSending(null);
    }
  };
  return (
    <Sheet title="Player preview" onClose={onClose}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials(player.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.text}>
            {player.sport} · {player.skill}
          </Text>
        </View>
      </View>
      <Text style={styles.text}>{player.area}</Text>
      <Text style={styles.note}>An approximate neighborhood, never a live location.</Text>
      <Text style={styles.heading}>Prefers to play</Text>
      {player.availability.map((value) => (
        <Text key={value} style={styles.text}>
          {value}
        </Text>
      ))}
      {sent ? (
        <View accessibilityLiveRegion="polite" style={styles.confirmation}>
          <Text style={styles.heading}>Invitation sent</Text>
          <Text style={styles.text}>
            {player.name} has been invited to {sent}. You’re all set.
          </Text>
          <Button onPress={onClose}>Done</Button>
        </View>
      ) : choosing ? (
        <>
          <Text style={styles.heading}>Choose a match you’re hosting</Text>
          <Text style={styles.note}>
            Upcoming {player.sport.toLowerCase()} matches with open spots.
          </Text>
          {loading ? (
            <ActivityIndicator accessibilityLabel="Loading hosted matches" />
          ) : (
            matches.map((match) => (
              <View key={match.id} style={styles.match}>
                <Text style={styles.heading}>{match.title}</Text>
                <Text style={styles.text}>{match.venue}</Text>
                <Text style={styles.text}>
                  {new Date(match.startsAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  · {match.openSpots} open spots
                </Text>
                <Button
                  mode="contained"
                  disabled={!!sending}
                  loading={sending === match.id}
                  onPress={() => invite(match)}
                >
                  {sending === match.id ? 'Sending…' : `Invite to this match`}
                </Button>
              </View>
            ))
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          {!loading &&
            !matches.length &&
            (error ? (
              <Button onPress={() => setAttempt((value) => value + 1)}>Retry</Button>
            ) : (
              <>
                <Text style={styles.text}>
                  You don’t have an eligible match yet. Create one to play together.
                </Text>
                <Button mode="contained" onPress={onCreate}>
                  Create Match
                </Button>
              </>
            ))}
        </>
      ) : (
        <Button mode="contained" icon="account-plus-outline" onPress={() => setChoosing(true)}>
          Invite to Match
        </Button>
      )}
    </Sheet>
  );
}
const styles = StyleSheet.create({
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: Theme.PRIMARY, fontWeight: '800', fontSize: 22 },
  name: { fontWeight: '800', fontSize: 22, color: Theme.TEXT },
  heading: { fontWeight: '700', fontSize: 16, color: Theme.PRIMARY },
  text: { color: Theme.SUB_TEXT_COLOR, fontSize: 15 },
  note: { color: Theme.SUB_TEXT_COLOR, fontSize: 13 },
  confirmation: { padding: 16, borderRadius: 18, backgroundColor: '#EAF5F5', gap: 12 },
  match: {
    backgroundColor: Theme.SURFACE,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderColor: '#DDEAEA',
    borderWidth: 1,
  },
  error: { color: Theme.paperTheme.colors.error },
});
