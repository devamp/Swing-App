import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
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

  async deleteAccount(password: string): Promise<void> {
    const user = Auth.currentUser;
    if (!user) throw new SwingBadRequestError('Please sign in to delete your account.');

    if (!password) throw new SwingBadRequestError('Enter your current password to continue.');
    if (!user.email) throw new SwingBadRequestError('Please sign in again to delete your account.');

    // Firebase verifies the password; the current password is never readable from authUser.
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    if (Auth.currentUser?.uid !== user.uid) {
      throw new SwingBadRequestError('Your session changed. Please sign in again to continue.');
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
