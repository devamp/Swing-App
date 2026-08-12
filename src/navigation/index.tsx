import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import newspaper from '../assets/newspaper.png';
import {
  Home,
  Landing,
  OnboardingChooseLocation,
  OnboardingChooseSport,
  OnboardingMatchedPlayers,
  OnboardingMatchNotFound,
  OnboardingPlayerDetails,
  OnboardingSkillAvailability,
} from './screens';
import { Onboarding } from './screens/onboarding/Onboarding';

const HomeTabs = createBottomTabNavigator({
  screens: {
    Landing: {
      screen: Landing,
      options: {
        title: 'Feed',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
    Home: {
      screen: Home,
      options: {
        title: 'Feed',
        tabBarIcon: ({ color, size }) => (
          <Image
            source={newspaper}
            tintColor={color}
            style={{
              width: size,
              height: size,
            }}
          />
        ),
      },
    },
  },
});

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
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}
