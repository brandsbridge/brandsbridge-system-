'use client';

import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "@/firebase/config";

/**
 * Singleton Firebase Initialization
 * This is the ONE TRUE SOURCE for Firebase instances in the app.
 * It prevents multiple initializations in Next.js 15 / Turbopack environments.
 */
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, auth, storage };
