'use client';

import { initializeFirebase } from "@/firebase/init";

/**
 * Shared SDK instances for non-React contexts or direct access.
 * We initialize the services and map them to the application's expected keys.
 */
const services = initializeFirebase();

export const app = services.firebaseApp;
export const db = services.firestore;
export const auth = services.auth;
