import { Text, Button } from '@react-navigation/elements';
import { View } from 'react-native';
import Theme from '../../theme';

export function NotFound() {
  return (
    <View style={Theme.styles.centeredContainer}>
      <Text>404</Text>
      <Button screen="Landing">Go to Home</Button>
    </View>
  );
}
