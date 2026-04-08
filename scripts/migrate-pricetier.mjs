/**
 * Migration: Normalize priceTier field for all suppliers.
 * Checks pricing.tier, price_tier, PriceTier, "Price Tier" and copies to priceTier.
 *
 * Run: node scripts/migrate-pricetier.mjs
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

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

async function migrate() {
  const auth = getAuth(app);
  console.log("Authenticating...");
  await signInAnonymously(auth);
  console.log("OK\n");

  const snapshot = await getDocs(collection(db, "suppliers"));
  const all = [];
  snapshot.forEach(d => all.push({ id: d.id, ...d.data() }));
  console.log(`Total suppliers: ${all.length}\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let noData = 0;
  const batch = writeBatch(db);

  for (const s of all) {
    // Already has a valid priceTier
    if (s.priceTier && s.priceTier.trim() !== "") {
      alreadyOk++;
      console.log(`  ✓ "${s.companyName || s.name}" → priceTier: "${s.priceTier}"`);
      continue;
    }

    // Try to find the value in alternate locations
    const tier =
      s.pricing?.tier ||
      s.price_tier ||
      s.PriceTier ||
      s["Price Tier"] ||
      null;

    if (tier && tier.trim() !== "") {
      batch.update(doc(db, "suppliers", s.id), {
        priceTier: tier,
        updatedAt: new Date().toISOString(),
      });
      fixed++;
      console.log(`  ★ "${s.companyName || s.name}" → migrated pricing.tier "${tier}" → priceTier`);
    } else {
      noData++;
      console.log(`  ✗ "${s.companyName || s.name}" → no price tier data found anywhere`);
    }
  }

  if (fixed > 0) {
    await batch.commit();
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  PRICE TIER MIGRATION COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log(`  Already correct:  ${alreadyOk}`);
  console.log(`  Migrated:         ${fixed}`);
  console.log(`  No data anywhere: ${noData}`);
  console.log("═══════════════════════════════════════\n");

  // Show final state
  console.log("FINAL STATE:");
  const snapshot2 = await getDocs(collection(db, "suppliers"));
  snapshot2.forEach(d => {
    const data = d.data();
    const name = data.companyName || data.name || d.id;
    const pt = data.priceTier || "(empty)";
    const legacy = data.pricing?.tier || "(none)";
    console.log(`  ${name.padEnd(35)} priceTier: ${pt.padEnd(12)} pricing.tier: ${legacy}`);
  });

  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
