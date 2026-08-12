import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!googleMapsApiKey) {
  throw new Error('GOOGLE_MAPS_API_KEY is not defined');
}

const config: ExpoConfig = {
  name: 'swing-app',
  slug: 'swing-app',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  scheme: 'swingapp',

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.swingapp',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'We use your location to show nearby players and courts.',
    },
  },

  android: {
    package: 'com.swingapp',
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },

  web: {
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-asset',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/splash-icon.png',
      },
    ],
    // [
    //   'react-native-maps',
    //   {
    //     iosGoogleMapsApiKey: googleMapsApiKey,
    //     androidGoogleMapsApiKey: googleMapsApiKey,
    //   },
    // ],
  ],
};

export default config;
