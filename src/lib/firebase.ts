'use client';

import { initializeFirebase } from "@/firebase/init";

/**
 * Shared SDK instances for non-React contexts or direct access.
 */
const { app, db, auth } = initializeFirebase();

export { app, db, auth };
