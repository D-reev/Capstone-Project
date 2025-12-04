// Free Firestore Restore Script
// Run with: node restore-script.js backups/2025-12-04_20-00-00/firestore-backup.json

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function restoreCollection(collectionName, documents, parentPath = '') {
  const collectionRef = parentPath 
    ? db.doc(parentPath).collection(collectionName)
    : db.collection(collectionName);
  
  for (const doc of documents) {
    const { id, ...data } = doc;
    
    // Separate subcollections from regular data
    const subcollections = {};
    const regularData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('_subcollection_')) {
        const subCollectionName = key.replace('_subcollection_', '');
        subcollections[subCollectionName] = value;
      } else {
        regularData[key] = value;
      }
    }
    
    // Restore document
    await collectionRef.doc(id).set(regularData);
    console.log(`   ✅ Restored document: ${id}`);
    
    // Restore subcollections
    for (const [subCollectionName, subDocs] of Object.entries(subcollections)) {
      await restoreCollection(subCollectionName, subDocs, `${collectionName}/${id}`);
    }
  }
}

async function performRestore(backupFilePath) {
  try {
    console.log('🔄 Starting Firestore restore...\n');
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    console.log(`📅 Backup from: ${backupData.timestamp}\n`);
    
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
      console.log(`📦 Restoring ${collectionName}...`);
      await restoreCollection(collectionName, documents);
      console.log(`   ✅ ${collectionName}: ${documents.length} documents restored\n`);
    }
    
    console.log('✅ Restore completed successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Please provide backup file path');
  console.log('Usage: node restore-script.js backups/2025-12-04_20-00-00/firestore-backup.json');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌ Backup file not found: ${backupFile}`);
  process.exit(1);
}

performRestore(backupFile)
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
