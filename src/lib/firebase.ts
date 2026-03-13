
import { initializeFirebase } from "@/firebase";

const { app, db, auth } = initializeFirebase();

export { app, db, auth };
