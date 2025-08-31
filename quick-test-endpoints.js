const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Tests rapides
async function quickTest() {
  console.log('🚀 Tests rapides des endpoints Best Sellers\n');

  const endpoints = [
    {
      name: 'GET /public/best-sellers',
      url: `${BASE_URL}/public/best-sellers`
    },
    {
      name: 'GET /public/best-sellers?limit=5',
      url: `${BASE_URL}/public/best-sellers?limit=5`
    },
    {
      name: 'GET /public/best-sellers/stats',
      url: `${BASE_URL}/public/best-sellers/stats`
    },
    {
      name: 'GET /public/best-sellers/vendor/1',
      url: `${BASE_URL}/public/best-sellers/vendor/1`
    },
    {
      name: 'GET /public/best-sellers/category/T-shirts',
      url: `${BASE_URL}/public/best-sellers/category/T-shirts`
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Test: ${endpoint.name}`);
      const startTime = Date.now();
      const response = await axios.get(endpoint.url);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Succès (${duration}ms) - Status: ${response.status}`);
      
      if (response.data) {
        if (response.data.success) {
          console.log(`📊 Données: ${response.data.data?.length || 0} produits`);
          if (response.data.stats) {
            console.log(`📈 Stats: ${response.data.stats.totalBestSellers || 0} best-sellers`);
          }
        } else {
          console.log(`⚠️ Réponse: ${JSON.stringify(response.data)}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
    
    console.log('---\n');
  }
}

// Test d'incrémentation des vues
async function testViewIncrement() {
  console.log('👁️ Test incrémentation des vues\n');
  
  try {
    // Récupérer un produit
    const response = await axios.get(`${BASE_URL}/public/best-sellers?limit=1`);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const productId = response.data.data[0].id;
      console.log(`🔍 Test incrémentation vues pour produit ${productId}`);
      
      const viewResponse = await axios.get(`${BASE_URL}/public/best-sellers/product/${productId}/view`);
      console.log(`✅ Vues incrémentées: ${viewResponse.data.message}`);
      
    } else {
      console.log('⚠️ Aucun produit trouvé pour tester l\'incrémentation');
    }
    
  } catch (error) {
    console.log(`❌ Erreur incrémentation: ${error.message}`);
  }
}

// Test de structure de réponse
async function testResponseStructure() {
  console.log('📋 Test structure de réponse\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/public/best-sellers?limit=1`);
    const data = response.data;
    
    console.log('Vérification des champs requis:');
    
    const requiredFields = ['success', 'data', 'pagination'];
    for (const field of requiredFields) {
      const hasField = data.hasOwnProperty(field);
      console.log(`${hasField ? '✅' : '❌'} ${field}`);
    }
    
    if (data.data && data.data.length > 0) {
      const product = data.data[0];
      console.log('\nChamps produit:');
      
      const productFields = ['id', 'name', 'price', 'salesCount', 'bestSellerRank'];
      for (const field of productFields) {
        const hasField = product.hasOwnProperty(field);
        console.log(`${hasField ? '✅' : '❌'} ${field}`);
      }
      
      console.log('\nChamps design (optionnels):');
      const designFields = ['designCloudinaryUrl', 'designWidth', 'designHeight'];
      for (const field of designFields) {
        const hasField = product.hasOwnProperty(field);
        console.log(`${hasField ? '✅' : '⚠️'} ${field}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erreur structure: ${error.message}`);
  }
}

// Exécution
async function runQuickTests() {
  console.log('🏆 TESTS RAPIDES - API BEST SELLERS');
  console.log('====================================\n');
  
  await quickTest();
  await testViewIncrement();
  await testResponseStructure();
  
  console.log('🎉 Tests rapides terminés');
}

if (require.main === module) {
  runQuickTests();
}

module.exports = { runQuickTests }; 