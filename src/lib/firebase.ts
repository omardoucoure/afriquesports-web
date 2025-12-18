// Firebase configuration for Afrique Sports
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4YuLmLCMyn3a8XfNcCNDpHiiL4K-JlNs",
  authDomain: "afrique-sports.firebaseapp.com",
  databaseURL: "https://afrique-sports.firebaseio.com",
  projectId: "afrique-sports",
  storageBucket: "afrique-sports.appspot.com",
  messagingSenderId: "317070880464",
  appId: "1:317070880464:web:cd65caad5cf9784f",
  measurementId: "G-R9VY0V8WN2"
};

// CRITICAL PERFORMANCE: Lazy initialize Firebase app
// App is only initialized when first Firebase service is accessed
// This prevents Firebase from loading on pages that don't need it
let _app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// CRITICAL PERFORMANCE OPTIMIZATION:
// Lazy-load Firebase services to prevent blocking the critical rendering path
// Services are only initialized when first accessed, not on module load

let _analytics: Analytics | null = null;
let _auth: Auth | null = null;

// Lazy getter functions for Firebase services
export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  if (!_analytics) {
    _analytics = getAnalytics(getFirebaseApp());
  }
  return _analytics;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

// Backward compatibility: Direct exports using Proxy for lazy initialization
export const auth = (() => {
  const handler: ProxyHandler<Auth> = {
    get(target, prop) {
      const realAuth = getFirebaseAuth();
      return (realAuth as unknown as Record<string, unknown>)[prop as string];
    }
  };
  return new Proxy({} as Auth, handler);
})();

// Export the app as a lazy Proxy for compatibility
export const app = new Proxy({} as FirebaseApp, {
  get(target, prop) {
    const realApp = getFirebaseApp();
    return (realApp as unknown as Record<string, unknown>)[prop as string];
  }
});

export { getFirebaseApp };

// Export types for better TypeScript support
export type { Analytics, Auth, FirebaseApp };
