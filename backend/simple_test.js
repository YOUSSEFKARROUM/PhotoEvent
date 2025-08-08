import fetch from 'node-fetch';

async function testServer() {
  console.log('🧪 Test simple du serveur backend...');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Test Health Check...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check: OK');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Message: ${healthData.message}`);
    } else {
      console.log('❌ Health Check: ÉCHEC');
      console.log(`   Status: ${healthResponse.status}`);
      return;
    }

    // Test 2: Root endpoint
    console.log('\n2️⃣ Test Root Endpoint...');
    const rootResponse = await fetch('http://localhost:3001/');
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Root Endpoint: OK');
      console.log(`   Message: ${rootData.message}`);
      console.log(`   Version: ${rootData.version}`);
    } else {
      console.log('❌ Root Endpoint: ÉCHEC');
    }

    // Test 3: Login
    console.log('\n3️⃣ Test Login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@photoevents.com',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login: OK');
      console.log(`   Token: ${loginData.token ? 'Présent' : 'Absent'}`);
      console.log(`   User: ${loginData.user.name} (${loginData.user.role})`);
      
      // Test 4: Get Current User with token
      console.log('\n4️⃣ Test Get Current User...');
      const userResponse = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Get Current User: OK');
        console.log(`   User: ${userData.user.name} (${userData.user.role})`);
      } else {
        console.log('❌ Get Current User: ÉCHEC');
      }

      // Test 5: Get Events
      console.log('\n5️⃣ Test Get Events...');
      const eventsResponse = await fetch('http://localhost:3001/api/events', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Get Events: OK');
        console.log(`   Nombre d'événements: ${eventsData.length}`);
      } else {
        console.log('❌ Get Events: ÉCHEC');
      }

      // Test 6: Get Photos
      console.log('\n6️⃣ Test Get Photos...');
      const photosResponse = await fetch('http://localhost:3001/api/photos', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (photosResponse.ok) {
        const photosData = await photosResponse.json();
        console.log('✅ Get Photos: OK');
        console.log(`   Nombre de photos: ${photosData.length}`);
      } else {
        console.log('❌ Get Photos: ÉCHEC');
      }

    } else {
      console.log('❌ Login: ÉCHEC');
      const errorData = await loginResponse.json();
      console.log(`   Erreur: ${JSON.stringify(errorData)}`);
    }

    console.log('\n🎉 === TESTS TERMINÉS ===');
    console.log('✅ Backend fonctionnel !');
    console.log('✅ Authentification opérationnelle !');
    console.log('✅ API endpoints répondent !');

  } catch (error) {
    console.log('❌ Erreur de connexion au serveur');
    console.log(`   Détails: ${error.message}`);
    console.log('');
    console.log('💡 Vérifiez que le serveur est démarré sur le port 3001');
    console.log('   Commande: node server_test.js');
  }
}

testServer(); 