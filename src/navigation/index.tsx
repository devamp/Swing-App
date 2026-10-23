import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Landing,
  OnboardingChooseLocation,
  OnboardingChooseSport,
  OnboardingMatchedPlayers,
  OnboardingMatchNotFound,
  OnboardingPlayerDetails,
  OnboardingSkillAvailability,
  Home as Dashboard,
  Profile,
  FindMatches,
  CreateMatch,
  MatchDetail,
  MyMatches,
} from './screens';
import { Onboarding } from './screens/onboarding/Onboarding';
import { SignUp } from './screens/SignUp';
import { Login } from './screens/Login';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons/static';
import Theme from '../theme';
import { usesNativeTabs } from './nativeTabs';

const LegacyHomeTabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    animation: 'shift',
    transitionSpec: {
      animation: 'timing',
      config: { duration: 250 },
    },
    tabBarActiveTintColor: Theme.PRIMARY,
    tabBarStyle: { backgroundColor: Theme.SURFACE },
  },
  screens: {
    Dashboard: {
      screen: Dashboard,
      options: {
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialCommunityIcons
            name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: 'Dashboard',
      },
    },
    FindMatches: {
      screen: FindMatches,
      options: {
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialCommunityIcons
            name={focused ? 'map-search' : 'map-search-outline'}
            size={size}
            color={color}
          />
        ),
        tabBarLabel: 'Play Map',
      },
    },
    Profile: {
      screen: Profile,
      options: {
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialCommunityIcons
            name={focused ? 'tennis-ball' : 'tennis-ball-outline'}
            size={size}
            color={color}
          />
        ),
      },
    },
  },
});

// UIKit supplies the floating Liquid Glass bar and its native interactions.
// Only create the native navigator on supported iOS versions (it throws on web).
const HomeTabs = usesNativeTabs
  ? createNativeBottomTabNavigator({
      screenOptions: {
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: Theme.PRIMARY,
      },
      screens: {
        Dashboard: {
          screen: Dashboard,
          options: {
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'square.grid.2x2.fill' : 'square.grid.2x2',
            }),
          },
        },
        FindMatches: {
          screen: FindMatches,
          options: {
            tabBarLabel: 'Play Map',
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'map.fill' : 'map',
            }),
          },
        },
        Profile: {
          screen: Profile,
          options: {
            tabBarIcon: ({ focused }) => ({
              type: 'sfSymbol',
              name: focused ? 'tennisball.fill' : 'tennisball',
            }),
          },
        },
      },
    })
  : LegacyHomeTabs;

const RootStack = createNativeStackNavigator({
  screens: {
    Landing: {
      screen: Landing,
      options: {
        headerShown: false,
      },
    },
    Onboarding: {
      screen: Onboarding,
      options: {
        headerShown: false,
      },
    },
    OnboardingChooseSport: {
      screen: OnboardingChooseSport,
      options: {
        headerShown: false,
      },
    },
    OnboardingChooseLocation: {
      screen: OnboardingChooseLocation,
      options: {
        headerShown: false,
      },
    },
    OnboardingSkillAvailability: {
      screen: OnboardingSkillAvailability,
      options: {
        headerShown: false,
      },
    },
    OnboardingMatchedPlayers: {
      screen: OnboardingMatchedPlayers,
      options: {
        headerShown: false,
      },
    },
    OnboardingMatchNotFound: {
      screen: OnboardingMatchNotFound,
      options: {
        headerShown: false,
      },
    },
    OnboardingPlayerDetails: {
      screen: OnboardingPlayerDetails,
      options: {
        headerShown: false,
      },
    },
    SignUp: {
      screen: SignUp,
      options: {
        headerShown: false,
      },
    },
    Login: {
      screen: Login,
      options: {
        headerShown: false,
      },
    },
    Home: {
      screen: HomeTabs,
      options: {
        headerShown: false,
        gestureEnabled: false,
      },
    },
    CreateMatch: {
      screen: CreateMatch,
      options: {
        headerShown: false,
      },
    },
    MatchDetail: {
      screen: MatchDetail,
      options: {
        headerShown: false,
      },
    },
    MyMatches: {
      screen: MyMatches,
      options: {
        headerShown: false,
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}
