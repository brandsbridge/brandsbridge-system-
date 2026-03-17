'use client';

/**
 * Bridges the unified singleton from src/lib/firebase.ts
 * to the internal Firebase provider system.
 */
import { app, db, auth } from '@/lib/firebase';

export function initializeFirebase() {
  return {
    firebaseApp: app,
    firestore: db,
    auth: auth
  };
}
