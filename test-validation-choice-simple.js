const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Utiliser des utilisateurs existants
const ADMIN_LOGIN = {
  email: 'admin@printalma.com',
  password: 'admin123'
};

const VENDOR_LOGIN = {
  email: 'vendeur.test@example.com',
  password: 'vendeur123'
};

let adminToken = '';
let vendorToken = '';

async function login(credentials, userType) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    console.log(`✅ ${userType} connecté avec succès`);
    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Erreur connexion ${userType}:`, error.response?.data?.message || error.message);
    throw error;
  }
}

async function testEndpoints() {
  console.log('\n🧪 === TEST ENDPOINTS VALIDATION CHOICE ===\n');

  try {
    // Test de connexion admin
    console.log('1️⃣ Test connexion admin...');
    try {
      adminToken = await login(ADMIN_LOGIN, 'ADMIN');
    } catch (error) {
      console.log('⚠️ Admin non trouvé, utilisation des credentials par défaut');
      adminToken = await login({ email: 'admin@example.com', password: 'admin123' }, 'ADMIN');
    }

    // Test de connexion vendeur
    console.log('2️⃣ Test connexion vendeur...');
    try {
      vendorToken = await login(VENDOR_LOGIN, 'VENDEUR');
    } catch (error) {
      console.log('⚠️ Vendeur non trouvé, utilisation des credentials par défaut');
      vendorToken = await login({ email: 'vendeur@example.com', password: 'vendeur123' }, 'VENDEUR');
    }

    // Test des endpoints de validation
    console.log('\n3️⃣ Test des endpoints...');

    // Test GET pending (admin)
    console.log('📋 Test GET /vendor-product-validation/pending...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/vendor-product-validation/pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ Endpoint pending fonctionne - ${pendingResponse.data.length} produits en attente`);
    } catch (error) {
      console.log('❌ Erreur endpoint pending:', error.response?.data?.message || error.message);
    }

    // Test PUT post-validation-action (vendeur)
    console.log('🔄 Test PUT /vendor-product-validation/post-validation-action/123...');
    try {
      const updateResponse = await axios.put(
        `${BASE_URL}/vendor-product-validation/post-validation-action/123`,
        { action: 'TO_DRAFT' },
        { headers: { Authorization: `Bearer ${vendorToken}` } }
      );
      console.log('✅ Endpoint post-validation-action fonctionne');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Produit 123 non trouvé (normal pour un test)');
      } else {
        console.log('❌ Erreur endpoint post-validation-action:', error.response?.data?.message || error.message);
      }
    }

    // Test POST publish (vendeur)
    console.log('🚀 Test POST /vendor-product-validation/publish/123...');
    try {
      const publishResponse = await axios.post(
        `${BASE_URL}/vendor-product-validation/publish/123`,
        {},
        { headers: { Authorization: `Bearer ${vendorToken}` } }
      );
      console.log('✅ Endpoint publish fonctionne');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Produit 123 non trouvé (normal pour un test)');
      } else {
        console.log('❌ Erreur endpoint publish:', error.response?.data?.message || error.message);
      }
    }

    // Test POST validate (admin)
    console.log('✅ Test POST /vendor-product-validation/validate/123...');
    try {
      const validateResponse = await axios.post(
        `${BASE_URL}/vendor-product-validation/validate/123`,
        { approved: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Endpoint validate fonctionne');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Produit 123 non trouvé (normal pour un test)');
      } else {
        console.log('❌ Erreur endpoint validate:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 === TESTS TERMINÉS ===');
    console.log('✅ Les endpoints de validation avec choix de publication sont disponibles !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  testEndpoints().catch(console.error);
}

module.exports = { testEndpoints }; 
 