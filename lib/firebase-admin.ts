import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountJson) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY env variable");
}

let app;
try {
  const serviceAccount = JSON.parse(serviceAccountJson);
  app = getApps().length === 0 
    ? initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    : getApp();
} catch (error) {
  console.error("Firebase admin initialization error:", error);
  throw error;
}

export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
export default app;
