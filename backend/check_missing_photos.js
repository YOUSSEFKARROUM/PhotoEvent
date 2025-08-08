// Script Node.js pour vérifier les fichiers photos manquants
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Photo = require('./models/Photo');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photoevents';
const uploadsDir = path.join(__dirname, 'uploads', 'photos');

async function checkMissingPhotos() {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const photos = await Photo.find({});
  let missing = [];

  for (const photo of photos) {
    const filename = photo.filename || photo.url;
    if (!filename) continue;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      missing.push(filename);
    }
  }

  if (missing.length === 0) {
    console.log('✅ Tous les fichiers référencés existent sur le disque.');
  } else {
    console.log('❌ Fichiers manquants :');
    missing.forEach(f => console.log(' -', f));
  }

  await mongoose.disconnect();
}

checkMissingPhotos().catch(err => {
  console.error('Erreur lors de la vérification des fichiers photos :', err);
  process.exit(1);
}); 