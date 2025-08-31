const axios = require('axios');

const BASE_URL = 'http://localhost:3004'; // Port 3004

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testBasicEndpoints() {
  console.log('🧪 Test des endpoints de base');
  console.log('=============================\n');

  try {
    // 1. Test de l'endpoint basic-test (sans auth)
    console.log('1. Test de l\'endpoint basic-test...');
    const basicResponse = await axios.get(`${BASE_URL}/products/ready/basic-test`);
    console.log('✅ Endpoint basic-test fonctionne:', basicResponse.data);

    // 2. Test de l'endpoint ultra-test (sans auth)
    console.log('\n2. Test de l\'endpoint ultra-test...');
    const ultraResponse = await axios.get(`${BASE_URL}/products/ready/ultra-test`);
    console.log('✅ Endpoint ultra-test fonctionne:', ultraResponse.data);

    // 3. Test de l'endpoint port-test (sans auth)
    console.log('\n3. Test de l\'endpoint port-test...');
    const portResponse = await axios.get(`${BASE_URL}/products/ready/port-test`);
    console.log('✅ Endpoint port-test fonctionne:', portResponse.data);

    console.log('\n🎉 Tous les endpoints de base fonctionnent !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré.');
      console.log('   - Lancez: npm run start:dev');
      console.log('   - Vérifiez les logs du serveur pour des erreurs de compilation');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Erreur 400 - Problème de validation.');
      console.log('   - Le serveur démarre mais a des erreurs de validation');
      console.log('   - Vérifiez les logs du serveur pour des erreurs TypeScript');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Test basic-test (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/basic-test`);
  console.log('');
  
  console.log('2. Test ultra-test (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/ultra-test`);
  console.log('');
  
  console.log('3. Test port-test (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/port-test`);
  console.log('');
  
  console.log('4. Test avec Swagger:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/ultra-test \\`);
  console.log('     -H "accept: */*"');
}

function showDiagnosticSteps() {
  console.log('\n🔍 Étapes de diagnostic');
  console.log('========================\n');

  console.log('1. Vérifiez que le serveur démarre:');
  console.log('   - Lancez: npm run start:dev');
  console.log('   - Regardez les logs pour des erreurs TypeScript');
  console.log('');
  
  console.log('2. Testez les endpoints de base:');
  console.log('   - /products/ready/basic-test');
  console.log('   - /products/ready/ultra-test');
  console.log('   - /products/ready/port-test');
  console.log('');
  
  console.log('3. Si les endpoints de base fonctionnent:');
  console.log('   - Le problème vient des endpoints avec services');
  console.log('   - Vérifiez les erreurs TypeScript dans product.service.ts');
  console.log('');
  
  console.log('4. Si les endpoints de base ne fonctionnent pas:');
  console.log('   - Le serveur ne démarre pas correctement');
  console.log('   - Vérifiez les erreurs de compilation');
}

function showTroubleshooting() {
  console.log('\n🛠️ Solutions pour l\'erreur "Validation failed"');
  console.log('===============================================\n');

  console.log('Cette erreur indique que le serveur ne démarre pas correctement.');
  console.log('');
  
  console.log('Solutions:');
  console.log('1. Régénérer Prisma: npx prisma generate');
  console.log('2. Nettoyer le cache: rm -rf dist/ && rm -rf node_modules/.cache/');
  console.log('3. Réinstaller: npm install');
  console.log('4. Redémarrer: npm run start:dev');
  console.log('');
  
  console.log('Si le problème persiste:');
  console.log('1. Vérifiez les erreurs TypeScript dans la console');
  console.log('2. Corrigez les erreurs une par une');
  console.log('3. Testez avec les endpoints de base d\'abord');
}

// Exécution des tests
async function runAllTests() {
  await testBasicEndpoints();
  testWithCurl();
  showDiagnosticSteps();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Exécutez: node test-validation-error.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testBasicEndpoints,
  testWithCurl,
  runAllTests
}; 