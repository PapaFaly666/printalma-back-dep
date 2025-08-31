const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testPriceDisplay() {
  console.log('💰 Test de l\'affichage du prix dans l\'endpoint de détail');
  
  try {
    // 1. Récupérer la liste des produits pour avoir un ID valide
    console.log('\n1️⃣ Récupération de la liste des produits...');
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      const firstProduct = listResponse.data.data.products[0];
      const productId = firstProduct.id;
      
      console.log(`✅ Produit trouvé: ID ${productId} - ${firstProduct.vendorName}`);
      console.log(`💰 Prix dans la liste: ${firstProduct.price} FCFA`);
      
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
        
        // Vérifier que le prix est bien présent et formaté
        if (detailResponse.data.data.price !== undefined && detailResponse.data.data.price !== null) {
          console.log(`✅ Prix affiché correctement: ${detailResponse.data.data.price} FCFA`);
          
          // Formatage du prix
          const formattedPrice = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
          }).format(detailResponse.data.data.price);
          
          console.log(`💰 Prix formaté: ${formattedPrice}`);
        } else {
          console.log('❌ Prix manquant dans la réponse');
        }
        
        // Vérifier les autres informations importantes
        if (detailResponse.data.data.bestSeller) {
          console.log(`   - Meilleure vente: ${detailResponse.data.data.bestSeller.isBestSeller}`);
          console.log(`   - Ventes: ${detailResponse.data.data.bestSeller.salesCount}`);
          console.log(`   - Revenus: ${detailResponse.data.data.bestSeller.totalRevenue} FCFA`);
        }
        
        if (detailResponse.data.data.designPositions && detailResponse.data.data.designPositions.length > 0) {
          const position = detailResponse.data.data.designPositions[0];
          console.log(`   - Design Position: x=${position.position.x}, y=${position.position.y}, scale=${position.position.scale}`);
        }
        
        // Afficher la structure complète pour debug
        console.log('\n📋 Structure complète de la réponse:');
        console.log(JSON.stringify(detailResponse.data, null, 2));
        
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

async function testMultipleProducts() {
  console.log('\n🔄 Test avec plusieurs produits...');
  
  try {
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      console.log(`📦 ${listResponse.data.data.products.length} produits trouvés`);
      
      listResponse.data.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id} - ${product.vendorName} - Prix: ${product.price} FCFA`);
      });
      
      // Tester le premier produit avec prix
      const productWithPrice = listResponse.data.data.products.find(p => p.price > 0);
      if (productWithPrice) {
        console.log(`\n🎯 Test du produit avec prix: ID ${productWithPrice.id}`);
        const detailResponse = await axios.get(`${BASE_URL}/public/vendor-products/${productWithPrice.id}`);
        
        if (detailResponse.data.success) {
          console.log(`✅ Prix dans détail: ${detailResponse.data.data.price} FCFA`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur test multiple:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de prix...\n');
  
  await testPriceDisplay();
  await testMultipleProducts();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 

const BASE_URL = 'http://localhost:3004';

async function testPriceDisplay() {
  console.log('💰 Test de l\'affichage du prix dans l\'endpoint de détail');
  
  try {
    // 1. Récupérer la liste des produits pour avoir un ID valide
    console.log('\n1️⃣ Récupération de la liste des produits...');
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      const firstProduct = listResponse.data.data.products[0];
      const productId = firstProduct.id;
      
      console.log(`✅ Produit trouvé: ID ${productId} - ${firstProduct.vendorName}`);
      console.log(`💰 Prix dans la liste: ${firstProduct.price} FCFA`);
      
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
        
        // Vérifier que le prix est bien présent et formaté
        if (detailResponse.data.data.price !== undefined && detailResponse.data.data.price !== null) {
          console.log(`✅ Prix affiché correctement: ${detailResponse.data.data.price} FCFA`);
          
          // Formatage du prix
          const formattedPrice = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
          }).format(detailResponse.data.data.price);
          
          console.log(`💰 Prix formaté: ${formattedPrice}`);
        } else {
          console.log('❌ Prix manquant dans la réponse');
        }
        
        // Vérifier les autres informations importantes
        if (detailResponse.data.data.bestSeller) {
          console.log(`   - Meilleure vente: ${detailResponse.data.data.bestSeller.isBestSeller}`);
          console.log(`   - Ventes: ${detailResponse.data.data.bestSeller.salesCount}`);
          console.log(`   - Revenus: ${detailResponse.data.data.bestSeller.totalRevenue} FCFA`);
        }
        
        if (detailResponse.data.data.designPositions && detailResponse.data.data.designPositions.length > 0) {
          const position = detailResponse.data.data.designPositions[0];
          console.log(`   - Design Position: x=${position.position.x}, y=${position.position.y}, scale=${position.position.scale}`);
        }
        
        // Afficher la structure complète pour debug
        console.log('\n📋 Structure complète de la réponse:');
        console.log(JSON.stringify(detailResponse.data, null, 2));
        
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

async function testMultipleProducts() {
  console.log('\n🔄 Test avec plusieurs produits...');
  
  try {
    const listResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (listResponse.data.success && listResponse.data.data.products.length > 0) {
      console.log(`📦 ${listResponse.data.data.products.length} produits trouvés`);
      
      listResponse.data.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id} - ${product.vendorName} - Prix: ${product.price} FCFA`);
      });
      
      // Tester le premier produit avec prix
      const productWithPrice = listResponse.data.data.products.find(p => p.price > 0);
      if (productWithPrice) {
        console.log(`\n🎯 Test du produit avec prix: ID ${productWithPrice.id}`);
        const detailResponse = await axios.get(`${BASE_URL}/public/vendor-products/${productWithPrice.id}`);
        
        if (detailResponse.data.success) {
          console.log(`✅ Prix dans détail: ${detailResponse.data.data.price} FCFA`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur test multiple:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de prix...\n');
  
  await testPriceDisplay();
  await testMultipleProducts();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 