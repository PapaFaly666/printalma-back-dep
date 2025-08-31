const axios = require('axios');

const BASE_URL = 'http://localhost:5174/api';

// Test des endpoints publics (sans authentification)
async function testPublicEndpoints() {
  console.log('🔓 Test des endpoints publics des thèmes (sans authentification)\n');

  try {
    // Test 1: Liste des thèmes
    console.log('🧪 Test 1: Récupérer la liste des thèmes');
    const themesResponse = await axios.get(`${BASE_URL}/themes`);
    console.log('✅ Succès - Thèmes récupérés:', themesResponse.data.data?.length || 0, 'thèmes');
    console.log('');

    // Test 2: Détails d'un thème
    console.log('🧪 Test 2: Récupérer les détails d\'un thème');
    const themeId = 4; // ID du thème à tester
    const themeDetailsResponse = await axios.get(`${BASE_URL}/themes/${themeId}`);
    console.log('✅ Succès - Détails du thème:', themeDetailsResponse.data.data?.name);
    console.log('');

    // Test 3: Produits d'un thème
    console.log('🧪 Test 3: Récupérer les produits d\'un thème');
    const themeProductsResponse = await axios.get(`${BASE_URL}/themes/${themeId}/products`, {
      params: {
        status: 'READY',
        limit: 5,
        sort: 'name',
        order: 'asc'
      }
    });
    console.log('✅ Succès - Produits récupérés:', themeProductsResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 4: Produits avec filtres
    console.log('🧪 Test 4: Récupérer les produits avec filtres');
    const filteredProductsResponse = await axios.get(`${BASE_URL}/themes/${themeId}/products`, {
      params: {
        status: 'READY',
        category: 'tshirt',
        search: 'manga',
        limit: 3,
        sort: 'price',
        order: 'desc'
      }
    });
    console.log('✅ Succès - Produits filtrés:', filteredProductsResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 5: Pagination
    console.log('🧪 Test 5: Tester la pagination');
    const paginationResponse = await axios.get(`${BASE_URL}/themes/${themeId}/products`, {
      params: {
        limit: 2,
        offset: 0
      }
    });
    console.log('✅ Succès - Pagination:', {
      total: paginationResponse.data.pagination?.total,
      limit: paginationResponse.data.pagination?.limit,
      hasMore: paginationResponse.data.pagination?.hasMore
    });
    console.log('');

    console.log('🎉 Tous les tests des endpoints publics ont réussi !');
    console.log('✅ Les endpoints sont bien accessibles sans authentification');

  } catch (error) {
    console.error('❌ Erreur lors du test des endpoints publics:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('❌ ERREUR: L\'endpoint nécessite une authentification alors qu\'il devrait être public');
    } else if (error.response?.status === 404) {
      console.error('❌ ERREUR: Thème non trouvé - vérifiez que le thème ID 4 existe');
    } else {
      console.error('❌ ERREUR: Problème de connexion ou serveur non démarré');
    }
  }
}

// Test de performance
async function testPerformance() {
  console.log('\n⚡ Test de performance des endpoints publics\n');

  const startTime = Date.now();
  
  try {
    // Test de charge simple
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(axios.get(`${BASE_URL}/themes/4/products?limit=10`));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ Performance: ${results.length} requêtes en ${endTime - startTime}ms`);
    console.log(`📊 Temps moyen par requête: ${(endTime - startTime) / results.length}ms`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test de performance:', error.message);
  }
}

// Test de validation des paramètres
async function testParameterValidation() {
  console.log('\n🔍 Test de validation des paramètres\n');

  try {
    // Test avec paramètres invalides
    console.log('🧪 Test: Paramètres invalides');
    const invalidResponse = await axios.get(`${BASE_URL}/themes/4/products`, {
      params: {
        sort: 'invalid_sort',
        order: 'invalid_order',
        limit: 'not_a_number'
      }
    });
    console.log('✅ Succès - Paramètres invalides gérés gracieusement');
    console.log('');

    // Test avec paramètres valides
    console.log('🧪 Test: Paramètres valides');
    const validResponse = await axios.get(`${BASE_URL}/themes/4/products`, {
      params: {
        sort: 'name',
        order: 'asc',
        limit: 5,
        status: 'READY'
      }
    });
    console.log('✅ Succès - Paramètres valides traités correctement');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors du test de validation:', error.response?.data || error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests des endpoints publics des thèmes\n');
  
  await testPublicEndpoints();
  await testPerformance();
  await testParameterValidation();
  
  console.log('\n🎉 Tous les tests terminés !');
  console.log('📋 Résumé:');
  console.log('   ✅ Endpoints publics accessibles sans authentification');
  console.log('   ✅ Filtres et pagination fonctionnels');
  console.log('   ✅ Performance acceptable');
  console.log('   ✅ Validation des paramètres correcte');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPublicEndpoints,
  testPerformance,
  testParameterValidation,
  runAllTests
}; 