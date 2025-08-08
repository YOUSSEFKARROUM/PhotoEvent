const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');

// À personnaliser : eventId par défaut (doit exister dans la base)
const DEFAULT_EVENT_ID = '000000000000000000000000'; // Remplace par un vrai ObjectId d'événement
const DEFAULT_USER_ID = '000000000000000000000000'; // Remplace par un vrai ObjectId d'utilisateur

async function importOrphanPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const uploadsDir = path.join(__dirname, '../uploads/photos');
    const filesOnDisk = fs.readdirSync(uploadsDir);
    const photosInDb = await Photo.find({});
    const dbFilenames = new Set(photosInDb.map(p => (p.filename || '').toLowerCase()));
    let imported = 0;
    let alreadyExists = 0;
    let errors = 0;
    for (const file of filesOnDisk) {
      if (!dbFilenames.has(file.toLowerCase())) {
        try {
          const ext = path.extname(file).toLowerCase();
          const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
          if (!isImage) continue;
          const newPhoto = new Photo({
            filename: file,
            url: `/uploads/photos/${file}`,
            originalname: file,
            eventId: DEFAULT_EVENT_ID,
            userId: DEFAULT_USER_ID,
            uploadDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await newPhoto.save();
          imported++;
          console.log(`✅ Importé : ${file}`);
        } catch (e) {
          errors++;
          console.error(`❌ Erreur import ${file}:`, e.message);
        }
      } else {
        alreadyExists++;
      }
    }
    console.log('\n📊 Rapport import :');
    console.log(`✅ Photos importées : ${imported}`);
    console.log(`⏩ Déjà existantes : ${alreadyExists}`);
    console.log(`❌ Erreurs : ${errors}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur globale :', error);
  }
}

importOrphanPhotos(); 