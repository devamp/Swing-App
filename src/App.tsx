import { Assets as NavigationAssets } from '@react-navigation/elements';
import { DefaultTheme } from '@react-navigation/native';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { createURL, getInitialURL } from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Appearance } from 'react-native';
import { Navigation } from './navigation';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Theme from './theme';
import { authService } from './services/authService';

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
  // Register the font before rendering icons, including in older development clients.
  const [iconsLoaded, iconFontError] = useFonts({
    MaterialDesignIcons: require('@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf'),
  });
  const [startup, setStartup] = React.useState<{
    route: 'Home' | 'Landing';
    hasDeepLink: boolean;
  } | null>(null);

  React.useEffect(() => {
    let active = true;

    async function restoreSession() {
      const [session, initialUrl] = await Promise.all([
        authService.restoreSession().catch((error) => {
          console.warn('Could not restore login session', error);
          return null;
        }),
        getInitialURL().catch(() => null),
      ]);

      if (active) {
        const baseUrl = prefix.replace(/\/+$/, '');
        const initialPath = initialUrl?.split(/[?#]/)[0];
        setStartup({
          route: session ? 'Home' : 'Landing',
          // Let React Navigation handle an explicit destination as before.
          hasDeepLink: Boolean(
            initialPath?.startsWith(baseUrl) &&
            initialPath.slice(baseUrl.length).replace(/\//g, ''),
          ),
        });
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  if (iconFontError) throw iconFontError;

  // Keep the splash visible until the session and icon font are ready.
  if (!startup || !iconsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={Theme.paperTheme}>
        <Navigation
          initialState={
            startup.hasDeepLink ? undefined : { index: 0, routes: [{ name: startup.route }] }
          }
          theme={navigationTheme}
          linking={{
            enabled: 'auto',
            prefixes: [prefix],
          }}
          onReady={() => {
            SplashScreen.hideAsync();
          }}
        />
      </PaperProvider>
    </QueryClientProvider>
  );
}
