const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testDetailEndpoint() {
  console.log('🧪 Test de l\'endpoint de détail produit');
  
  try {
    // 1. Récupérer la liste des produits pour avoir un ID valide
    console.log('\n1️⃣ Récupération de la liste des produits...');
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      const firstProduct = listResponse.data.data.products[0];
      const productId = firstProduct.id;
      
      console.log(`✅ Produit trouvé: ID ${productId} - ${firstProduct.vendorName}`);
      
      // 2. Tester l'endpoint de détail
      console.log(`\n2️⃣ Test de l'endpoint de détail pour le produit ${productId}...`);
      const detailResponse = await axios.get(`${BASE_URL}/public/vendor-products/${productId}`);
      
      if (detailResponse.data.success) {
        console.log('✅ Endpoint de détail fonctionne !');
        console.log('📊 Données récupérées:');
        console.log(`   - ID: ${detailResponse.data.data.id}`);
        console.log(`   - Nom: ${detailResponse.data.data.vendorName}`);
        console.log(`   - Prix: ${detailResponse.data.data.price} FCFA`);
        console.log(`   - Status: ${detailResponse.data.data.status}`);
        
        if (detailResponse.data.data.designPositions && detailResponse.data.data.designPositions.length > 0) {
          const position = detailResponse.data.data.designPositions[0];
          console.log(`   - Design Position: x=${position.position.x}, y=${position.position.y}, scale=${position.position.scale}`);
        }
        
        if (detailResponse.data.data.bestSeller) {
          console.log(`   - Meilleure vente: ${detailResponse.data.data.bestSeller.isBestSeller}`);
          console.log(`   - Ventes: ${detailResponse.data.data.bestSeller.salesCount}`);
        }
      } else {
        console.log('❌ Erreur dans la réponse de détail:', detailResponse.data);
      }
    } else {
      console.log('❌ Aucun produit trouvé dans la liste');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📄 Réponse d\'erreur:', error.response.data);
    }
  }
}

async function testSwaggerEndpoint() {
  console.log('\n🔍 Test de l\'endpoint Swagger...');
  
  try {
    const swaggerResponse = await axios.get(`${BASE_URL}/api-docs`);
    console.log('✅ Swagger UI accessible');
    console.log(`📚 URL Swagger: ${BASE_URL}/api-docs`);
  } catch (error) {
    console.error('❌ Erreur accès Swagger:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  await testSwaggerEndpoint();
  await testDetailEndpoint();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 

const BASE_URL = 'http://localhost:3004';

async function testDetailEndpoint() {
  console.log('🧪 Test de l\'endpoint de détail produit');
  
  try {
    // 1. Récupérer la liste des produits pour avoir un ID valide
    console.log('\n1️⃣ Récupération de la liste des produits...');
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      const firstProduct = listResponse.data.data.products[0];
      const productId = firstProduct.id;
      
      console.log(`✅ Produit trouvé: ID ${productId} - ${firstProduct.vendorName}`);
      
      // 2. Tester l'endpoint de détail
      console.log(`\n2️⃣ Test de l'endpoint de détail pour le produit ${productId}...`);
      const detailResponse = await axios.get(`${BASE_URL}/public/vendor-products/${productId}`);
      
      if (detailResponse.data.success) {
        console.log('✅ Endpoint de détail fonctionne !');
        console.log('📊 Données récupérées:');
        console.log(`   - ID: ${detailResponse.data.data.id}`);
        console.log(`   - Nom: ${detailResponse.data.data.vendorName}`);
        console.log(`   - Prix: ${detailResponse.data.data.price} FCFA`);
        console.log(`   - Status: ${detailResponse.data.data.status}`);
        
        if (detailResponse.data.data.designPositions && detailResponse.data.data.designPositions.length > 0) {
          const position = detailResponse.data.data.designPositions[0];
          console.log(`   - Design Position: x=${position.position.x}, y=${position.position.y}, scale=${position.position.scale}`);
        }
        
        if (detailResponse.data.data.bestSeller) {
          console.log(`   - Meilleure vente: ${detailResponse.data.data.bestSeller.isBestSeller}`);
          console.log(`   - Ventes: ${detailResponse.data.data.bestSeller.salesCount}`);
        }
      } else {
        console.log('❌ Erreur dans la réponse de détail:', detailResponse.data);
      }
    } else {
      console.log('❌ Aucun produit trouvé dans la liste');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📄 Réponse d\'erreur:', error.response.data);
    }
  }
}

async function testSwaggerEndpoint() {
  console.log('\n🔍 Test de l\'endpoint Swagger...');
  
  try {
    const swaggerResponse = await axios.get(`${BASE_URL}/api-docs`);
    console.log('✅ Swagger UI accessible');
    console.log(`📚 URL Swagger: ${BASE_URL}/api-docs`);
  } catch (error) {
    console.error('❌ Erreur accès Swagger:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  await testSwaggerEndpoint();
  await testDetailEndpoint();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 