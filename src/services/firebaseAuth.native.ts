import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// Firebase's default declarations omit this export from its React Native entry point.
// @ts-expect-error getReactNativePersistence is available in the native bundle.
import { getReactNativePersistence } from 'firebase/auth';

export function initializeFirebaseAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh can re-evaluate this module after Auth has already initialized.
    if ((error as { code?: string }).code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}
