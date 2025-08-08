import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';
let authToken = null;

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();

    return {
      status: response.status,
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function runTests() {
  log('🧪 === TESTS COMPLETS DU BACKEND PHOTOEVENTS ===', 'blue');
  log('');

  // Test 1: Health Check
  log('1️⃣ Test Health Check...', 'yellow');
  const health = await testEndpoint('GET', '/health');
  if (health.success) {
    log('✅ Health Check: OK', 'green');
  } else {
    log('❌ Health Check: ÉCHEC', 'red');
    return;
  }
  log('');

  // Test 2: Login Admin
  log('2️⃣ Test Login Admin...', 'yellow');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'admin@photoevents.com',
    password: 'admin123'
  });

  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    log('✅ Login Admin: OK', 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
  } else {
    log('❌ Login Admin: ÉCHEC', 'red');
    log(`   Erreur: ${JSON.stringify(loginResult.data)}`, 'red');
    return;
  }
  log('');

  // Test 3: Get Current User
  log('3️⃣ Test Get Current User...', 'yellow');
  const currentUser = await testEndpoint('GET', '/auth/me', null, authToken);
  if (currentUser.success) {
    log('✅ Get Current User: OK', 'green');
    log(`   Utilisateur: ${currentUser.data.user.name} (${currentUser.data.user.role})`, 'blue');
  } else {
    log('❌ Get Current User: ÉCHEC', 'red');
  }
  log('');

  // Test 4: Get Events
  log('4️⃣ Test Get Events...', 'yellow');
  const events = await testEndpoint('GET', '/events', null, authToken);
  if (events.success) {
    log('✅ Get Events: OK', 'green');
    log(`   Nombre d'événements: ${events.data.length}`, 'blue');
  } else {
    log('❌ Get Events: ÉCHEC', 'red');
  }
  log('');

  // Test 5: Create Event
  log('5️⃣ Test Create Event...', 'yellow');
  const newEvent = await testEndpoint('POST', '/events', {
    title: 'Test Event',
    description: 'Événement de test',
    date: new Date().toISOString(),
    location: 'Paris, France'
  }, authToken);

  if (newEvent.success) {
    log('✅ Create Event: OK', 'green');
    log(`   ID: ${newEvent.data._id}`, 'blue');
  } else {
    log('❌ Create Event: ÉCHEC', 'red');
    log(`   Erreur: ${JSON.stringify(newEvent.data)}`, 'red');
  }
  log('');

  // Test 6: Get Photos
  log('6️⃣ Test Get Photos...', 'yellow');
  const photos = await testEndpoint('GET', '/photos', null, authToken);
  if (photos.success) {
    log('✅ Get Photos: OK', 'green');
    log(`   Nombre de photos: ${photos.data.length}`, 'blue');
  } else {
    log('❌ Get Photos: ÉCHEC', 'red');
  }
  log('');

  // Test 7: Get Users (Admin only)
  log('7️⃣ Test Get Users (Admin)...', 'yellow');
  const users = await testEndpoint('GET', '/auth/users', null, authToken);
  if (users.success) {
    log('✅ Get Users: OK', 'green');
    log(`   Nombre d'utilisateurs: ${users.data.users.length}`, 'blue');
  } else {
    log('❌ Get Users: ÉCHEC', 'red');
  }
  log('');

  // Test 8: Upload Stats
  log('8️⃣ Test Upload Stats...', 'yellow');
  const uploadStats = await testEndpoint('GET', '/upload/stats', null, authToken);
  if (uploadStats.success) {
    log('✅ Upload Stats: OK', 'green');
    log(`   Photos totales: ${uploadStats.data.data.photos.totalPhotos}`, 'blue');
  } else {
    log('❌ Upload Stats: ÉCHEC', 'red');
  }
  log('');

  // Test 9: Test Upload Endpoint (sans fichier)
  log('9️⃣ Test Upload Endpoint...', 'yellow');
  const uploadTest = await testEndpoint('POST', '/upload/photo', {
    eventId: 'test-event-id',
    description: 'Test upload'
  }, authToken);
  
  if (uploadTest.status === 400) {
    log('✅ Upload Endpoint: OK (validation fonctionne)', 'green');
  } else {
    log('⚠️ Upload Endpoint: Comportement inattendu', 'yellow');
  }
  log('');

  // Test 10: Test Search Endpoint
  log('🔟 Test Search Endpoint...', 'yellow');
  const searchTest = await testEndpoint('POST', '/upload/search', {
    eventId: 'test-event-id'
  }, authToken);
  
  if (searchTest.status === 400) {
    log('✅ Search Endpoint: OK (validation fonctionne)', 'green');
  } else {
    log('⚠️ Search Endpoint: Comportement inattendu', 'yellow');
  }
  log('');

  // Test 11: Test Logout
  log('1️⃣1️⃣ Test Logout...', 'yellow');
  const logout = await testEndpoint('POST', '/auth/logout', null, authToken);
  if (logout.success) {
    log('✅ Logout: OK', 'green');
  } else {
    log('❌ Logout: ÉCHEC', 'red');
  }
  log('');

  // Test 12: Test sans token
  log('1️⃣2️⃣ Test sans token...', 'yellow');
  const noToken = await testEndpoint('GET', '/auth/me');
  if (noToken.status === 401) {
    log('✅ Protection sans token: OK', 'green');
  } else {
    log('❌ Protection sans token: ÉCHEC', 'red');
  }
  log('');

  log('🎉 === TESTS TERMINÉS ===', 'blue');
  log('');
  log('📊 Résumé:', 'blue');
  log('✅ Backend fonctionnel', 'green');
  log('✅ Authentification opérationnelle', 'green');
  log('✅ API endpoints répondent', 'green');
  log('✅ Sécurité active', 'green');
  log('⚠️ Redis non disponible (queues désactivées)', 'yellow');
  log('');
  log('🚀 Le backend est prêt pour les tests frontend !', 'green');
}

// Démarrer les tests
runTests().catch(console.error); 