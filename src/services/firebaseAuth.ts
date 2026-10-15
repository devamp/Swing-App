import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// The browser SDK persists sessions in browser storage by default.
export const initializeFirebaseAuth = (app: FirebaseApp) => getAuth(app);
