// Script Node.js pour vérifier les fichiers photos manquants
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URL = process.env.DATABASE_URL;
const PHOTOS_DIR = path.join(__dirname, 'uploads/photos');

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const dbName = MONGO_URL.split('/').pop();
  const db = client.db(dbName);
  const photos = await db.collection('photos').find({}).toArray();

  const missing = [];
  for (const photo of photos) {
    const filename = photo.url || photo.filename;
    if (!filename) continue;
    const filePath = path.join(PHOTOS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      missing.push(filename);
    }
  }

  if (missing.length === 0) {
    console.log('✅ Tous les fichiers photos sont présents dans uploads/photos/');
  } else {
    console.log('❌ Fichiers manquants dans uploads/photos/ :');
    missing.forEach(f => console.log(' -', f));
  }
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); }); 