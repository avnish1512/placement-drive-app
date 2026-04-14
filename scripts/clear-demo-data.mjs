/**
 * clear-demo-data.mjs
 * Clears ALL demo/test data from Firestore.
 * Run with: node scripts/clear-demo-data.mjs
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAC0TYsSETT0RN36ItoyRdujhpZm_HikDA",
  authDomain: "ignite-4d73e.firebaseapp.com",
  projectId: "ignite-4d73e",
  storageBucket: "ignite-4d73e.firebasestorage.app",
  messagingSenderId: "61424015105",
  appId: "1:61424015105:web:f132b36df294522d3b6d00",
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  if (snapshot.empty) {
    console.log(`  ✅ ${collectionName}: already empty`);
    return 0;
  }
  // Batch delete in chunks of 499
  let count = 0;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 499) {
    const batch = writeBatch(db);
    docs.slice(i, i + 499).forEach(d => batch.delete(doc(db, collectionName, d.id)));
    await batch.commit();
    count += Math.min(499, docs.length - i);
  }
  console.log(`  🗑️  ${collectionName}: deleted ${count} documents`);
  return count;
}

async function deleteConversations() {
  const convSnapshot = await getDocs(collection(db, 'conversations'));
  if (convSnapshot.empty) {
    console.log(`  ✅ conversations: already empty`);
    return 0;
  }
  let count = 0;
  for (const convDoc of convSnapshot.docs) {
    const msgSnapshot = await getDocs(collection(db, 'conversations', convDoc.id, 'messages'));
    if (!msgSnapshot.empty) {
      const batch = writeBatch(db);
      msgSnapshot.docs.forEach(m => batch.delete(doc(db, 'conversations', convDoc.id, 'messages', m.id)));
      await batch.commit();
      count += msgSnapshot.docs.length;
    }
    await deleteDoc(doc(db, 'conversations', convDoc.id));
    count++;
  }
  console.log(`  🗑️  conversations + messages: deleted ${count} documents`);
  return count;
}

async function main() {
  console.log('\n🧹 Clearing all demo data from Firebase project: ignite-4d73e\n');
  try {
    await deleteCollection('jobs');
    await deleteCollection('applications');
    await deleteConversations();
    await deleteCollection('students');
    await deleteCollection('notifications');
    await deleteCollection('companies');
    await deleteCollection('settings');
    console.log('\n✅ All demo data cleared! App is now fresh and ready.\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
  process.exit(0);
}

main();
