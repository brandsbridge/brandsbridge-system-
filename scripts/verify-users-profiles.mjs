import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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

async function verifyAndUpdateProfiles() {
  for (const user of demoUsers) {
    try {
      console.log(`\nVerifying ${user.email}...`);
      
      // Sign in to get the UID
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      // Check if profile document exists
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log(`✓ Profile exists for ${user.email}:`, data);
      } else {
        console.log(`✗ Profile missing for ${user.email}. Creating...`);
        
        // Create the profile if it doesn't exist
        await setDoc(userDocRef, {
          uid: uid,
          email: user.email,
          name: user.name,
          role: user.role,
          assignedMarket: user.assignedMarket,
          createdAt: new Date().toISOString()
        });
        
        console.log(`✓ Profile created for ${user.email}`);
      }
    } catch (error) {
      console.error(`Error verifying ${user.email}:`, error.message);
    }
  }
}

verifyAndUpdateProfiles().then(() => {
  console.log("\n✓ Profile verification complete.");
  process.exit(0);
}).catch(console.error);
