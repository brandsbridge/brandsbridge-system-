import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'brands-bridge' // Specify explicit explicit if env var not set
});

const db = getFirestore(app);

async function migrate() {
  console.log("Migrating customers...");
  const customers = await db.collection('customers').get();
  let count = 0;
  for (const doc of customers.docs) {
    if (!doc.data().markets) {
      await doc.ref.update({ markets: [] });
      count++;
    }
  }
  console.log(`Updated ${count} customers.`);
  
  console.log("Migrating suppliers...");
  const suppliers = await db.collection('suppliers').get();
  count = 0;
  for (const doc of suppliers.docs) {
    if (!doc.data().markets) {
      await doc.ref.update({ markets: [] });
      count++;
    }
  }
  console.log(`Updated ${count} suppliers.`);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
