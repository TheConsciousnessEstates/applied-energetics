import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase config — use environment variables in production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForDevelopment",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "applied-energetics-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "applied-energetics-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "applied-energetics-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Connect to emulator in development if available
if (import.meta.env.DEV && !auth.emulatorConfig) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  } catch (e) {
    // Emulator not running, use production Firebase
  }
}

export default app;
