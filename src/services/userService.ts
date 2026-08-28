import { OnboardingMatchPreferencesParams } from '../navigation/screens/Onboarding/OnboardingFlowTypes';
import { SignUpCredentials, User } from '../types';
import { Database } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

class UserService {
  async createUser(
    { id, username, email }: Omit<SignUpCredentials, 'password'> & { id: string },
    userPreferences: OnboardingMatchPreferencesParams,
  ): Promise<void> {
    try {
      const newUserData: User = {
        username,
        email,
        onboardingPreferences: {
          ...userPreferences,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(Database, 'Users', id), newUserData);
    } catch (error) {
      console.error('Error adding document: ', error);
      throw error;
    }
  }
}

export const userService = new UserService();
