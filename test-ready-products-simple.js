const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testSimpleEndpoint() {
  console.log('🧪 Test simple des endpoints produits prêts');
  console.log('===========================================\n');

  try {
    // 1. Test de l'endpoint de test
    console.log('1. Test de l\'endpoint de test...');
    const testResponse = await axios.get(`${BASE_URL}/products/ready/test`, config);
    console.log('✅ Endpoint de test fonctionne:', testResponse.data);

    // 2. Test de l'endpoint de liste (sans paramètres)
    console.log('\n2. Test de l\'endpoint de liste...');
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, config);
    console.log('✅ Endpoint de liste fonctionne:', {
      total: listResponse.data.total,
      productsCount: listResponse.data.products?.length || 0
    });

    console.log('\n🎉 Tests de base réussis ! Le serveur fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Assurez-vous d\'avoir un token admin valide dans la configuration');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Le serveur a une erreur interne. Vérifiez les logs du serveur.');
    }
  }
}

async function testWithRealToken() {
  console.log('\n🔐 Test avec authentification');
  console.log('=============================\n');

  // Instructions pour obtenir un token
  console.log('Pour tester avec un vrai token :');
  console.log('1. Connectez-vous en tant qu\'admin sur le frontend');
  console.log('2. Ouvrez les DevTools (F12)');
  console.log('3. Allez dans l\'onglet Application/Storage');
  console.log('4. Cherchez le token JWT dans localStorage ou sessionStorage');
  console.log('5. Remplacez YOUR_ADMIN_TOKEN_HERE par ce token');
  console.log('6. Relancez ce script');
}

// Exécution des tests
async function runTests() {
  await testSimpleEndpoint();
  await testWithRealToken();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3000');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-ready-products-simple.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runTests();

module.exports = {
  testSimpleEndpoint,
  testWithRealToken,
  runTests
}; 