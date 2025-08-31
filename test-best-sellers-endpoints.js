const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3004';
const API_ENDPOINTS = {
  bestSellers: `${BASE_URL}/public/best-sellers`,
  stats: `${BASE_URL}/public/best-sellers/stats`,
  vendorBestSellers: (vendorId) => `${BASE_URL}/public/best-sellers/vendor/${vendorId}`,
  categoryBestSellers: (category) => `${BASE_URL}/public/best-sellers/category/${category}`,
  incrementViews: (productId) => `${BASE_URL}/public/best-sellers/product/${productId}/view`
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Fonction de log coloré
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction de test
async function testEndpoint(name, url, options = {}) {
  log(`\n🔍 Test: ${name}`, 'cyan');
  log(`URL: ${url}`, 'blue');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(url, options);
    const duration = Date.now() - startTime;
    
    log(`✅ Succès (${duration}ms)`, 'green');
    log(`Status: ${response.status}`, 'green');
    
    if (response.data) {
      log(`Données reçues:`, 'yellow');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
    return { success: true, data: response.data, duration };
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Données d'erreur:`, 'red');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

// Tests spécifiques
async function testBestSellersWithFilters() {
  log('\n🎯 Tests avec filtres', 'magenta');
  
  const filters = [
    { name: 'Top 5', params: { limit: 5 } },
    { name: 'Top 10', params: { limit: 10 } },
    { name: 'Avec offset', params: { limit: 3, offset: 2 } },
    { name: 'Min 5 ventes', params: { minSales: 5 } },
    { name: 'Catégorie T-shirts', params: { category: 'T-shirts' } },
    { name: 'Vendeur ID 1', params: { vendorId: 1 } }
  ];
  
  for (const filter of filters) {
    const params = new URLSearchParams(filter.params);
    const url = `${API_ENDPOINTS.bestSellers}?${params}`;
    await testEndpoint(filter.name, url);
  }
}

async function testStatsEndpoint() {
  log('\n📊 Test des statistiques', 'magenta');
  await testEndpoint('Statistiques générales', API_ENDPOINTS.stats);
}

async function testVendorEndpoints() {
  log('\n🏪 Tests par vendeur', 'magenta');
  
  const vendorIds = [1, 2, 3];
  for (const vendorId of vendorIds) {
    await testEndpoint(`Vendeur ${vendorId}`, API_ENDPOINTS.vendorBestSellers(vendorId));
  }
}

async function testCategoryEndpoints() {
  log('\n🏷️ Tests par catégorie', 'magenta');
  
  const categories = ['T-shirts', 'Hoodies', 'Polos'];
  for (const category of categories) {
    await testEndpoint(`Catégorie ${category}`, API_ENDPOINTS.categoryBestSellers(category));
  }
}

async function testViewIncrement() {
  log('\n👁️ Test incrémentation vues', 'magenta');
  
  // D'abord récupérer quelques produits
  const response = await axios.get(API_ENDPOINTS.bestSellers);
  if (response.data && response.data.data && response.data.data.length > 0) {
    const productId = response.data.data[0].id;
    await testEndpoint(`Incrémenter vues produit ${productId}`, API_ENDPOINTS.incrementViews(productId));
  } else {
    log('⚠️ Aucun produit trouvé pour tester l\'incrémentation des vues', 'yellow');
  }
}

async function testErrorCases() {
  log('\n🚨 Tests des cas d\'erreur', 'magenta');
  
  const errorTests = [
    { name: 'Vendeur inexistant', url: API_ENDPOINTS.vendorBestSellers(999) },
    { name: 'Catégorie inexistante', url: API_ENDPOINTS.categoryBestSellers('Inexistant') },
    { name: 'Produit inexistant pour vues', url: API_ENDPOINTS.incrementViews(999) },
    { name: 'Limite invalide', url: `${API_ENDPOINTS.bestSellers}?limit=invalid` },
    { name: 'Offset invalide', url: `${API_ENDPOINTS.bestSellers}?offset=invalid` }
  ];
  
  for (const test of errorTests) {
    await testEndpoint(test.name, test.url);
  }
}

async function testResponseStructure() {
  log('\n📋 Test de la structure de réponse', 'magenta');
  
  const response = await axios.get(API_ENDPOINTS.bestSellers);
  const data = response.data;
  
  log('Vérification de la structure...', 'yellow');
  
  // Vérifier la structure de base
  const requiredFields = ['success', 'data', 'pagination', 'stats'];
  for (const field of requiredFields) {
    if (data.hasOwnProperty(field)) {
      log(`✅ ${field} présent`, 'green');
    } else {
      log(`❌ ${field} manquant`, 'red');
    }
  }
  
  // Vérifier la structure des produits si disponibles
  if (data.data && data.data.length > 0) {
    const product = data.data[0];
    const productFields = [
      'id', 'name', 'price', 'salesCount', 'totalRevenue', 
      'bestSellerRank', 'viewsCount', 'baseProduct', 'vendor'
    ];
    
    log('\nVérification des champs produit:', 'yellow');
    for (const field of productFields) {
      if (product.hasOwnProperty(field)) {
        log(`✅ ${field} présent`, 'green');
      } else {
        log(`❌ ${field} manquant`, 'red');
      }
    }
    
    // Vérifier les informations de design
    const designFields = [
      'designCloudinaryUrl', 'designWidth', 'designHeight', 
      'designScale', 'designPositioning'
    ];
    
    log('\nVérification des champs design:', 'yellow');
    for (const field of designFields) {
      if (product.hasOwnProperty(field)) {
        log(`✅ ${field} présent`, 'green');
      } else {
        log(`⚠️ ${field} manquant (optionnel)`, 'yellow');
      }
    }
  }
}

async function testPerformance() {
  log('\n⚡ Tests de performance', 'magenta');
  
  const tests = [
    { name: 'Top 5', params: { limit: 5 } },
    { name: 'Top 20', params: { limit: 20 } },
    { name: 'Top 50', params: { limit: 50 } }
  ];
  
  for (const test of tests) {
    const params = new URLSearchParams(test.params);
    const url = `${API_ENDPOINTS.bestSellers}?${params}`;
    
    const startTime = Date.now();
    const response = await axios.get(url);
    const duration = Date.now() - startTime;
    
    log(`${test.name}: ${duration}ms`, duration < 1000 ? 'green' : 'yellow');
    
    if (response.data && response.data.data) {
      log(`  → ${response.data.data.length} produits retournés`, 'blue');
    }
  }
}

// Test principal
async function runAllTests() {
  log('🏆 DÉBUT DES TESTS - API BEST SELLERS', 'bright');
  log('=====================================', 'bright');
  
  try {
    // Test de base
    await testEndpoint('Endpoint principal', API_ENDPOINTS.bestSellers);
    
    // Tests avec filtres
    await testBestSellersWithFilters();
    
    // Tests des endpoints spécifiques
    await testStatsEndpoint();
    await testVendorEndpoints();
    await testCategoryEndpoints();
    await testViewIncrement();
    
    // Tests d'erreur
    await testErrorCases();
    
    // Tests de structure
    await testResponseStructure();
    
    // Tests de performance
    await testPerformance();
    
    log('\n🎉 TOUS LES TESTS TERMINÉS', 'bright');
    log('============================', 'bright');
    
  } catch (error) {
    log(`\n💥 Erreur générale: ${error.message}`, 'red');
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testEndpoint,
  API_ENDPOINTS
}; 