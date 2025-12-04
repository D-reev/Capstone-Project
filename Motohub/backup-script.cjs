// Free Firestore Backup Script
// Run with: node backup-script.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with your service account
// Download from Firebase Console -> Project Settings -> Service Accounts
const serviceAccount = require('./firebaseServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to backup a collection
async function backupCollection(collectionName, parentPath = '') {
  const collectionRef = parentPath 
    ? db.doc(parentPath).collection(collectionName)
    : db.collection(collectionName);
    
  const snapshot = await collectionRef.get();
  const data = [];
  
  for (const doc of snapshot.docs) {
    const docData = {
      id: doc.id,
      ...doc.data()
    };
    
    // Backup subcollections if any
    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      const subPath = parentPath ? `${parentPath}/${collectionName}/${doc.id}` : `${collectionName}/${doc.id}`;
      docData[`_subcollection_${subcollection.id}`] = await backupCollection(subcollection.id, `${collectionName}/${doc.id}`);
    }
    
    data.push(docData);
  }
  
  return data;
}

async function performBackup() {
  try {
    const timestamp = new Date().toISOString().split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupDir = path.join(__dirname, 'backups', timestamp);
    
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Starting Firestore backup...\n');
    
    // List all your root collections
    const collections = ['users', 'promotions', 'inventory', 'logs', 'serviceReports'];
    
    const backupData = {
      timestamp: new Date().toISOString(),
      collections: {}
    };
    
    for (const collectionName of collections) {
      console.log(`📦 Backing up ${collectionName}...`);
      try {
        const data = await backupCollection(collectionName);
        backupData.collections[collectionName] = data;
        console.log(`   ✅ ${collectionName}: ${data.length} documents\n`);
      } catch (err) {
        console.error(`   ❌ Error backing up ${collectionName}:`, err.message);
      }
    }
    
    // Save complete backup as single JSON file
    const backupFile = path.join(backupDir, 'firestore-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    // Calculate file size
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Location: ${backupDir}`);
    console.log(`💾 Size: ${fileSizeMB} MB`);
    console.log(`📊 Total documents: ${Object.values(backupData.collections).reduce((sum, col) => sum + col.length, 0)}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Run backup
performBackup()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
