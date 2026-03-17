'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

/**
 * Singleton Firebase Initialization
 * This is the ONE TRUE SOURCE for Firebase instances in the app.
 * It prevents multiple initializations in Next.js 15 / Turbopack environments.
 */
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
