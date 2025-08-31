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
  console.log('🧪 Test du problème "body stream already read"');
  console.log('==============================================\n');

  try {
    // 1. Test de l'endpoint très simple
    console.log('1. Test de l\'endpoint très simple...');
    const simpleResponse = await axios.get(`${BASE_URL}/products/ready/simple-test`, config);
    console.log('✅ Endpoint simple fonctionne:', simpleResponse.data);

    // 2. Test de l'endpoint de test normal
    console.log('\n2. Test de l\'endpoint de test normal...');
    const testResponse = await axios.get(`${BASE_URL}/products/ready/test`, config);
    console.log('✅ Endpoint de test fonctionne:', testResponse.data);

    // 3. Test de l'endpoint de liste
    console.log('\n3. Test de l\'endpoint de liste...');
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, config);
    console.log('✅ Endpoint de liste fonctionne:', {
      total: listResponse.data.total,
      productsCount: listResponse.data.products?.length || 0
    });

    console.log('\n🎉 Tous les tests réussis ! Le serveur fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Assurez-vous d\'avoir un token admin valide dans la configuration');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Le serveur a une erreur interne. Vérifiez les logs du serveur.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Lancez: npm run start:dev');
    }
  }
}

async function testWithFetch() {
  console.log('\n🌐 Test avec fetch (comme dans le frontend)');
  console.log('============================================\n');

  try {
    // Test avec fetch pour simuler le frontend
    const response = await fetch(`${BASE_URL}/products/ready/simple-test`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetch test réussi:', data);

  } catch (error) {
    console.error('❌ Erreur avec fetch:', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Test de gestion d\'erreurs');
  console.log('==============================\n');

  try {
    // Test avec un token invalide
    const invalidConfig = {
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.get(`${BASE_URL}/products/ready/simple-test`, invalidConfig);
    console.log('❌ Erreur: La requête aurait dû échouer avec un token invalide');

  } catch (error) {
    console.log('✅ Gestion d\'erreur correcte:', error.response?.status, error.response?.data?.message);
  }
}

// Instructions pour obtenir un token
function showTokenInstructions() {
  console.log('\n🔐 Instructions pour obtenir un token admin:');
  console.log('============================================\n');
  console.log('1. Connectez-vous en tant qu\'admin sur le frontend');
  console.log('2. Ouvrez les DevTools (F12)');
  console.log('3. Allez dans l\'onglet Application/Storage');
  console.log('4. Cherchez le token JWT dans localStorage ou sessionStorage');
  console.log('5. Remplacez YOUR_ADMIN_TOKEN_HERE par ce token');
  console.log('6. Relancez ce script');
  console.log('\n💡 Le token ressemble à: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
}

// Exécution des tests
async function runAllTests() {
  await testSimpleEndpoint();
  await testWithFetch();
  await testErrorHandling();
  showTokenInstructions();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3000');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-body-stream-issue.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testSimpleEndpoint,
  testWithFetch,
  testErrorHandling,
  runAllTests
}; 