'use client';

import { app, db, auth } from '@/lib/firebase';

/**
 * Returns the unified Firebase SDK instances.
 * This ensures consistency across components, hooks, and services.
 */
export function initializeFirebase() {
  return {
    firebaseApp: app,
    firestore: db,
    auth: auth
  };
}
