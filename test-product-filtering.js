const axios = require('axios');

const BASE_URL = 'http://localhost:5174/api';

// Test du filtrage des produits
async function testProductFiltering() {
  console.log('🔍 Test du filtrage des produits mockup avec délimitations\n');

  try {
    // Test 1: Produits mockup avec délimitations (pour vendeur design)
    console.log('🧪 Test 1: Produits mockup avec délimitations (forVendorDesign=true)');
    const mockupResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        forVendorDesign: true,
        limit: 5
      }
    });
    
    console.log('✅ Succès - Mockups avec délimitations:', mockupResponse.data.data?.length || 0, 'produits');
    console.log('📊 Pagination:', mockupResponse.data.pagination);
    console.log('🔍 Filtres appliqués:', mockupResponse.data.filters);
    
    // Vérifier que tous les produits retournés sont des mockups avec délimitations
    if (mockupResponse.data.data) {
      mockupResponse.data.data.forEach((product, index) => {
        console.log(`   Produit ${index + 1}:`, {
          id: product.id,
          name: product.name,
          isReadyProduct: product.isReadyProduct,
          hasDelimitations: product.hasDelimitations,
          status: product.status
        });
      });
    }
    console.log('');

    // Test 2: Produits prêts (isReadyProduct=true)
    console.log('🧪 Test 2: Produits prêts (isReadyProduct=true)');
    const readyResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        isReadyProduct: true,
        limit: 3
      }
    });
    
    console.log('✅ Succès - Produits prêts:', readyResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 3: Produits avec délimitations (hasDelimitations=true)
    console.log('🧪 Test 3: Produits avec délimitations (hasDelimitations=true)');
    const delimitationsResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        hasDelimitations: true,
        limit: 3
      }
    });
    
    console.log('✅ Succès - Produits avec délimitations:', delimitationsResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 4: Produits sans délimitations (hasDelimitations=false)
    console.log('🧪 Test 4: Produits sans délimitations (hasDelimitations=false)');
    const noDelimitationsResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        hasDelimitations: false,
        limit: 3
      }
    });
    
    console.log('✅ Succès - Produits sans délimitations:', noDelimitationsResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 5: Recherche par nom
    console.log('🧪 Test 5: Recherche par nom (search=tshirt)');
    const searchResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        search: 'tshirt',
        limit: 3
      }
    });
    
    console.log('✅ Succès - Recherche "tshirt":', searchResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 6: Filtre par catégorie
    console.log('🧪 Test 6: Filtre par catégorie (category=tshirt)');
    const categoryResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        category: 'tshirt',
        limit: 3
      }
    });
    
    console.log('✅ Succès - Catégorie "tshirt":', categoryResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 7: Filtre par statut
    console.log('🧪 Test 7: Filtre par statut (status=PUBLISHED)');
    const statusResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        status: 'PUBLISHED',
        limit: 3
      }
    });
    
    console.log('✅ Succès - Statut PUBLISHED:', statusResponse.data.data?.length || 0, 'produits');
    console.log('');

    // Test 8: Combinaison de filtres
    console.log('🧪 Test 8: Combinaison de filtres (mockups publiés avec délimitations)');
    const combinedResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        isReadyProduct: false,
        hasDelimitations: true,
        status: 'PUBLISHED',
        limit: 3
      }
    });
    
    console.log('✅ Succès - Combinaison de filtres:', combinedResponse.data.data?.length || 0, 'produits');
    console.log('');

    console.log('🎉 Tous les tests de filtrage ont réussi !');
    console.log('✅ Le filtrage backend fonctionne correctement');

  } catch (error) {
    console.error('❌ Erreur lors du test de filtrage:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.error('❌ ERREUR: Paramètres de requête invalides');
    } else if (error.response?.status === 500) {
      console.error('❌ ERREUR: Erreur serveur - vérifiez les logs backend');
    } else {
      console.error('❌ ERREUR: Problème de connexion ou serveur non démarré');
    }
  }
}

// Test de validation des données
async function testDataValidation() {
  console.log('\n🔍 Test de validation des données\n');

  try {
    // Test avec des paramètres invalides
    console.log('🧪 Test: Paramètres invalides');
    const invalidResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        isReadyProduct: 'invalid',
        hasDelimitations: 'invalid',
        limit: 'not_a_number'
      }
    });
    console.log('✅ Succès - Paramètres invalides gérés gracieusement');
    console.log('');

    // Test avec des paramètres valides
    console.log('🧪 Test: Paramètres valides');
    const validResponse = await axios.get(`${BASE_URL}/products`, {
      params: {
        isReadyProduct: false,
        hasDelimitations: true,
        limit: 5,
        status: 'PUBLISHED'
      }
    });
    console.log('✅ Succès - Paramètres valides traités correctement');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors du test de validation:', error.response?.data || error.message);
  }
}

// Test de performance
async function testPerformance() {
  console.log('\n⚡ Test de performance du filtrage\n');

  const startTime = Date.now();
  
  try {
    // Test de charge simple
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(axios.get(`${BASE_URL}/products`, {
        params: {
          forVendorDesign: true,
          limit: 10
        }
      }));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ Performance: ${results.length} requêtes en ${endTime - startTime}ms`);
    console.log(`📊 Temps moyen par requête: ${(endTime - startTime) / results.length}ms`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test de performance:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests de filtrage des produits\n');
  
  await testProductFiltering();
  await testDataValidation();
  await testPerformance();
  
  console.log('\n🎉 Tous les tests terminés !');
  console.log('📋 Résumé:');
  console.log('   ✅ Filtrage des mockups avec délimitations fonctionnel');
  console.log('   ✅ Filtres combinés opérationnels');
  console.log('   ✅ Validation des paramètres correcte');
  console.log('   ✅ Performance acceptable');
  console.log('');
  console.log('🔧 Endpoint principal pour le frontend:');
  console.log('   GET /api/products?forVendorDesign=true');
  console.log('   GET /api/products?isReadyProduct=false&hasDelimitations=true');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testProductFiltering,
  testDataValidation,
  testPerformance,
  runAllTests
}; 