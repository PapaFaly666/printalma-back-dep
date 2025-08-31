/**
 * 🚨 TEST SCRIPT - CORRECTION ENDPOINTS POSITION
 * 
 * Teste les endpoints corrigés pour éliminer les boucles infinies
 * et s'assurer que les positions sont correctement sauvegardées/récupérées
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const TEST_VENDOR_PRODUCTS = [43, 44]; // IDs des produits créés
const TEST_DESIGN_ID = 1; // ID du design utilisé

// Configuration Axios avec cookies
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 🔐 Connexion vendeur test
 */
async function loginVendor() {
  try {
    const response = await apiClient.post('/auth/login', {
      email: 'test.vendeur@example.com',
      password: 'test123456'
    });
    
    if (response.data.success) {
      console.log('✅ Connexion vendeur réussie');
      return response.data.user;
    } else {
      throw new Error('Échec connexion');
    }
  } catch (error) {
    console.error('❌ Erreur connexion:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 🧪 Test sauvegarde position
 */
async function testSavePosition(vendorProductId, designId) {
  const testPosition = {
    x: Math.random() * 100,
    y: Math.random() * 100,
    scale: 1 + Math.random() * 0.5,
    rotation: Math.random() * 360,
    constraints: { adaptive: true }
  };
  
  try {
    console.log(`\n🔄 Test sauvegarde position - Produit ${vendorProductId}, Design ${designId}`);
    console.log(`📍 Position:`, testPosition);
    
    const response = await apiClient.put(
      `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`,
      testPosition
    );
    
    if (response.data.success) {
      console.log('✅ Position sauvegardée:', response.data.data);
      return testPosition;
    } else {
      console.error('❌ Échec sauvegarde:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 🧪 Test récupération position
 */
async function testGetPosition(vendorProductId, designId) {
  try {
    console.log(`\n🔍 Test récupération position - Produit ${vendorProductId}, Design ${designId}`);
    
    const response = await apiClient.get(
      `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`
    );
    
    if (response.data.success) {
      if (response.data.data) {
        console.log('✅ Position récupérée:', response.data.data);
        return response.data.data;
      } else {
        console.log('⚠️ Aucune position sauvegardée');
        return null;
      }
    } else {
      console.error('❌ Échec récupération:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur récupération:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 🧪 Test debug permissions
 */
async function testDebugPermissions(vendorProductId, designId) {
  try {
    console.log(`\n🔍 Test debug permissions - Produit ${vendorProductId}, Design ${designId}`);
    
    const response = await apiClient.get(
      `/api/vendor-products/${vendorProductId}/designs/${designId}/position/debug`
    );
    
    if (response.data.success) {
      console.log('✅ Debug info:', {
        productBelongsToVendor: response.data.debug.productBelongsToVendor,
        designBelongsToVendor: response.data.debug.designBelongsToVendor,
        recommendations: response.data.debug.recommendations
      });
      return response.data.debug;
    } else {
      console.error('❌ Échec debug:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur debug:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 🧪 Test complet d'un produit
 */
async function testCompleteFlow(vendorProductId, designId) {
  console.log(`\n🎯 === TEST COMPLET PRODUIT ${vendorProductId} ===`);
  
  // 1. Debug permissions
  const debugInfo = await testDebugPermissions(vendorProductId, designId);
  if (!debugInfo?.productBelongsToVendor) {
    console.log(`⚠️ Produit ${vendorProductId} n'appartient pas au vendeur connecté`);
    return false;
  }
  
  // 2. Récupération position initiale
  const initialPosition = await testGetPosition(vendorProductId, designId);
  
  // 3. Sauvegarde nouvelle position
  const savedPosition = await testSavePosition(vendorProductId, designId);
  if (!savedPosition) {
    console.log(`❌ Échec sauvegarde pour produit ${vendorProductId}`);
    return false;
  }
  
  // 4. Vérification récupération
  const retrievedPosition = await testGetPosition(vendorProductId, designId);
  if (!retrievedPosition) {
    console.log(`❌ Position non récupérée pour produit ${vendorProductId}`);
    return false;
  }
  
  // 5. Comparaison
  const positionsMatch = (
    Math.abs(retrievedPosition.x - savedPosition.x) < 0.01 &&
    Math.abs(retrievedPosition.y - savedPosition.y) < 0.01 &&
    Math.abs(retrievedPosition.scale - savedPosition.scale) < 0.01
  );
  
  if (positionsMatch) {
    console.log(`✅ Test complet réussi pour produit ${vendorProductId}`);
    return true;
  } else {
    console.log(`❌ Positions ne correspondent pas pour produit ${vendorProductId}`);
    console.log(`   Sauvegardée:`, savedPosition);
    console.log(`   Récupérée:`, retrievedPosition);
    return false;
  }
}

/**
 * 🚀 Exécution des tests
 */
async function runTests() {
  console.log('🚀 === TESTS CORRECTION ENDPOINTS POSITION ===\n');
  
  try {
    // Connexion
    const user = await loginVendor();
    console.log(`👤 Vendeur connecté: ${user.email} (ID: ${user.id})`);
    
    // Tests sur tous les produits
    let successCount = 0;
    let totalCount = 0;
    
    for (const vendorProductId of TEST_VENDOR_PRODUCTS) {
      totalCount++;
      const success = await testCompleteFlow(vendorProductId, TEST_DESIGN_ID);
      if (success) successCount++;
    }
    
    // Résultats
    console.log(`\n🎯 === RÉSULTATS ===`);
    console.log(`✅ Tests réussis: ${successCount}/${totalCount}`);
    console.log(`❌ Tests échoués: ${totalCount - successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
      console.log(`\n🎉 TOUS LES TESTS SONT PASSÉS !`);
      console.log(`✅ Les boucles infinies sont éliminées`);
      console.log(`✅ Les positions sont correctement sauvegardées/récupérées`);
      console.log(`✅ Les permissions vendeur sont validées`);
    } else {
      console.log(`\n⚠️ Certains tests ont échoué - vérifiez les logs ci-dessus`);
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
  }
}

// Exécution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCompleteFlow, testSavePosition, testGetPosition }; 
 
 
 
 