const axios = require('axios');

async function testLogin() {
  try {
    console.log('Test de connexion admin...');
    
    const credentials = {
      email: 'admin@photoevents.com',
      password: 'admin123'
    };
    
    console.log('Envoi des données:', credentials);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connexion réussie!');
    console.log('Token:', response.data.token ? 'Présent' : 'Absent');
    console.log('Utilisateur:', response.data.user);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers de réponse:', error.response.headers);
      console.error('Message:', error.response.data);
    } else {
      console.error('Erreur réseau:', error.message);
    }
  }
}

// Test immédiat
testLogin();
