// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyD0hggacJzVWjDDrJIJTK5MhtEmDE-Dv7o',
  authDomain: 'swing-app-b53ac.firebaseapp.com',
  projectId: 'swing-app-b53ac',
  storageBucket: 'swing-app-b53ac.firebasestorage.app',
  messagingSenderId: '410937316183',
  appId: '1:410937316183:web:154425dcdb4ca442226412',
  measurementId: 'G-6YKJ12GR3X',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const Database = getFirestore(app);
export const Auth = getAuth(app);
