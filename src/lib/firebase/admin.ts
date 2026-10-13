import "server-only";
import {
  cert,
  getApps,
  initializeApp,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
export function adminApp() {
  const existing = getApps().find((app) => app.name === "sideby-server");
  if (existing) return existing;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId)
    throw new Error("Firebase project configuration is missing on the server.");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL,
    privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    if (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      !process.env.FIREBASE_USE_APPLICATION_DEFAULT
    )
      throw new Error(
        "Add Firebase Admin credentials to .env.local. Keep private keys on the server only.",
      );
  }
  return initializeApp(
    {
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      credential:
        clientEmail && privateKey
          ? cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, "\n"),
            })
          : applicationDefault(),
    },
    "sideby-server",
  );
}
export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
export const adminBucket = () => getStorage(adminApp()).bucket();
