import { StyleSheet, Text, View } from 'react-native';
import type { MatchPlayer } from '../data/myMatches';
import Theme from '../theme';

export default function MatchPlayerAvatar({
  player,
  size = 32,
}: {
  player: MatchPlayer;
  size?: number;
}) {
  return (
    <View
      accessibilityLabel={player.name}
      accessible
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.32 }]}>
        {Array.from(player.name.trim())[0]?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Theme.SURFACE,
    backgroundColor: Theme.PRIMARY,
  },
  initials: { color: Theme.SURFACE, fontWeight: '700' },
});
