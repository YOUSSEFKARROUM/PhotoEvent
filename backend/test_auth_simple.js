const axios = require('axios');

async function testAuth() {
  try {
    console.log('🔍 Test de l\'API d\'authentification...');
    
    // Test 1: Health check
    console.log('\n1. Test du health check...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Health check OK:', healthResponse.data.status);
    
    // Test 2: Login admin
    console.log('\n2. Test de connexion admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@photoevents.com',
      password: 'admin123'
    });
    
    console.log('✅ Connexion réussie!');
    console.log('Token:', loginResponse.data.token ? 'Présent' : 'Absent');
    console.log('User:', loginResponse.data.user.name);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testAuth(); 