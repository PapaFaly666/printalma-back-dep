/**
 * 🧪 Script de Test - Système de Meilleures Ventes
 * 
 * Ce script teste tous les endpoints du nouveau système de meilleures ventes
 * pour s'assurer que l'implémentation fonctionne correctement.
 */

const BASE_URL = 'http://localhost:3004';

// Fonction utilitaire pour faire des requêtes
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`🔍 Test: ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Succès: ${response.status}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ Erreur: ${response.status} - ${data.message || 'Erreur inconnue'}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    console.log(`💥 Erreur réseau: ${error.message}`);
    return { success: false, error: error.message, status: 0 };
  }
}

// Tests des endpoints publics
async function testPublicEndpoints() {
  console.log('\n🌐 === TESTS ENDPOINTS PUBLICS ===\n');

  // Test 1: Meilleures ventes par défaut
  console.log('1. Meilleures ventes par défaut');
  const test1 = await makeRequest('/best-sellers');
  if (test1.success) {
    console.log(`   📊 ${test1.data.data?.length || 0} produits retournés`);
    console.log(`   💰 Chiffre d'affaires total: ${test1.data.stats?.totalRevenue || 0}€`);
  }

  // Test 2: Meilleures ventes du mois
  console.log('\n2. Meilleures ventes du mois (limite 5)');
  const test2 = await makeRequest('/best-sellers?period=month&limit=5');
  if (test2.success) {
    console.log(`   📊 ${test2.data.data?.length || 0} produits retournés`);
    console.log(`   📅 Période: ${test2.data.stats?.periodAnalyzed}`);
    console.log(`   🗄️ Cache: ${test2.data.cacheInfo?.cached ? 'Hit' : 'Miss'}`);
  }

  // Test 3: Meilleures ventes avec vendeur spécifique
  console.log('\n3. Meilleures ventes pour vendeur ID 1');
  const test3 = await makeRequest('/best-sellers?vendorId=1&period=all&limit=10');
  if (test3.success) {
    console.log(`   📊 ${test3.data.data?.length || 0} produits retournés`);
    if (test3.data.data?.length > 0) {
      console.log(`   👤 Vendeur: ${test3.data.data[0].vendor?.name}`);
    }
  }

  // Test 4: Statistiques rapides
  console.log('\n4. Statistiques rapides');
  const test4 = await makeRequest('/best-sellers/stats');
  if (test4.success) {
    console.log(`   📈 Données périodes disponibles`);
    console.log(`   🏆 Top vendeurs: ${test4.data.data?.topVendors?.length || 0}`);
    console.log(`   📦 Cache: ${test4.data.data?.cacheStats?.size || 0} entrées`);
  }

  // Test 5: Tendances
  console.log('\n5. Analyse des tendances');
  const test5 = await makeRequest('/best-sellers/trends');
  if (test5.success) {
    console.log(`   📊 Tendances calculées`);
    console.log(`   🚀 Produits émergents: ${test5.data.data?.analysis?.emergingTrends?.length || 0}`);
  }

  // Test 6: Meilleures ventes par vendeur (endpoint dédié)
  console.log('\n6. Meilleures ventes vendeur spécifique');
  const test6 = await makeRequest('/best-sellers/vendor/1?period=month');
  if (test6.success) {
    console.log(`   📊 ${test6.data.data?.length || 0} produits retournés`);
    if (test6.data.vendorStats) {
      console.log(`   💰 CA vendeur: ${test6.data.vendorStats.totalRevenue}€`);
      console.log(`   🏆 Meilleur rang: ${test6.data.vendorStats.bestRank}`);
    }
  }

  return {
    test1: test1.success,
    test2: test2.success,
    test3: test3.success,
    test4: test4.success,
    test5: test5.success,
    test6: test6.success
  };
}

// Tests des endpoints d'administration (nécessite un token)
async function testAdminEndpoints(token) {
  console.log('\n🔐 === TESTS ENDPOINTS ADMIN ===\n');

  if (!token) {
    console.log('⚠️  Token d\'authentification non fourni, tests admin ignorés');
    console.log('   Pour tester les endpoints admin, fournissez un token JWT valide');
    return { skipped: true };
  }

  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // Test 1: Tableau de bord admin
  console.log('1. Tableau de bord administrateur');
  const test1 = await makeRequest('/admin/best-sellers/dashboard', {
    headers: authHeaders
  });
  if (test1.success) {
    console.log(`   📊 Vue d'ensemble générée`);
    console.log(`   🏪 Produits vendeur: ${test1.data.data?.overview?.totalVendorProducts || 0}`);
    console.log(`   💰 CA total: ${test1.data.data?.overview?.totalRevenue || 0}€`);
    console.log(`   📈 Taux de vente: ${test1.data.data?.overview?.salesRate?.toFixed(2) || 0}%`);
  }

  // Test 2: Statistiques du cache
  console.log('\n2. Statistiques du cache');
  const test2 = await makeRequest('/admin/best-sellers/cache/stats', {
    headers: authHeaders
  });
  if (test2.success) {
    console.log(`   🗄️ Taille cache: ${test2.data.data?.cacheSize || 0} entrées`);
    console.log(`   💚 Santé cache: ${test2.data.data?.cacheHealth}`);
  }

  // Test 3: Rapport de performance
  console.log('\n3. Rapport de performance');
  const test3 = await makeRequest('/admin/best-sellers/reports/performance?period=month', {
    headers: authHeaders
  });
  if (test3.success) {
    console.log(`   📊 Rapport généré pour: ${test3.data.data?.period}`);
    console.log(`   🏆 Best-sellers: ${test3.data.data?.summary?.totalBestSellers || 0}`);
    console.log(`   💰 CA période: ${test3.data.data?.summary?.totalRevenue || 0}€`);
  }

  // Test 4: Marquage des best-sellers (POST)
  console.log('\n4. Test marquage best-sellers');
  const test4 = await makeRequest('/admin/best-sellers/mark-best-sellers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      period: 'month',
      minSales: 1
    })
  });
  if (test4.success) {
    console.log(`   🏆 Best-sellers marqués: ${test4.data.data?.bestSellersCount || 0}`);
    console.log(`   📅 Période: ${test4.data.data?.period}`);
  }

  return {
    test1: test1.success,
    test2: test2.success,
    test3: test3.success,
    test4: test4.success
  };
}

// Test de performance simple
async function testPerformance() {
  console.log('\n⚡ === TESTS DE PERFORMANCE ===\n');

  // Test de cache (deux requêtes identiques)
  console.log('1. Test du cache (2 requêtes identiques)');
  
  const startTime1 = Date.now();
  const test1 = await makeRequest('/best-sellers?period=month&limit=10');
  const duration1 = Date.now() - startTime1;
  
  const startTime2 = Date.now();
  const test2 = await makeRequest('/best-sellers?period=month&limit=10');
  const duration2 = Date.now() - startTime2;
  
  if (test1.success && test2.success) {
    console.log(`   ⏱️  1ère requête: ${duration1}ms (${test1.data.cacheInfo?.cached ? 'Cache Hit' : 'Cache Miss'})`);
    console.log(`   ⏱️  2ème requête: ${duration2}ms (${test2.data.cacheInfo?.cached ? 'Cache Hit' : 'Cache Miss'})`);
    
    if (test2.data.cacheInfo?.cached && duration2 < duration1) {
      console.log(`   ✅ Cache fonctionnel - Amélioration: ${duration1 - duration2}ms`);
    }
  }

  // Test avec différentes limites
  console.log('\n2. Test avec différentes limites');
  
  const limits = [5, 20, 50];
  for (const limit of limits) {
    const startTime = Date.now();
    const test = await makeRequest(`/best-sellers?limit=${limit}`);
    const duration = Date.now() - startTime;
    
    if (test.success) {
      console.log(`   📊 Limite ${limit}: ${duration}ms - ${test.data.data?.length || 0} résultats`);
    }
  }

  return true;
}

// Validation des données
function validateBestSellerData(product) {
  const required = ['id', 'name', 'price', 'totalQuantitySold', 'totalRevenue', 'rank', 'vendor', 'baseProduct'];
  const missing = required.filter(field => !product.hasOwnProperty(field));
  
  if (missing.length > 0) {
    console.log(`   ❌ Champs manquants: ${missing.join(', ')}`);
    return false;
  }

  // Validation des types
  if (typeof product.totalQuantitySold !== 'number' || product.totalQuantitySold < 0) {
    console.log(`   ❌ totalQuantitySold invalide: ${product.totalQuantitySold}`);
    return false;
  }

  if (typeof product.totalRevenue !== 'number' || product.totalRevenue < 0) {
    console.log(`   ❌ totalRevenue invalide: ${product.totalRevenue}`);
    return false;
  }

  return true;
}

// Test de validation des données
async function testDataValidation() {
  console.log('\n🔍 === VALIDATION DES DONNÉES ===\n');

  console.log('1. Validation structure des données');
  const test = await makeRequest('/best-sellers?limit=3');
  
  if (test.success && test.data.data?.length > 0) {
    let validCount = 0;
    
    test.data.data.forEach((product, index) => {
      console.log(`   Produit ${index + 1}: ${product.name || 'Sans nom'}`);
      if (validateBestSellerData(product)) {
        console.log(`   ✅ Structure valide`);
        validCount++;
      }
    });
    
    console.log(`\n   📊 Résultat: ${validCount}/${test.data.data.length} produits valides`);
    return validCount === test.data.data.length;
  }

  return false;
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 === DÉBUT DES TESTS SYSTÈME MEILLEURES VENTES ===');
  console.log(`🌐 URL de base: ${BASE_URL}`);
  console.log(`⏰ Démarré à: ${new Date().toLocaleString()}\n`);

  const results = {
    public: await testPublicEndpoints(),
    performance: await testPerformance(),
    validation: await testDataValidation(),
    admin: await testAdminEndpoints(process.argv[2]) // Token en paramètre
  };

  // Résumé des résultats
  console.log('\n📋 === RÉSUMÉ DES TESTS ===\n');

  // Tests publics
  const publicTests = Object.values(results.public);
  const publicSuccess = publicTests.filter(Boolean).length;
  console.log(`🌐 Endpoints publics: ${publicSuccess}/${publicTests.length} réussis`);

  // Tests admin
  if (results.admin.skipped) {
    console.log('🔐 Endpoints admin: Ignorés (pas de token)');
  } else {
    const adminTests = Object.values(results.admin);
    const adminSuccess = adminTests.filter(Boolean).length;
    console.log(`🔐 Endpoints admin: ${adminSuccess}/${adminTests.length} réussis`);
  }

  // Performance et validation
  console.log(`⚡ Tests performance: ${results.performance ? 'Réussi' : 'Échoué'}`);
  console.log(`🔍 Validation données: ${results.validation ? 'Réussie' : 'Échouée'}`);

  // Recommandations
  console.log('\n💡 === RECOMMANDATIONS ===\n');

  if (publicSuccess < publicTests.length) {
    console.log('⚠️  Certains endpoints publics échouent - Vérifiez les services');
  }

  if (results.admin.skipped) {
    console.log('💡 Pour tester les endpoints admin:');
    console.log('   node test-best-sellers-implementation.js "votre-jwt-token"');
  }

  if (!results.validation) {
    console.log('⚠️  Problèmes de validation des données détectés');
  }

  console.log('\n✨ Tests terminés !');
}

// Point d'entrée
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  makeRequest,
  testPublicEndpoints,
  testAdminEndpoints,
  testPerformance,
  testDataValidation,
  runAllTests
}; 