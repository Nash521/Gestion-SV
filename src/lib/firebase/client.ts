"use client";
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, initializeAuth, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Defensively shim localStorage for SSR if it's broken (e.g. defined but missing getItem)
if (typeof window === 'undefined') {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    const localStorageMock = {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => { },
      removeItem: (_key: string) => { },
      clear: () => { },
      length: 0,
      key: (_index: number) => null,
    } as unknown as Storage;
    (global as any).localStorage = localStorageMock;
  }
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if API key is present
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env.local file.");
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (typeof window === 'undefined') {
  // Server-side
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Use inMemoryPersistence on the server to avoid localStorage errors
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence
  });
} else {
  // Client-side
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Use standard getAuth which defaults to browserLocalPersistence
  // but ensures we don't accidentally create multiple instances
  auth = getAuth(app);
  // Explicitly set persistence if needed, but getAuth usually handles it.
  // To be perfectly safe against race conditions:
  auth.setPersistence(browserLocalPersistence).catch((error) => {
    console.error("Failed to set auth persistence:", error);
  });
}

export const db = getFirestore(app);
export { auth };
export default app;
