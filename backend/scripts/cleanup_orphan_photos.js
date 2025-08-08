// backend/scripts/cleanup_orphan_photos.js
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';
const uploadsDir = path.join(__dirname, '../uploads/photos');

async function cleanupOrphanPhotos() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const photos = db.collection('photos');
  const allPhotos = await photos.find({}).toArray();
  let deleted = 0;
  for (const photo of allPhotos) {
    const filename = photo.filename || photo.url;
    if (!filename) continue;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      await photos.deleteOne({ _id: photo._id });
      console.log(`Suppression de l'entrée orpheline: ${filename}`);
      deleted++;
    }
  }
  console.log(`Terminé. ${deleted} entrées orphelines supprimées.`);
  await client.close();
}

cleanupOrphanPhotos(); 