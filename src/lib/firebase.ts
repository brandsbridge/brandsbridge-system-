'use client';

import { initializeFirebase } from "@/firebase/init";

/**
 * Shared SDK instances for non-React contexts or direct access.
 * We map the internal keys (firestore -> db, firebaseApp -> app) 
 * to match the application's historical usage.
 */
const { firebaseApp: app, firestore: db, auth } = initializeFirebase();

export { app, db, auth };
