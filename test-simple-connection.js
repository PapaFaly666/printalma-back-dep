const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testConnection() {
  console.log('🔍 Test de connexion au serveur...');
  
  try {
    // Test de santé du serveur
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Serveur accessible:', healthResponse.status);
  } catch (error) {
    console.log('❌ Serveur inaccessible:', error.message);
    return;
  }

  // Test de connexion
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connexion réussie:', response.data);
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data || error.message);
  }
}

testConnection().catch(console.error); 