import { Button, Text } from '@react-navigation/elements';
import { View } from 'react-native';
import Theme from '../../theme';

export function Home() {
  return (
    <View style={Theme.styles.centeredContainer}>
      <Text>Home Screen</Text>
      <Text>Open up 'src/App.tsx' to start working on your app!</Text>
      <Button screen="Onboarding">Go to Onboarding</Button>
      <Button screen="Landing">Go to Landing</Button>
    </View>
  );
}
