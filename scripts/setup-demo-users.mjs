import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brands-bridge",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCiDUpRZunrmRGFujXRfkvroHdxjJQAXyw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "brands-bridge.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoUsers = [
  {
    email: "admin@brandsbridge.com",
    password: "Admin@1234",
    name: "Super Admin",
    role: "super_admin",
    assignedMarket: null
  },
  {
    email: "chocolate@brandsbridge.com",
    password: "Choco@1234",
    name: "Chocolate Manager",
    role: "chocolate_manager",
    assignedMarket: "chocolate"
  },
  {
    email: "cosmetics@brandsbridge.com",
    password: "Cosmo@1234",
    name: "Cosmetics Manager",
    role: "cosmetics_manager",
    assignedMarket: "cosmetics"
  },
  {
    email: "detergents@brandsbridge.com",
    password: "Deterg@1234",
    name: "Detergents Manager",
    role: "detergents_manager",
    assignedMarket: "detergents"
  },
  {
    email: "finance@brandsbridge.com",
    password: "Finance@1234",
    name: "Finance Manager",
    role: "finance_manager",
    assignedMarket: null
  }
];

async function setupDemoUsers() {
  for (const user of demoUsers) {
    try {
      console.log(`Setting up ${user.email}...`);
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        uid: uid,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedMarket: user.assignedMarket,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`Successfully created ${user.email} -> UID: ${uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists. Skipping auth creation.`);
        // Note: we can't easily seed the 'users' collection document without the UID, 
        // but since it's a demo, the user probably doesn't exist yet. 
        // If they do, we'd need to sign in to get the UID, then setDoc.
      } else {
        console.error(`Error creating ${user.email}:`, error);
      }
    }
  }
}

setupDemoUsers().then(() => {
  console.log("Done seeding users.");
  process.exit(0);
}).catch(console.error);
