import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '../../../theme';

export function FindMatches() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Play Map
        </Text>
        <Text style={styles.message}>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.BACKGROUND },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: { color: Theme.PRIMARY, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  message: { color: Theme.SUB_TEXT_COLOR, fontSize: 16, textAlign: 'center' },
});
