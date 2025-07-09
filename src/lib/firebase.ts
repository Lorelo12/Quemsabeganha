import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  type Auth, 
  GoogleAuthProvider, 
  signInWithPopup,
  type User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | null = null;
let isFirebaseConfigured = false;

const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('<');

if (isConfigValid) {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    isFirebaseConfigured = true;
  } catch (e) {
    console.warn('Could not initialize Firebase, continuing in offline mode.', e);
    isFirebaseConfigured = false;
    auth = null;
  }
}

export const handleGoogleSignIn = async (): Promise<User | null> => {
    if (!auth) {
        throw new Error("Firebase is not configured correctly.");
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Error during Google Sign-In:", error);
        throw error;
    }
};


export { auth, isFirebaseConfigured };
