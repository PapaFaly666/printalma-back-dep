const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testUltraSimple() {
  console.log('🧪 Test ultra-simple (sans auth)');
  console.log('==================================\n');

  try {
    const response = await axios.get(`${BASE_URL}/products/ready/ultra-test`);
    console.log('✅ Endpoint ultra-simple fonctionne:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erreur endpoint ultra-simple:', error.response?.data || error.message);
    return false;
  }
}

async function testSimpleWithAuth() {
  console.log('\n🔐 Test simple avec authentification');
  console.log('=====================================\n');

  try {
    const response = await axios.get(`${BASE_URL}/products/ready/simple-test`, config);
    console.log('✅ Endpoint simple avec auth fonctionne:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erreur endpoint simple avec auth:', error.response?.data || error.message);
    return false;
  }
}

async function testReadyProductsList() {
  console.log('\n📋 Test liste des produits prêts');
  console.log('==================================\n');

  try {
    const response = await axios.get(`${BASE_URL}/products/ready`, config);
    console.log('✅ Endpoint liste fonctionne:', {
      total: response.data.total,
      productsCount: response.data.products?.length || 0,
      pagination: response.data.pagination
    });
    return true;
  } catch (error) {
    console.error('❌ Erreur endpoint liste:', error.response?.data || error.message);
    return false;
  }
}

async function testReadyProductDetail() {
  console.log('\n🔍 Test détail d\'un produit prêt');
  console.log('====================================\n');

  try {
    // D'abord récupérer la liste pour avoir un ID
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, config);
    const products = listResponse.data.products || [];
    
    if (products.length === 0) {
      console.log('ℹ️ Aucun produit prêt trouvé pour tester le détail');
      return true;
    }

    const firstProductId = products[0].id;
    const response = await axios.get(`${BASE_URL}/products/ready/${firstProductId}`, config);
    console.log('✅ Endpoint détail fonctionne:', {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status
    });
    return true;
  } catch (error) {
    console.error('❌ Erreur endpoint détail:', error.response?.data || error.message);
    return false;
  }
}

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Test ultra-simple (sans auth):');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/ultra-test`);
  console.log('');
  
  console.log('2. Test simple avec auth:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/simple-test \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
  console.log('');
  
  console.log('3. Test liste des produits:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
  console.log('');
  
  console.log('4. Test avec filtres:');
  console.log(`   curl -X GET "${BASE_URL}/products/ready?status=published&limit=10" \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
}

function showFrontendInstructions() {
  console.log('\n📋 Instructions pour le frontend');
  console.log('================================\n');

  console.log('1. Vérifiez que le serveur fonctionne:');
  console.log('   - Tous les tests ci-dessus doivent passer');
  console.log('   - Le serveur doit être sur le port 3000');
  console.log('');
  
  console.log('2. Configurez l\'API helper:');
  console.log('   - BASE_URL = "http://localhost:3000" (pas 3004)');
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
  console.log('\n🛠️ Dépannage');
  console.log('=============\n');

  console.log('Si le serveur ne démarre pas:');
  console.log('1. Vérifiez les erreurs TypeScript: npm run build');
  console.log('2. Régénérez Prisma: npx prisma generate');
  console.log('3. Redémarrez: npm run start:dev');
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
  console.log('1. Vérifiez que BASE_URL = "http://localhost:3000"');
  console.log('2. Pas "http://localhost:3004"');
}

// Exécution de tous les tests
async function runAllTests() {
  console.log('🚀 Test complet des endpoints produits prêts');
  console.log('===========================================\n');

  const results = {
    ultraSimple: await testUltraSimple(),
    simpleWithAuth: await testSimpleWithAuth(),
    list: await testReadyProductsList(),
    detail: await testReadyProductDetail()
  };

  console.log('\n📊 Résultats des tests:');
  console.log('========================');
  console.log(`Ultra-simple: ${results.ultraSimple ? '✅' : '❌'}`);
  console.log(`Simple avec auth: ${results.simpleWithAuth ? '✅' : '❌'}`);
  console.log(`Liste: ${results.list ? '✅' : '❌'}`);
  console.log(`Détail: ${results.detail ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés ! Le serveur est prêt pour le frontend.');
    console.log('Vous pouvez maintenant implémenter les composants frontend.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Corrigez les problèmes avant d\'implémenter le frontend.');
  }

  testWithCurl();
  showFrontendInstructions();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3000');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-frontend-ready-products.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testUltraSimple,
  testSimpleWithAuth,
  testReadyProductsList,
  testReadyProductDetail,
  runAllTests
}; 