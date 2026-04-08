/**
 * Migration: Fix priceTier, supportPhone, supportEmail for all suppliers.
 * Checks all possible alternate field names and consolidates.
 *
 * Run: node scripts/migrate-support-fields.mjs
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

function findValue(obj, ...paths) {
  for (const p of paths) {
    // direct field
    if (obj[p] && obj[p].toString().trim()) return obj[p].toString().trim();
  }
  // Also check nested contacts
  if (obj.contacts) {
    if (obj.contacts.support?.phone) return obj.contacts.support.phone;
    if (obj.contacts.support?.email) return obj.contacts.support.email;
    if (obj.contacts.sales?.phone) return obj.contacts.sales.phone;
  }
  return "";
}

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
  const batch = writeBatch(db);

  for (const s of all) {
    const updates = {};
    const name = s.companyName || s.name || s.id;

    // --- priceTier ---
    if (!s.priceTier || !s.priceTier.trim()) {
      const val = s.pricing?.tier || s.price_tier || s.PriceTier || s["Price Tier"] || "";
      if (val.trim()) {
        updates.priceTier = val.trim();
      }
    }

    // --- supportPhone ---
    if (!s.supportPhone || !s.supportPhone.trim()) {
      const val =
        s["Support - Customer Service Number"] ||
        s["support - Customer Service number"] ||
        s["Support - Customer Service number"] ||
        s["support - customer service number"] ||
        s.support_phone ||
        s.contacts?.support?.phone ||
        s.contacts?.sales?.phone ||
        "";
      if (val.toString().trim()) {
        updates.supportPhone = val.toString().trim();
      }
    }

    // --- supportEmail ---
    if (!s.supportEmail || !s.supportEmail.trim()) {
      const val =
        s["Support - Customer Service Email"] ||
        s["support - Customer Service email"] ||
        s["Support - Customer Service email"] ||
        s["support - customer service email"] ||
        s.support_email ||
        s.contacts?.support?.email ||
        "";
      if (val.toString().trim()) {
        updates.supportEmail = val.toString().trim();
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      batch.update(doc(db, "suppliers", s.id), updates);
      fixed++;
      console.log(`  ★ ${name}`);
      for (const [k, v] of Object.entries(updates)) {
        if (k !== "updatedAt") console.log(`      ${k}: "${v}"`);
      }
    }
  }

  if (fixed > 0) {
    await batch.commit();
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  MIGRATION COMPLETE — ${fixed} suppliers updated`);
  console.log(`═══════════════════════════════════════\n`);

  // Final verification
  console.log("VERIFICATION (all suppliers):");
  console.log("Name".padEnd(40) + "priceTier".padEnd(22) + "supportPhone".padEnd(20) + "supportEmail");
  console.log("─".repeat(110));
  const snap2 = await getDocs(collection(db, "suppliers"));
  snap2.forEach(d => {
    const data = d.data();
    const n = (data.companyName || data.name || d.id).substring(0, 38).padEnd(40);
    const pt = (data.priceTier || "—").substring(0, 20).padEnd(22);
    const sp = (data.supportPhone || "—").substring(0, 18).padEnd(20);
    const se = (data.supportEmail || "—").substring(0, 30);
    console.log(n + pt + sp + se);
  });

  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
