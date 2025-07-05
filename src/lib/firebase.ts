// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let isFirebaseConfigured = false;

// Check that all required Firebase environment variables are set before initializing
const hasAllKeys = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);


if (hasAllKeys) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // IMPORTANT: Only set configured to true if initialization succeeds.
    isFirebaseConfigured = true;
  } catch (error) {
    // Initialization failed, likely due to invalid credentials.
    // The UI will handle showing a message to the user.
    app = null;
    auth = null;
    isFirebaseConfigured = false;
  }
}

export { app, auth, isFirebaseConfigured };
