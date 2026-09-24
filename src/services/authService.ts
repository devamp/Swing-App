import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { Auth } from './firebase';
import { userService } from './userService';
import { SignUpCredentials } from '../types';
import { OnboardingMatchPreferencesParams } from '../navigation/screens/Onboarding/OnboardingFlowTypes';

class AuthService {
  async signUp(
    { username, email, password }: SignUpCredentials,
    userPreferences: OnboardingMatchPreferencesParams,
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(Auth, email, password);

    await userService.createUser({ id: credential.user.uid, username, email }, userPreferences);

    await updateProfile(credential.user, {
      displayName: username,
    });

    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(Auth, email, password);
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(Auth);
  }

  async updateDisplayName(displayName: string): Promise<void> {
    if (!Auth.currentUser) throw new Error('No authenticated user');
    await updateProfile(Auth.currentUser, { displayName });
  }

  async deleteAccount(): Promise<void> {
    const user = Auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const lastSignInAt = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).getTime()
      : 0;
    if (!lastSignInAt || Date.now() - lastSignInAt > 4 * 60 * 1000) {
      const error = new Error('A recent sign-in is required to delete this account') as Error & {
        code: string;
      };
      error.code = 'auth/requires-recent-login';
      throw error;
    }

    // Delete private profile data while the user still has permission to do so.
    await userService.deleteUserById(user.uid);
    await deleteUser(user);
  }

  getCurrentUser(): User | null {
    return Auth.currentUser;
  }

  subscribe(callback: (user: User | null) => void) {
    return onAuthStateChanged(Auth, callback);
  }
}

export const authService = new AuthService();
