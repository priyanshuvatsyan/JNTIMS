import 'dotenv/config';
import { collection, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const COLLECTIONS = [
  'companies',
  'stockArrivalDate',
  'stockData',
  'sales',
  'payments',
  'manualDues',
];

async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    console.log(`- ${collectionName}: no documents to delete`);
    return 0;
  }

  const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref));
  await Promise.all(deletePromises);
  console.log(`- ${collectionName}: deleted ${snapshot.size} documents`);
  return snapshot.size;
}

async function main() {
  console.log('🔄 Clearing automation test collections...');
  let total = 0;

  for (const collectionName of COLLECTIONS) {
    try {
      total += await clearCollection(collectionName);
    } catch (error) {
      console.error(`Failed to clear ${collectionName}:`, error.message || error);
    }
  }

  console.log(`✅ Cleanup complete. Total deleted documents: ${total}`);
}

main().catch((error) => {
  console.error('Cleanup failed:', error.message || error);
  process.exit(1);
});
