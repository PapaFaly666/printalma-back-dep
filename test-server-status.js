const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:3004'; // Port du frontend

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testServerStatus() {
  console.log('🔍 Diagnostic du serveur');
  console.log('========================\n');

  try {
    // 1. Test de l'endpoint ultra-simple (sans auth)
    console.log('1. Test de l\'endpoint ultra-simple...');
    const ultraResponse = await axios.get(`${BASE_URL}/products/ready/ultra-test`);
    console.log('✅ Endpoint ultra-simple fonctionne:', ultraResponse.data);

    // 2. Test de l'endpoint simple (avec auth)
    console.log('\n2. Test de l\'endpoint simple...');
    const simpleResponse = await axios.get(`${BASE_URL}/products/ready/simple-test`, config);
    console.log('✅ Endpoint simple fonctionne:', simpleResponse.data);

    // 3. Test de l'endpoint de test normal
    console.log('\n3. Test de l\'endpoint de test normal...');
    const testResponse = await axios.get(`${BASE_URL}/products/ready/test`, config);
    console.log('✅ Endpoint de test fonctionne:', testResponse.data);

    // 4. Test de l'endpoint de liste
    console.log('\n4. Test de l\'endpoint de liste...');
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, config);
    console.log('✅ Endpoint de liste fonctionne:', {
      total: listResponse.data.total,
      productsCount: listResponse.data.products?.length || 0
    });

    console.log('\n🎉 Tous les tests réussis ! Le serveur fonctionne correctement.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré ou sur le mauvais port.');
      console.log('   - Vérifiez que le serveur backend est démarré sur le port 3000');
      console.log('   - Lancez: npm run start:dev');
      console.log('   - Vérifiez les logs du serveur pour des erreurs de compilation');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Problème d\'authentification.');
      console.log('   - Assurez-vous d\'avoir un token admin valide');
      console.log('   - Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Erreur 400 - Problème de validation.');
      console.log('   - Le serveur démarre mais a des erreurs de validation');
      console.log('   - Vérifiez les logs du serveur pour des erreurs TypeScript');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Erreur 500 - Problème interne du serveur.');
      console.log('   - Vérifiez les logs du serveur pour des erreurs');
      console.log('   - Le serveur peut avoir des erreurs de compilation TypeScript');
    }
  }
}

async function testPorts() {
  console.log('\n🔌 Test des ports');
  console.log('==================\n');

  try {
    // Test du port backend
    console.log('1. Test du port backend (3000)...');
    const backendResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Port backend accessible:', backendResponse.data);

  } catch (error) {
    console.log('❌ Port backend inaccessible:', error.message);
  }

  try {
    // Test du port frontend
    console.log('\n2. Test du port frontend (3004)...');
    const frontendResponse = await axios.get(`${FRONTEND_URL}`);
    console.log('✅ Port frontend accessible');

  } catch (error) {
    console.log('❌ Port frontend inaccessible:', error.message);
  }
}

async function testWithCurl() {
  console.log('\n🔄 Test avec curl (simulation)');
  console.log('===============================\n');

  console.log('Commandes curl à tester manuellement:');
  console.log('');
  console.log('1. Test ultra-simple:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/ultra-test`);
  console.log('');
  console.log('2. Test simple (avec token):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/simple-test \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
  console.log('');
  console.log('3. Test de liste (avec token):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
}

// Instructions pour résoudre les problèmes
function showTroubleshooting() {
  console.log('\n🛠️ Guide de dépannage');
  console.log('=====================\n');

  console.log('Si le serveur ne démarre pas:');
  console.log('1. Vérifiez les erreurs TypeScript: npm run build');
  console.log('2. Régénérez Prisma: npx prisma generate');
  console.log('3. Redémarrez le serveur: npm run start:dev');
  console.log('4. Vérifiez les logs pour des erreurs spécifiques');
  console.log('');
  console.log('Si vous avez une erreur 400:');
  console.log('1. Le serveur démarre mais a des erreurs de validation');
  console.log('2. Vérifiez les logs du serveur');
  console.log('3. Testez avec l\'endpoint ultra-simple d\'abord');
  console.log('');
  console.log('Si vous avez une erreur 401:');
  console.log('1. Vérifiez que votre token est valide');
  console.log('2. Vérifiez que vous êtes connecté en tant qu\'admin');
  console.log('3. Testez avec l\'endpoint ultra-simple (sans auth)');
}

// Exécution des tests
async function runAllTests() {
  await testServerStatus();
  await testPorts();
  testWithCurl();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3000');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-server-status.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testServerStatus,
  testPorts,
  testWithCurl,
  runAllTests
}; 