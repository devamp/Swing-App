import { SwingError } from './errorService';
import { OnboardingMatchPreferencesParams } from '../navigation/screens/onboarding/OnboardingFlowTypes';
import { SignUpCredentials, User } from '../types';
import { Database } from './firebase';
import { Storage } from './firebase';
import { deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import type { PlayerProfileUpdate } from '../types';

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
        profile: {
          matchActivity: {
            upcoming: 0,
            joined: 0,
            hosted: 0,
          },
        },
        isClaimed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(Database, 'Users', id), newUserData);
    } catch (error) {
      console.error('Error adding document: ', error);
      throw SwingError.parse(error);
    }
  }

  async getUserById(userId: string) {
    try {
      const ref = doc(Database, 'Users', userId);
      const dbUser = await getDoc(ref);

      if (dbUser.exists()) {
        return dbUser.data();
      }

      console.log(`Could not find user by id: ${userId}`);
    } catch (error) {
      console.error('Error getting user by id: ', error);
      throw SwingError.parse(error);
    }
  }

  async updateProfile(userId: string, profile: PlayerProfileUpdate): Promise<void> {
    const { displayName, ...profileFields } = profile;

    try {
      await setDoc(
        doc(Database, 'Users', userId),
        {
          username: displayName,
          profile: profileFields,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error('Error updating profile: ', error);
      throw SwingError.parse(error);
    }
  }

  async deleteUserById(userId: string): Promise<void> {
    try {
      await deleteObject(ref(Storage, `profilePhotos/${userId}/avatar.jpg`));
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'storage/object-not-found') throw SwingError.parse(error);
    }
    await deleteDoc(doc(Database, 'Users', userId));
  }
}

export const userService = new UserService();
