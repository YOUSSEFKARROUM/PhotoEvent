const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const runDiagnostic = async () => {
  console.log('=== DIAGNOSTIC PHOTOEVENTS ===\n');

  // 1. Vérification des dossiers
  const uploadsDir = path.join(__dirname, 'uploads', 'photos');
  console.log('1. Vérification des dossiers:');
  console.log(`   - Dossier uploads existe: ${fs.existsSync(uploadsDir)}`);

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`   - Nombre de fichiers: ${files.length}`);
    console.log(`   - Permissions: ${fs.statSync(uploadsDir).mode.toString(8)}`);
  }

  // 2. Connexion à la base de données
  console.log('\n2. Vérification base de données:');
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    const dbName = uri.split('/').pop();
    await client.connect();
    const db = client.db(dbName);

    const photosCount = await db.collection('photos').countDocuments();
    const eventsCount = await db.collection('events').countDocuments();

    console.log(`   - Photos en DB: ${photosCount}`);
    console.log(`   - Événements en DB: ${eventsCount}`);

    // 3. Vérification cohérence fichiers/DB
    console.log('\n3. Vérification cohérence:');
    const photos = await db.collection('photos').find({}).toArray();
    let missingCount = 0;

    for (const photo of photos) {
      const filename = photo.filename || photo.url;
      if (!filename) continue;
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        missingCount++;
        console.log(`   - Manquant: ${filename}`);
      }
    }

    console.log(`   - Fichiers manquants: ${missingCount}/${photosCount}`);

    await client.close();

  } catch (error) {
    console.error('   - Erreur DB:', error.message);
  }

  console.log('\n=== FIN DIAGNOSTIC ===');
};

runDiagnostic(); 