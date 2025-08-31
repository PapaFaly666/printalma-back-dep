const axios = require('axios');

const BASE_URL = 'http://localhost:5174/api';

// Fonction pour tester l'ajout de produits à un thème
async function testAddProductsToTheme() {
  try {
    console.log('🧪 Test: Ajouter des produits à un thème');
    
    const themeId = 4; // ID du thème à tester
    const payload = {
      productIds: [1, 2, 3], // IDs des produits à ajouter
      productStatus: 'READY' // Filtrer par produits prêts
    };

    const response = await axios.post(`${BASE_URL}/themes/${themeId}/products`, payload, {
      headers: {
        'Content-Type': 'application/json',
        // Ajouter le token d'authentification si nécessaire
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('✅ Succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester la récupération des produits disponibles
async function testGetAvailableProducts() {
  try {
    console.log('🧪 Test: Récupérer les produits disponibles pour un thème');
    
    const themeId = 4; // ID du thème à tester
    const params = {
      status: 'READY', // Filtrer par produits prêts
      limit: 10,
      offset: 0
    };

    const response = await axios.get(`${BASE_URL}/themes/${themeId}/available-products`, {
      params,
      headers: {
        // Ajouter le token d'authentification si nécessaire
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('✅ Succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester la récupération des produits d'un thème
async function testGetThemeProducts() {
  try {
    console.log('🧪 Test: Récupérer les produits d\'un thème');
    
    const themeId = 4; // ID du thème à tester
    const params = {
      status: 'READY', // Filtrer par produits prêts
      limit: 10,
      offset: 0,
      sort: 'name',
      order: 'asc'
    };

    const response = await axios.get(`${BASE_URL}/themes/${themeId}/products`, {
      params,
      headers: {
        // Ajouter le token d'authentification si nécessaire
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('✅ Succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester la suppression de produits d'un thème
async function testRemoveProductsFromTheme() {
  try {
    console.log('🧪 Test: Supprimer des produits d\'un thème');
    
    const themeId = 4; // ID du thème à tester
    const payload = {
      productIds: [1, 2, 3] // IDs des produits à supprimer
    };

    const response = await axios.delete(`${BASE_URL}/themes/${themeId}/products`, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        // Ajouter le token d'authentification si nécessaire
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('✅ Succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction pour tester la récupération des détails d'un thème avec ses produits
async function testGetThemeDetails() {
  try {
    console.log('🧪 Test: Récupérer les détails d\'un thème');
    
    const themeId = 4; // ID du thème à tester

    const response = await axios.get(`${BASE_URL}/themes/${themeId}`, {
      headers: {
        // Ajouter le token d'authentification si nécessaire
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log('✅ Succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Fonction principale pour exécuter tous les tests
async function runTests() {
  console.log('🚀 Démarrage des tests pour les endpoints de gestion des produits dans les thèmes\n');

  try {
    // Test 1: Récupérer les détails du thème
    await testGetThemeDetails();
    console.log('');

    // Test 2: Récupérer les produits disponibles
    const availableProducts = await testGetAvailableProducts();
    console.log('');

    // Test 3: Ajouter des produits au thème (si des produits sont disponibles)
    if (availableProducts.data && availableProducts.data.length > 0) {
      const productIds = availableProducts.data.slice(0, 3).map(p => p.id);
      console.log(`📦 Ajout de ${productIds.length} produits au thème:`, productIds);
      
      // Modifier le payload pour utiliser les vrais IDs
      const payload = {
        productIds: productIds,
        productStatus: 'READY'
      };

      const addResponse = await axios.post(`${BASE_URL}/themes/4/products`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Produits ajoutés avec succès:', addResponse.data);
    } else {
      console.log('⚠️ Aucun produit disponible pour l\'ajout');
    }

    console.log('');

    // Test 4: Récupérer les produits du thème
    const themeProducts = await testGetThemeProducts();
    console.log('');

    // Test 5: Supprimer des produits du thème (si des produits sont dans le thème)
    if (themeProducts.data && themeProducts.data.length > 0) {
      const productIdsToRemove = themeProducts.data.slice(0, 2).map(p => p.id);
      console.log(`🗑️ Suppression de ${productIdsToRemove.length} produits du thème:`, productIdsToRemove);
      
      const removeResponse = await axios.delete(`${BASE_URL}/themes/4/products`, {
        data: { productIds: productIdsToRemove },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Produits supprimés avec succès:', removeResponse.data);
    } else {
      console.log('⚠️ Aucun produit dans le thème pour la suppression');
    }

    console.log('\n🎉 Tous les tests terminés avec succès!');
  } catch (error) {
    console.error('\n💥 Erreur lors de l\'exécution des tests:', error.message);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testAddProductsToTheme,
  testGetAvailableProducts,
  testGetThemeProducts,
  testRemoveProductsFromTheme,
  testGetThemeDetails,
  runTests
}; 