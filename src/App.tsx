import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DefaultTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { createURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Appearance } from 'react-native';
import { Navigation } from './navigation';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Theme from './theme';
import SwingAlert from './components/SwingAlert';

// Keep native controls (including Apple Maps) light in existing development builds too.
Appearance.setColorScheme('light');

Asset.loadAsync([
  ...NavigationAssets,
  require('./assets/newspaper.png'),
  require('./assets/bell.png'),
]);

SplashScreen.preventAutoHideAsync();

const prefix = createURL('/');
const queryClient = new QueryClient();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Theme.PRIMARY,
    background: Theme.BACKGROUND,
  },
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={Theme.paperTheme}>
        <Navigation
          theme={navigationTheme}
          linking={{
            enabled: 'auto',
            prefixes: [prefix],
          }}
          onReady={() => {
            SplashScreen.hideAsync();
          }}
        />
        <SwingAlert />
      </PaperProvider>
    </QueryClientProvider>
  );
}
