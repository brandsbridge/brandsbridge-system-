import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "brands-bridge",
  apiKey: "AIzaSyCiDUpRZunrmRGFujXRfkvroHdxjJQAXyw",
  authDomain: "brands-bridge.firebaseapp.com",
  storageBucket: "brands-bridge.appspot.com",
  messagingSenderId: "479315293752",
  appId: "1:479315293752:web:1e173bd184af1edba9d8cd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCustomers() {
  const snapshot = await getDocs(collection(db, "customers"));
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id} => Name: ${doc.data().name}, Markets: ${doc.data().markets || []}`);
  });
  process.exit(0);
}

checkCustomers().catch(console.error);
