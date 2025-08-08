const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Photo = require('../models/Photo');

async function fixPhotoUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Récupérer toutes les photos sans URL ou avec URL incorrecte
    const photosToFix = await Photo.find({
      $or: [
        { url: { $exists: false } },
        { url: null },
        { url: '' },
        { url: { $not: /^\/api\/uploads\/photos\// } }
      ]
    });
    console.log(`🔍 ${photosToFix.length} photos à corriger`);
    for (let photo of photosToFix) {
      if (photo.filename) {
        photo.url = `/api/uploads/photos/${photo.filename}`;
        await photo.save();
        console.log(`✅ Photo ${photo._id} corrigée`);
      }
    }
    console.log('🎉 Migration terminée !');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

fixPhotoUrls(); 