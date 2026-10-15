import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Swing',
  slug: 'swing-app',
  extra: {
    eas: {
      projectId: '9d5ee10a-e945-43ed-a444-88e3a8b68c58',
    },
  },
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'swingapp',
  ios: {
    supportsTablet: false,
    requireFullScreen: true,
    bundleIdentifier: 'com.swing.app.play',
    infoPlist: {
      UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait'],
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
    '@react-native-vector-icons/material-design-icons',
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F7F2',
        image: './assets/icon.png',
      },
    ],
  ],
};

export default config;
