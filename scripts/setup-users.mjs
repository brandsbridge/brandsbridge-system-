import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  projectId: "brands-bridge",
  apiKey: "AIzaSyCiDUpRZunrmRGFujXRfkvroHdxjJQAXyw",
  authDomain: "brands-bridge.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersToCreate = [
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
    assignedMarket: "chocolate_market"
  },
  {
    email: "cosmetics@brandsbridge.com",
    password: "Cosmo@1234",
    name: "Cosmetics Manager",
    role: "cosmetics_manager",
    assignedMarket: "cosmetics_market"
  },
  {
    email: "detergents@brandsbridge.com",
    password: "Deterg@1234",
    name: "Detergents Manager",
    role: "detergents_manager",
    assignedMarket: "detergents_market"
  },
  {
    email: "finance@brandsbridge.com",
    password: "Finance@1234",
    name: "Finance Manager",
    role: "finance_manager",
    assignedMarket: null
  }
];

async function setup() {
  console.log("Starting RBAC User Creation...");
  for (const user of usersToCreate) {
    let uid;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      uid = userCredential.user.uid;
      console.log(`Created Auth User: ${user.email} (UID: ${uid})`);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists. Signing in to get UID...`);
        const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
        uid = userCredential.user.uid;
      } else {
        console.error(`Failed to create/login ${user.email}:`, e);
        continue;
      }
    }

    try {
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedMarket: user.assignedMarket,
        createdAt: serverTimestamp()
      });
      console.log(`Created/Updated Firestore Document for users/${uid}`);
    } catch (dbErr) {
      console.error(`Failed to create Firestore doc for ${user.email}:`, dbErr);
    }
  }

  console.log("Finished executing user creation script.");
  process.exit(0);
}

setup();
