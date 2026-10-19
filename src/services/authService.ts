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
import { SwingBadRequestError } from './errorService';
import { SignUpCredentials } from '../types';
import { OnboardingMatchPreferencesParams } from '../navigation/screens/onboarding/OnboardingFlowTypes';

// Require a fresh login after 30 days, even if Firebase can still refresh the token.
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

class AuthService {
  async restoreSession(): Promise<User | null> {
    // currentUser is initially null while Firebase reads persisted credentials.
    await Auth.authStateReady();
    const user = Auth.currentUser;
    if (!user) return null;

    const signedInAt = Date.parse(user.metadata.lastSignInTime ?? '');
    const sessionAge = Date.now() - signedInAt;
    if (!Number.isFinite(signedInAt) || sessionAge < 0 || sessionAge >= SESSION_MAX_AGE_MS) {
      await this.logout();
      return null;
    }

    return user;
  }

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
    if (!Auth.currentUser) throw new SwingBadRequestError('Please sign in to update your profile.');
    await updateProfile(Auth.currentUser, { displayName });
  }

  async deleteAccount(): Promise<void> {
    const user = Auth.currentUser;
    if (!user) throw new SwingBadRequestError('Please sign in to delete your account.');

    const lastSignInAt = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).getTime()
      : 0;
    if (!lastSignInAt || Date.now() - lastSignInAt > 4 * 60 * 1000) {
      throw new SwingBadRequestError(
        'For your security, log out and sign in again before deleting your account.',
        { code: 'auth/requires-recent-login' },
      );
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
