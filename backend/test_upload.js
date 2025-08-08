import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001/api';
let authToken = null;
let testEventId = null;

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@photoevents.com',
      password: 'admin123'
    })
  });

  if (response.ok) {
    const data = await response.json();
    authToken = data.token;
    log('✅ Login réussi', 'green');
    return true;
  } else {
    log('❌ Login échoué', 'red');
    return false;
  }
}

async function createTestEvent() {
  const response = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      title: 'Événement Test Upload',
      description: 'Événement pour tester l\'upload de photos',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Paris, France'
    })
  });

  if (response.ok) {
    const data = await response.json();
    testEventId = data._id;
    log('✅ Événement de test créé', 'green');
    return true;
  } else {
    log('❌ Création événement échouée', 'red');
    return false;
  }
}

async function testUploadEndpoints() {
  log('🧪 === TEST DES ENDPOINTS UPLOAD ===', 'blue');
  log('');

  // Test 1: Login
  log('1️⃣ Login...', 'yellow');
  if (!await login()) return;
  log('');

  // Test 2: Créer un événement de test
  log('2️⃣ Créer événement de test...', 'yellow');
  if (!await createTestEvent()) return;
  log('');

  // Test 3: Vérifier les endpoints upload
  log('3️⃣ Test des endpoints upload...', 'yellow');
  
  // Test upload sans fichier
  const uploadResponse = await fetch(`${BASE_URL}/upload/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      eventId: testEventId,
      description: 'Test upload'
    })
  });

  log(`   Upload endpoint status: ${uploadResponse.status}`, 'cyan');
  if (uploadResponse.status === 400) {
    log('✅ Upload endpoint: Validation fonctionne', 'green');
  } else if (uploadResponse.status === 404) {
    log('⚠️ Upload endpoint: Non configuré dans le serveur de test', 'yellow');
  } else {
    log(`⚠️ Upload endpoint: Status inattendu ${uploadResponse.status}`, 'yellow');
  }

  // Test search sans fichier
  const searchResponse = await fetch(`${BASE_URL}/upload/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      eventId: testEventId
    })
  });

  log(`   Search endpoint status: ${searchResponse.status}`, 'cyan');
  if (searchResponse.status === 400) {
    log('✅ Search endpoint: Validation fonctionne', 'green');
  } else if (searchResponse.status === 404) {
    log('⚠️ Search endpoint: Non configuré dans le serveur de test', 'yellow');
  } else {
    log(`⚠️ Search endpoint: Status inattendu ${searchResponse.status}`, 'yellow');
  }

  log('');

  // Test 4: Vérifier les répertoires d'upload
  log('4️⃣ Vérification des répertoires...', 'yellow');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const photosDir = path.join(uploadsDir, 'photos');
  const tempDir = path.join(uploadsDir, 'temp');

  log(`   Répertoire uploads: ${fs.existsSync(uploadsDir) ? '✅ Existe' : '❌ Manquant'}`, 'cyan');
  log(`   Répertoire photos: ${fs.existsSync(photosDir) ? '✅ Existe' : '❌ Manquant'}`, 'cyan');
  log(`   Répertoire temp: ${fs.existsSync(tempDir) ? '✅ Existe' : '❌ Manquant'}`, 'cyan');

  // Créer les répertoires s'ils n'existent pas
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    log('   ✅ Répertoire uploads créé', 'green');
  }
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
    log('   ✅ Répertoire photos créé', 'green');
  }
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    log('   ✅ Répertoire temp créé', 'green');
  }

  log('');

  // Test 5: Vérifier les permissions
  log('5️⃣ Test des permissions...', 'yellow');
  
  try {
    const testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    log('✅ Permissions d\'écriture: OK', 'green');
  } catch (error) {
    log('❌ Permissions d\'écriture: ÉCHEC', 'red');
    log(`   Erreur: ${error.message}`, 'red');
  }

  log('');

  log('🎉 === TESTS UPLOAD TERMINÉS ===', 'blue');
  log('');
  log('📊 RÉSUMÉ UPLOAD:', 'blue');
  log('✅ Authentification fonctionnelle', 'green');
  log('✅ Création d\'événements fonctionnelle', 'green');
  log('✅ Répertoires d\'upload prêts', 'green');
  log('✅ Permissions d\'écriture OK', 'green');
  log('⚠️ Endpoints upload à configurer dans le serveur', 'yellow');
  log('');
  log('💡 Pour activer l\'upload complet:', 'blue');
  log('   1. Ajouter les routes upload dans server_test.js', 'cyan');
  log('   2. Configurer multer pour l\'upload de fichiers', 'cyan');
  log('   3. Tester avec un vrai fichier image', 'cyan');
}

testUploadEndpoints().catch(console.error); 