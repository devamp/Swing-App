import {
  createUserWithEmailAndPassword,
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

  getCurrentUser(): User | null {
    return Auth.currentUser;
  }

  subscribe(callback: (user: User | null) => void) {
    return onAuthStateChanged(Auth, callback);
  }
}

export const authService = new AuthService();
