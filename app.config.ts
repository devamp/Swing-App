import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'swing-app',
  slug: 'swing-app',
  extra: {
    eas: {
      projectId: '9d5ee10a-e945-43ed-a444-88e3a8b68c58',
    },
  },
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'swingapp',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.swing.app.play',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We use your location to show nearby players and courts.',
    },
  },

  android: {
    package: 'com.swingapp',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    adaptiveIcon: {
      foregroundImage: './assets/swing-logo.png',
      backgroundColor: '#ffffff',
    },
  },

  web: {
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-asset',
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/swing-logo.png',
      },
    ],
  ],
};

export default config;
