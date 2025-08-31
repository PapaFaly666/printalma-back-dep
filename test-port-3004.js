const axios = require('axios');

const BASE_URL = 'http://localhost:3004'; // Port 3004

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testPort3004() {
  console.log('🧪 Test du port 3004');
  console.log('====================\n');

  try {
    // 1. Test de l'endpoint ultra-simple (sans auth)
    console.log('1. Test de l\'endpoint ultra-simple...');
    const ultraResponse = await axios.get(`${BASE_URL}/products/ready/ultra-test`);
    console.log('✅ Endpoint ultra-simple fonctionne:', ultraResponse.data);

    // 2. Test de l'endpoint port-test
    console.log('\n2. Test de l\'endpoint port-test...');
    const portResponse = await axios.get(`${BASE_URL}/products/ready/port-test`);
    console.log('✅ Endpoint port-test fonctionne:', portResponse.data);

    // 3. Test de l'endpoint simple (avec auth)
    console.log('\n3. Test de l\'endpoint simple avec auth...');
    const simpleResponse = await axios.get(`${BASE_URL}/products/ready/simple-test`, config);
    console.log('✅ Endpoint simple avec auth fonctionne:', simpleResponse.data);

    // 4. Test de l'endpoint de liste
    console.log('\n4. Test de l\'endpoint de liste...');
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, config);
    console.log('✅ Endpoint de liste fonctionne:', {
      total: listResponse.data.total,
      productsCount: listResponse.data.products?.length || 0
    });

    console.log('\n🎉 Tous les tests réussis ! Le serveur fonctionne correctement sur le port 3004.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré ou sur le mauvais port.');
      console.log('   - Vérifiez que le serveur backend est démarré sur le port 3004');
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

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Test ultra-simple (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/ultra-test`);
  console.log('');
  
  console.log('2. Test port-test (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/port-test`);
  console.log('');
  
  console.log('3. Test simple avec auth:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/simple-test \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
  console.log('');
  
  console.log('4. Test liste des produits:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
}

function showFrontendInstructions() {
  console.log('\n📋 Instructions pour le frontend (Port 3004)');
  console.log('===========================================\n');

  console.log('1. Vérifiez que le serveur fonctionne:');
  console.log('   - Tous les tests ci-dessus doivent passer');
  console.log('   - Le serveur doit être sur le port 3004');
  console.log('');
  
  console.log('2. Configurez l\'API helper:');
  console.log('   - BASE_URL = "http://localhost:3004"');
  console.log('   - Utilisez le guide FRONTEND_READY_PRODUCTS_GUIDE.md');
  console.log('');
  
  console.log('3. Implémentez les composants:');
  console.log('   - ReadyProductsPage');
  console.log('   - ReadyProductCard');
  console.log('   - ReadyProductForm');
  console.log('');
  
  console.log('4. Testez avec un token admin valide');
}

function showTroubleshooting() {
  console.log('\n🛠️ Dépannage pour le port 3004');
  console.log('================================\n');

  console.log('Si le serveur ne démarre pas:');
  console.log('1. Vérifiez les erreurs TypeScript: npm run build');
  console.log('2. Régénérez Prisma: npx prisma generate');
  console.log('3. Redémarrez: npm run start:dev');
  console.log('4. Vérifiez que le serveur écoute sur le port 3004');
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
  console.log('');
  
  console.log('Si le frontend appelle le mauvais port:');
  console.log('1. Vérifiez que BASE_URL = "http://localhost:3004"');
  console.log('2. Pas "http://localhost:3000"');
}

// Exécution des tests
async function runAllTests() {
  await testPort3004();
  testWithCurl();
  showFrontendInstructions();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-port-3004.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testPort3004,
  testWithCurl,
  runAllTests
}; 