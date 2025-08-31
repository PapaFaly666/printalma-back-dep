const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testServerStatus() {
  console.log('🔍 Test de statut du serveur backend...\n');

  try {
    // Test de base - endpoint racine
    console.log('1. Test endpoint racine...');
    try {
      const response = await axios.get(BASE_URL, { timeout: 5000 });
      console.log(`✅ Serveur accessible - Status: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Serveur répond avec status: ${error.response.status}`);
      } else {
        console.log(`❌ Serveur non accessible: ${error.message}`);
        return false;
      }
    }

    // Test endpoint API
    console.log('\n2. Test endpoints API...');
    const endpoints = [
      '/api',
      '/api/auth',
      '/api/vendor',
      '/api/vendor/products'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, { 
          timeout: 3000,
          validateStatus: () => true // Accepter tous les status codes
        });
        console.log(`   ${endpoint}: Status ${response.status} - ${response.status < 500 ? '✅' : '❌'}`);
      } catch (error) {
        console.log(`   ${endpoint}: ❌ Erreur - ${error.message}`);
      }
    }

    // Test spécifique login
    console.log('\n3. Test endpoint login...');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@test.com',
        password: 'test'
      }, { 
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   Login endpoint: Status ${response.status} - ${response.status === 400 || response.status === 401 ? '✅ (Accessible)' : response.status < 500 ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   Login endpoint: ❌ ${error.message}`);
    }

    return true;

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  }
}

async function testWithValidCredentials() {
  console.log('\n4. Test avec credentials valides...');
  
  const credentials = [
    { email: 'pf.d@gmail.com', password: 'printalmatest123' },
    { email: 'admin@printalma.com', password: 'admin123' }
  ];

  for (const cred of credentials) {
    try {
      console.log(`   Tentative avec ${cred.email}...`);
      const response = await axios.post(`${BASE_URL}/api/auth/login`, cred, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Login réussi avec ${cred.email}`);
        const token = response.data.access_token || response.data.token;
        
        if (token) {
          console.log(`   🔑 Token reçu: ${token.substring(0, 20)}...`);
          
          // Test avec le token
          try {
            const productsResponse = await axios.get(`${BASE_URL}/api/vendor/products`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            });
            console.log(`   📦 Produits récupérés: ${productsResponse.data?.data?.products?.length || 'N/A'}`);
            return true;
          } catch (error) {
            console.log(`   ⚠️ Erreur récupération produits: ${error.response?.status || error.message}`);
          }
        }
      } else {
        console.log(`   ❌ Login échoué: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur login: ${error.message}`);
    }
  }
  
  return false;
}

async function main() {
  console.log('🚀 === TEST RAPIDE SERVEUR BACKEND ===\n');
  
  const serverOk = await testServerStatus();
  
  if (serverOk) {
    await testWithValidCredentials();
  }
  
  console.log('\n✅ Test terminé.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testServerStatus, testWithValidCredentials }; 