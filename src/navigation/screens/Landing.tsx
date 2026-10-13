import { View, Text, StyleSheet, Image } from 'react-native';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons/static";
import { Button } from 'react-native-paper';
import Theme from '../../theme';
import { useNavigation } from '@react-navigation/native';

export function Landing() {
  const navigation = useNavigation();
  const swingLogo = require('../../../assets/swing-logo.png');

  return (
    <View style={Theme.styles.paddedAppContainer}>
      <View style={Theme.styles.backgroundBlobTop} />
      <View style={Theme.styles.backgroundBlobBottom} />
      <View style={[Theme.styles.headerContainer, styles.headerContainer]}>
        <Image source={swingLogo} style={styles.logo} />
        <Text style={[Theme.styles.centeredSubtext, styles.appSubText]}>
          Set your skill level, see nearby matches, and start playing!
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={() => navigation.navigate('Onboarding')}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="map-marker-radius" size={28} color={color} />
          )}
          contentStyle={Theme.styles.pillButtonContent}
          labelStyle={Theme.styles.primaryButtonLabel}
          style={[Theme.styles.elevatedPillButton, Theme.styles.primaryPillButton]}
        >
          Find Players Near Me
        </Button>
        <Button
          onPress={() => navigation.navigate('Login')}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="login" size={22} color={color} />
          )}
          contentStyle={Theme.styles.pillButtonContent}
          labelStyle={Theme.styles.secondaryButtonLabel}
          style={[Theme.styles.elevatedPillButton, Theme.styles.secondaryPillButton]}
        >
          Log in
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 400,
    height: 425,
  },

  headerContainer: {
    marginBottom: 22,
  },

  appSubText: {
    marginBottom: 20,
  },

  buttonContainer: {
    gap: 12,
  },
});
