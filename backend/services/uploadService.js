const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class UploadService {
  constructor() {
    this.maxWidth = 1200;
    this.maxHeight = 1200;
    this.quality = 85;
    this.referenceMaxSize = 800; // Plus petit pour les selfies
  }

  async optimizeImage(inputPath, filename) {
    const startTime = Date.now();
    console.log('📐 Optimisation image:', filename);
    try {
      const outputPath = path.join(
        path.dirname(inputPath),
        `optimized_${filename}`
      );
      // Traitement avec Sharp (plus rapide)
      await sharp(inputPath)
        .resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: this.quality,
          progressive: true,
          mozjpeg: true // Compression plus efficace
        })
        .toFile(outputPath);
      // Supprimer l'original
      await fs.unlink(inputPath);
      const processingTime = Date.now() - startTime;
      console.log(`✅ Optimisation terminée en ${processingTime}ms`);
      return outputPath;
    } catch (error) {
      console.error('Erreur optimisation:', error);
      throw error;
    }
  }

  async optimizeReferenceImage(inputPath) {
    const startTime = Date.now();
    console.log('🤳 Optimisation selfie référence');
    try {
      const outputPath = inputPath.replace('.jpg', '_ref.jpg');
      // Traitement spécial pour selfie (plus petit, plus rapide)
      await sharp(inputPath)
        .resize(this.referenceMaxSize, this.referenceMaxSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 90, // Qualité plus haute pour la reconnaissance
          progressive: false
        })
        .toFile(outputPath);
      await fs.unlink(inputPath);
      const processingTime = Date.now() - startTime;
      console.log(`✅ Optimisation selfie terminée en ${processingTime}ms`);
      return outputPath;
    } catch (error) {
      console.error('Erreur optimisation selfie:', error);
      throw error;
    }
  }
}

module.exports = new UploadService(); 