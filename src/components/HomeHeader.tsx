import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Theme from '../theme';
import { getPlayerInitials } from '../utils';

type HomeHeaderProps = {
  userName: string;
  onOpenProfile: () => void;
  onFindMatch: () => void;
};

export default function HomeHeader({ userName, onOpenProfile, onFindMatch }: HomeHeaderProps) {
  const displayName = userName.trim() || 'Player';
  const firstName = displayName.split(/\s+/)[0];

  return (
    <View style={styles.container}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.eyebrow}>YOUR COURTSIDE CLUB</Text>
          <Text accessibilityRole="header" style={styles.greeting}>
            Hey, {firstName}.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open profile for ${displayName}`}
          onPress={onOpenProfile}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        >
          <Text maxFontSizeMultiplier={1.5} style={styles.initials}>
            {getPlayerInitials(displayName)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.artwork}
        >
          <View style={styles.court}>
            <View style={styles.singlesLines} />
            <View style={styles.serviceLines} />
            <View style={styles.centerLine} />
            <View style={styles.net} />
          </View>
          <View style={styles.ball}>
            <MaterialCommunityIcons name="tennis-ball" size={30} color="#DDF49B" />
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.headline}>
          Make time{'\n'}for <Text style={styles.headlineAccent}>play.</Text>
        </Text>
        <Text style={styles.subtitle}>A little competition.{'\n'}A lot of connection.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Find your next match on the Play Map"
          onPress={onFindMatch}
          style={({ pressed }) => [styles.findMatchButton, pressed && styles.pressed]}
        >
          <Text style={styles.findMatchLabel}>Find your next match</Text>
          <MaterialCommunityIcons
            name="arrow-top-right"
            size={20}
            color={Theme.PRIMARY}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20, marginBottom: 4 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  greetingCopy: { flex: 1, minWidth: 0, gap: 5 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: '#607570' },
  greeting: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Theme.PRIMARY,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Theme.PRIMARY,
    backgroundColor: '#E4EDDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: '700', color: Theme.PRIMARY },
  hero: {
    backgroundColor: Theme.PRIMARY,
    borderRadius: 26,
    overflow: 'hidden',
    padding: 22,
    alignItems: 'flex-start',
  },
  headline: {
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '800',
    letterSpacing: -1.6,
    color: '#FFFFFF',
  },
  headlineAccent: { color: '#DDF49B' },
  subtitle: { marginTop: 12, fontSize: 14, lineHeight: 20, color: '#C5D8D2' },
  findMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    maxWidth: '100%',
    minHeight: 46,
    marginTop: 20,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 23,
    backgroundColor: '#DDF49B',
  },
  findMatchLabel: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: Theme.PRIMARY,
  },
  artwork: { ...StyleSheet.absoluteFill },
  court: {
    position: 'absolute',
    width: 250,
    height: 480,
    right: -48,
    top: -112,
    borderWidth: 1,
    borderColor: '#FFFFFF24',
    backgroundColor: '#FFFFFF06',
    transform: [{ rotate: '20deg' }],
  },
  singlesLines: {
    ...StyleSheet.absoluteFill,
    left: 32,
    right: 32,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FFFFFF24',
  },
  serviceLines: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: '25%',
    bottom: '25%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFFFFF24',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: '25%',
    bottom: '25%',
    borderLeftWidth: 1,
    borderColor: '#FFFFFF24',
  },
  net: {
    position: 'absolute',
    top: '50%',
    left: -4,
    right: -4,
    borderTopWidth: 2,
    borderColor: '#FFFFFF38',
  },
  ball: { position: 'absolute', right: 20, top: 194, transform: [{ rotate: '-24deg' }] },
  pressed: { opacity: 0.75 },
});
