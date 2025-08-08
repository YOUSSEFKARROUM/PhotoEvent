const fs = require('fs');
const path = require('path');
const FaceService = require('../services/faceService');

async function testPerformance() {
  const testImages = [
    'test_small.jpg',    // < 500KB
    'test_medium.jpg',   // 1-2MB  
    'test_large.jpg'     // 3-5MB
  ];

  console.log('🧪 Test de performance DeepFace\n');

  for (const imageName of testImages) {
    const imagePath = path.join(__dirname, 'test_images', imageName);
    
    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️ Image manquante: ${imageName}`);
      continue;
    }

    const stats = fs.statSync(imagePath);
    console.log(`📸 Test: ${imageName} (${(stats.size / 1024).toFixed(1)} KB)`);

    const startTime = Date.now();
    
    try {
      const encoding = await FaceService.extractFaceEncoding(imagePath);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Succès en ${duration}ms`);
      console.log(`📊 Encoding: ${encoding ? 'OK' : 'FAIL'}\n`);
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}\n`);
    }
  }
}

testPerformance().catch(console.error); 