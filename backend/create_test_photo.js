const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/photoevents';
const dbName = uri.split('/').pop() || 'photoevents';
const uploadsDir = path.join(__dirname, 'uploads/photos');

// Génère une image PNG blanche de 200x200
function createWhiteImage(filePath) {
  const pngHeader = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0xC8,0x00,0x00,0x00,0xC8,0x08,0x02,0x00,0x00,0x00,0xFF,0xFF,0xFF
  ]); // Juste un header minimal, pas une vraie image, mais suffisant pour test
  fs.writeFileSync(filePath, pngHeader);
}

async function createTestPhoto() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const testFilename = 'test-photo-automatique.png';
  const filePath = path.join(uploadsDir, testFilename);
  if (!fs.existsSync(filePath)) {
    createWhiteImage(filePath);
    console.log('✅ Image de test créée:', filePath);
  } else {
    console.log('ℹ️ Image de test déjà présente:', filePath);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const photos = db.collection('photos');
  // Vérifier si déjà présente
  const existing = await photos.findOne({ url: testFilename });
  if (!existing) {
    await photos.insertOne({
      url: testFilename,
      filename: testFilename,
      eventsId: 'test-event',
      uploadedAt: new Date(),
      face_encodings: [[...Array(128)].map(() => Math.random() * 2 - 1)],
      description: 'Photo de test automatique',
      uploadedBy: null
    });
    console.log('✅ Entrée MongoDB ajoutée pour la photo de test.');
  } else {
    console.log('ℹ️ Entrée MongoDB déjà présente pour la photo de test.');
  }
  await client.close();
}

createTestPhoto(); 