/**
 * Migration script: Auto-assign markets to existing suppliers
 * based on specializedProducts, topProducts, companyOverview keywords.
 *
 * Run: node scripts/migrate-markets.mjs
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCiDUpRZunrmRGFujXRfkvroHdxjJQAXyw",
  authDomain: "brands-bridge.firebaseapp.com",
  projectId: "brands-bridge",
  storageBucket: "brands-bridge.appspot.com",
  messagingSenderId: "479315293752",
  appId: "1:479315293752:web:1e173bd184af1edba9d8cd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const chocolateKeywords = /chocolate|confectionery|cocoa|candy|sweets|biscuit|wafer|snack/i;
const cosmeticsKeywords = /cosmetic|skincare|beauty|perfume|hair|cream|lotion|soap|shampoo|makeup/i;
const detergentsKeywords = /detergent|cleaning|hygiene|household|bleach|disinfect|laundry|dishwash/i;

async function migrate() {
  const auth = getAuth(app);
  const email = process.argv[2];
  const password = process.argv[3];
  if (email && password) {
    console.log(`Authenticating as ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
  } else {
    console.log("No credentials provided, using anonymous auth...");
    await signInAnonymously(auth);
  }
  console.log("Authenticated successfully.\n");

  console.log("Fetching all suppliers from Firestore...\n");
  const snapshot = await getDocs(collection(db, "suppliers"));

  const allSuppliers = [];
  snapshot.forEach(d => allSuppliers.push({ id: d.id, ...d.data() }));
  console.log(`Total suppliers in Firestore: ${allSuppliers.length}\n`);

  // Count current state
  const alreadyAssigned = allSuppliers.filter(s => s.markets && s.markets.length > 0);
  const unassigned = allSuppliers.filter(s => !s.markets || s.markets.length === 0);
  console.log(`Already have markets assigned: ${alreadyAssigned.length}`);
  console.log(`Need migration (empty markets): ${unassigned.length}\n`);

  let migrated = 0;
  let stillUnassigned = 0;
  const marketCounts = { chocolate_market: 0, cosmetics_market: 0, detergents_market: 0 };

  // Count already-assigned
  for (const s of alreadyAssigned) {
    for (const m of s.markets) {
      if (marketCounts[m] !== undefined) marketCounts[m]++;
    }
  }

  const BATCH_SIZE = 400;
  for (let i = 0; i < unassigned.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = unassigned.slice(i, i + BATCH_SIZE);
    let batchWrites = 0;

    for (const s of chunk) {
      const text = [
        ...(Array.isArray(s.specializedProducts) ? s.specializedProducts : []),
        ...(Array.isArray(s.topProducts) ? s.topProducts : []),
        s.companyOverview || "",
        s.overview || "",
        s.natureOfBusiness || "",
        s.companyName || s.name || "",
      ].join(" ");

      const markets = [];
      if (chocolateKeywords.test(text)) markets.push("chocolate_market");
      if (cosmeticsKeywords.test(text)) markets.push("cosmetics_market");
      if (detergentsKeywords.test(text)) markets.push("detergents_market");

      if (markets.length > 0) {
        batch.update(doc(db, "suppliers", s.id), {
          markets,
          updatedAt: new Date().toISOString(),
        });
        batchWrites++;
        migrated++;
        for (const m of markets) marketCounts[m]++;
      } else {
        stillUnassigned++;
        console.log(`  [UNMATCHED] "${s.companyName || s.name}" | products: ${(s.specializedProducts || []).join(", ")} | overview: ${(s.companyOverview || s.overview || "").substring(0, 80)}`);
      }
    }

    if (batchWrites > 0) {
      await batch.commit();
      console.log(`  Committed batch: ${batchWrites} suppliers updated`);
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  MIGRATION COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log(`  Migrated: ${migrated} suppliers`);
  console.log(`  Already assigned: ${alreadyAssigned.length} suppliers`);
  console.log(`  Still unassigned: ${stillUnassigned} suppliers`);
  console.log("");
  console.log("  MARKET BREAKDOWN (total per market):");
  console.log(`  ├─ Chocolate Market:  ${marketCounts.chocolate_market} suppliers`);
  console.log(`  ├─ Cosmetics Market:  ${marketCounts.cosmetics_market} suppliers`);
  console.log(`  ├─ Detergents Market: ${marketCounts.detergents_market} suppliers`);
  console.log(`  └─ Unassigned:        ${stillUnassigned} suppliers`);
  console.log("");
  console.log("  SAMPLE (first 3 chocolate_market):");
  const chocSamples = allSuppliers.filter(s => s.markets?.includes("chocolate_market")).slice(0, 3);
  for (const s of chocSamples) {
    console.log(`    - "${s.companyName || s.name}" → markets: [${s.markets.join(", ")}]`);
  }
  console.log("═══════════════════════════════════════\n");

  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
