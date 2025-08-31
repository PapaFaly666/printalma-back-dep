const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const API_BASE = 'http://localhost:3004';

// Wrapper axios avec support cookies
const client = wrapper(axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  jar: new CookieJar()
}));

async function debugAuthFlow() {
  console.log('🔐 === DEBUG AUTHENTIFICATION ET COOKIES ===\n');

  try {
    // 1. Test de connexion serveur
    console.log('1️⃣ Test connexion serveur...');
    try {
      const healthResponse = await client.get('/vendor/health');
      console.log('❌ Health endpoint accessible sans auth (problème)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Health endpoint protégé (normal)');
      } else {
        console.log('⚠️ Erreur inattendue:', error.message);
      }
    }

    // 2. Test login vendeur
    console.log('\n2️⃣ Test login vendeur...');
    try {
      const loginResponse = await client.post('/auth/login', {
        email: 'vendeur@test.com',
        password: 'password123'
      });

      console.log('✅ Login réussi');
      console.log('📊 Status:', loginResponse.status);
      console.log('🍪 Set-Cookie headers:', loginResponse.headers['set-cookie']);
      console.log('📋 Response data:', loginResponse.data);

      // Vérifier les cookies dans le jar
      const cookies = await client.defaults.jar.getCookies(API_BASE);
      console.log('🍪 Cookies stockés:', cookies.map(c => `${c.key}=${c.value}`));

    } catch (error) {
      console.error('❌ Erreur login:', error.response?.data || error.message);
      return;
    }

    // 3. Test auth/check
    console.log('\n3️⃣ Test /auth/check avec cookies...');
    try {
      const checkResponse = await client.get('/auth/check');
      console.log('✅ Auth check réussi:', checkResponse.data);
    } catch (error) {
      console.error('❌ Auth check échoué:', error.response?.status, error.response?.data);
    }

    // 4. Test endpoint vendeur
    console.log('\n4️⃣ Test endpoint vendeur avec cookies...');
    try {
      const vendorResponse = await client.get('/vendor/products');
      console.log('✅ Endpoint vendeur accessible');
      console.log('📊 Nombre de produits:', vendorResponse.data.data?.products?.length || 0);
    } catch (error) {
      console.error('❌ Endpoint vendeur échoué:', error.response?.status, error.response?.data);
    }

    // 5. Test endpoint admin
    console.log('\n5️⃣ Test endpoint admin...');
    try {
      const adminResponse = await client.get('/auth/admin/clients?page=1&limit=10');
      console.log('✅ Endpoint admin accessible');
    } catch (error) {
      console.error('❌ Endpoint admin échoué:', error.response?.status, error.response?.data);
      if (error.response?.status === 403) {
        console.log('📋 Normal si l\'utilisateur n\'est pas ADMIN/SUPERADMIN');
      }
    }

    // 6. Test login admin
    console.log('\n6️⃣ Test login admin...');
    try {
      const adminLoginResponse = await client.post('/auth/login', {
        email: 'superadmin@test.com',
        password: 'superadmin123'
      });

      console.log('✅ Login admin réussi');
      
      // Retest endpoint admin
      const adminResponse = await client.get('/auth/admin/clients?page=1&limit=10');
      console.log('✅ Endpoint admin maintenant accessible');
      console.log('📊 Nombre de clients:', adminResponse.data.clients?.length || 0);

    } catch (error) {
      console.error('❌ Login admin échoué:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Fonction pour tester manuellement avec cookies
async function testWithManualCookies() {
  console.log('\n\n🔧 === TEST AVEC COOKIES MANUELS ===\n');

  try {
    // Login pour récupérer cookies
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    });

    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (!setCookieHeaders) {
      throw new Error('Pas de cookies reçus');
    }

    // Extraire les cookies
    const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    console.log('🍪 Cookies extraits:', cookies);

    // Test avec cookies manuels
    const testResponse = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Cookie': cookies
      }
    });

    console.log('✅ Test avec cookies manuels réussi');
    console.log('📊 Produits trouvés:', testResponse.data.data?.products?.length || 0);

  } catch (error) {
    console.error('❌ Test cookies manuels échoué:', error.response?.data || error.message);
  }
}

// Fonction pour démarrer le serveur si nécessaire
async function checkServerStatus() {
  try {
    await axios.get(`${API_BASE}/vendor/health`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Serveur non démarré sur le port 3004');
      return false;
    }
    return true; // Autres erreurs = serveur actif
  }
}

async function main() {
  console.log('🚀 === DÉMARRAGE DEBUG AUTHENTIFICATION ===\n');

  // Vérifier si le serveur est démarré
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('❌ Veuillez démarrer le serveur avec: npm run start:dev');
    return;
  }

  await debugAuthFlow();
  await testWithManualCookies();

  console.log('\n🎯 === RECOMMANDATIONS ===');
  console.log('1. Vérifiez que les endpoints ont les bons guards');
  console.log('2. Vérifiez la configuration CORS pour les cookies');
  console.log('3. Vérifiez que JWT strategy lit les cookies correctement');
  console.log('4. Vérifiez les rôles utilisateur en base');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugAuthFlow, testWithManualCookies }; 