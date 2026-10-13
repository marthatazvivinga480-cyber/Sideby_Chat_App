import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const configured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);
export const storageEnabled =
  process.env.NEXT_PUBLIC_FIREBASE_ENABLE_STORAGE === "true";
export function clientApp() {
  if (!configured)
    throw new Error(
      "Firebase is not configured. Explore the demo or add your environment values.",
    );
  return getApps().length ? getApp() : initializeApp(config);
}
export const clientAuth = () => getAuth(clientApp());
export const clientDb = () => getFirestore(clientApp());
export const clientStorage = () => getStorage(clientApp());
