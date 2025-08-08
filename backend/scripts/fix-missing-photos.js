const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');

async function fixAndDiagnosePhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Diagnostic avancé des fichiers photos...');
    
    const allPhotos = await Photo.find({});
    const uploadsDir = path.join(__dirname, '../uploads/photos');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Dossier uploads/photos créé');
    }
    
    // Lister tous les fichiers sur le disque
    const filesOnDisk = fs.readdirSync(uploadsDir);
    const filesOnDiskSet = new Set(filesOnDisk.map(f => f.toLowerCase()));
    
    let existingFiles = 0;
    let missingFiles = 0;
    let fixedUrls = 0;
    let orphans = [];
    let missing = [];
    
    for (let photo of allPhotos) {
      let filePath = null;
      let shouldUpdate = false;
      let filename = photo.filename;
      if (!filename && photo.path) {
        filename = photo.path.split('/').pop();
      }
      if (filename) {
        filePath = path.join(uploadsDir, filename);
        // Vérification insensible à la casse
        const exists = filesOnDiskSet.has(filename.toLowerCase());
        if (exists) {
          existingFiles++;
        } else {
          missingFiles++;
          missing.push(filename);
          console.log(`❌ Fichier manquant: ${filename}`);
        }
        // Corriger URL si nécessaire
        if (!photo.url || !photo.url.includes(filename)) {
          photo.url = `/uploads/photos/${filename}`;
          shouldUpdate = true;
          fixedUrls++;
        }
        if (shouldUpdate) {
          await photo.save();
        }
      }
    }
    // Fichiers orphelins (présents sur le disque mais pas en base)
    const dbFilenames = new Set(allPhotos.map(p => (p.filename || (p.path ? p.path.split('/').pop() : '') || '').toLowerCase()));
    for (const file of filesOnDisk) {
      if (!dbFilenames.has(file.toLowerCase())) {
        orphans.push(file);
      }
    }
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`✅ Fichiers existants (liés à la base): ${existingFiles}`);
    console.log(`❌ Fichiers manquants (en base mais pas sur disque): ${missingFiles}`);
    if (missing.length > 0) console.log('Liste des fichiers manquants:', missing);
    console.log(`🔧 URLs corrigées: ${fixedUrls}`);
    console.log(`🗃️ Fichiers orphelins (sur disque mais pas en base): ${orphans.length}`);
    if (orphans.length > 0) console.log('Liste des orphelins:', orphans);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixAndDiagnosePhotos(); 