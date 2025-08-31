const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testDuplicationFix() {
  console.log('🔍 Test de la correction du problème de duplication...\n');

  try {
    // 1. Tester l'endpoint /vendor/products
    console.log('1️⃣ Test de l\'endpoint /vendor/products...');
    
    const response = await axios.get(`${BASE_URL}/vendor/products`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`   Produits retournés: ${products.length}`);
      
      // Vérifier les doublons
      const productIds = products.map(p => p.id);
      const uniqueIds = [...new Set(productIds)];
      
      if (productIds.length !== uniqueIds.length) {
        console.log(`   ❌ DOUBLONS DÉTECTÉS: ${productIds.length - uniqueIds.length} doublons`);
        
        // Identifier les doublons
        const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        
        uniqueDuplicates.forEach(dupId => {
          const dupProducts = products.filter(p => p.id === dupId);
          console.log(`     - ID: ${dupId}, Count: ${dupProducts.length}`);
          dupProducts.forEach((p, index) => {
            console.log(`       * Instance ${index + 1}: ${p.vendorName} (${p.status})`);
          });
        });
      } else {
        console.log(`   ✅ Aucun doublon détecté dans la réponse`);
      }
      
      // Afficher les premiers produits pour vérification
      console.log('\n📋 Premiers produits (max 5):');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id}, Nom: ${product.vendorName}, Prix: ${product.price} FCFA`);
      });
      
    } else {
      console.log('   ❌ Erreur dans la réponse API');
    }

    // 2. Tester l'endpoint public
    console.log('\n2️⃣ Test de l\'endpoint /public/vendor-products...');
    
    const publicResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (publicResponse.data.success) {
      const publicProducts = publicResponse.data.data.products;
      console.log(`   Produits publics retournés: ${publicProducts.length}`);
      
      // Vérifier les doublons
      const publicProductIds = publicProducts.map(p => p.id);
      const uniquePublicIds = [...new Set(publicProductIds)];
      
      if (publicProductIds.length !== uniquePublicIds.length) {
        console.log(`   ❌ DOUBLONS DÉTECTÉS: ${publicProductIds.length - uniquePublicIds.length} doublons`);
      } else {
        console.log(`   ✅ Aucun doublon détecté dans la réponse publique`);
      }
    }

    // 3. Tester avec un vendeur spécifique
    console.log('\n3️⃣ Test avec un vendeur spécifique...');
    
    // Essayer de trouver un vendeur avec des produits
    const vendorsResponse = await axios.get(`${BASE_URL}/vendor/products`);
    
    if (vendorsResponse.data.success && vendorsResponse.data.data.products.length > 0) {
      const firstProduct = vendorsResponse.data.data.products[0];
      const vendorId = firstProduct.vendorId || 1; // Utiliser le premier vendeur trouvé
      
      console.log(`   Test avec le vendeur ID: ${vendorId}`);
      
      const vendorProductsResponse = await axios.get(`${BASE_URL}/vendor/products?vendorId=${vendorId}`);
      
      if (vendorProductsResponse.data.success) {
        const vendorProducts = vendorProductsResponse.data.data.products;
        console.log(`   Produits du vendeur: ${vendorProducts.length}`);
        
        // Vérifier les doublons pour ce vendeur
        const vendorProductIds = vendorProducts.map(p => p.id);
        const uniqueVendorIds = [...new Set(vendorProductIds)];
        
        if (vendorProductIds.length !== uniqueVendorIds.length) {
          console.log(`   ❌ DOUBLONS pour ce vendeur: ${vendorProductIds.length - uniqueVendorIds.length} doublons`);
        } else {
          console.log(`   ✅ Aucun doublon pour ce vendeur`);
        }
      }
    }

    // 4. Vérifier la structure des données
    console.log('\n4️⃣ Vérification de la structure des données...');
    
    if (response.data.success && response.data.data.products.length > 0) {
      const sampleProduct = response.data.data.products[0];
      console.log('   Structure d\'un produit:');
      console.log(`     - ID: ${sampleProduct.id}`);
      console.log(`     - Nom: ${sampleProduct.vendorName}`);
      console.log(`     - Prix: ${sampleProduct.price}`);
      console.log(`     - Status: ${sampleProduct.status}`);
      
      // Vérifier les propriétés importantes
      const importantProps = ['id', 'vendorName', 'price', 'status', 'designId', 'baseProductId'];
      const missingProps = importantProps.filter(prop => !(prop in sampleProduct));
      
      if (missingProps.length > 0) {
        console.log(`   ⚠️ Propriétés manquantes: ${missingProps.join(', ')}`);
      } else {
        console.log(`   ✅ Toutes les propriétés importantes sont présentes`);
      }
    }

    // 5. Recommandations
    console.log('\n5️⃣ Recommandations:');
    
    if (response.data.success) {
      const products = response.data.data.products;
      const productIds = products.map(p => p.id);
      const uniqueIds = [...new Set(productIds)];
      
      if (productIds.length !== uniqueIds.length) {
        console.log('   🔧 Actions nécessaires:');
        console.log('   1. Exécuter: node clean-duplicates.js');
        console.log('   2. Appliquer la migration: npx prisma migrate dev --name add-uniqueness-constraints');
        console.log('   3. Redémarrer le serveur');
        console.log('   4. Tester à nouveau');
      } else {
        console.log('   ✅ Aucune action nécessaire - pas de doublons détectés');
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Relancer ce test: node test-duplication-fix.js');
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
  console.log('🚀 Démarrage des tests de correction duplication...\n');
  
  await testSwaggerEndpoint();
  await testDuplicationFix();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 

const BASE_URL = 'http://localhost:3004';

async function testDuplicationFix() {
  console.log('🔍 Test de la correction du problème de duplication...\n');

  try {
    // 1. Tester l'endpoint /vendor/products
    console.log('1️⃣ Test de l\'endpoint /vendor/products...');
    
    const response = await axios.get(`${BASE_URL}/vendor/products`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`   Produits retournés: ${products.length}`);
      
      // Vérifier les doublons
      const productIds = products.map(p => p.id);
      const uniqueIds = [...new Set(productIds)];
      
      if (productIds.length !== uniqueIds.length) {
        console.log(`   ❌ DOUBLONS DÉTECTÉS: ${productIds.length - uniqueIds.length} doublons`);
        
        // Identifier les doublons
        const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        
        uniqueDuplicates.forEach(dupId => {
          const dupProducts = products.filter(p => p.id === dupId);
          console.log(`     - ID: ${dupId}, Count: ${dupProducts.length}`);
          dupProducts.forEach((p, index) => {
            console.log(`       * Instance ${index + 1}: ${p.vendorName} (${p.status})`);
          });
        });
      } else {
        console.log(`   ✅ Aucun doublon détecté dans la réponse`);
      }
      
      // Afficher les premiers produits pour vérification
      console.log('\n📋 Premiers produits (max 5):');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id}, Nom: ${product.vendorName}, Prix: ${product.price} FCFA`);
      });
      
    } else {
      console.log('   ❌ Erreur dans la réponse API');
    }

    // 2. Tester l'endpoint public
    console.log('\n2️⃣ Test de l\'endpoint /public/vendor-products...');
    
    const publicResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (publicResponse.data.success) {
      const publicProducts = publicResponse.data.data.products;
      console.log(`   Produits publics retournés: ${publicProducts.length}`);
      
      // Vérifier les doublons
      const publicProductIds = publicProducts.map(p => p.id);
      const uniquePublicIds = [...new Set(publicProductIds)];
      
      if (publicProductIds.length !== uniquePublicIds.length) {
        console.log(`   ❌ DOUBLONS DÉTECTÉS: ${publicProductIds.length - uniquePublicIds.length} doublons`);
      } else {
        console.log(`   ✅ Aucun doublon détecté dans la réponse publique`);
      }
    }

    // 3. Tester avec un vendeur spécifique
    console.log('\n3️⃣ Test avec un vendeur spécifique...');
    
    // Essayer de trouver un vendeur avec des produits
    const vendorsResponse = await axios.get(`${BASE_URL}/vendor/products`);
    
    if (vendorsResponse.data.success && vendorsResponse.data.data.products.length > 0) {
      const firstProduct = vendorsResponse.data.data.products[0];
      const vendorId = firstProduct.vendorId || 1; // Utiliser le premier vendeur trouvé
      
      console.log(`   Test avec le vendeur ID: ${vendorId}`);
      
      const vendorProductsResponse = await axios.get(`${BASE_URL}/vendor/products?vendorId=${vendorId}`);
      
      if (vendorProductsResponse.data.success) {
        const vendorProducts = vendorProductsResponse.data.data.products;
        console.log(`   Produits du vendeur: ${vendorProducts.length}`);
        
        // Vérifier les doublons pour ce vendeur
        const vendorProductIds = vendorProducts.map(p => p.id);
        const uniqueVendorIds = [...new Set(vendorProductIds)];
        
        if (vendorProductIds.length !== uniqueVendorIds.length) {
          console.log(`   ❌ DOUBLONS pour ce vendeur: ${vendorProductIds.length - uniqueVendorIds.length} doublons`);
        } else {
          console.log(`   ✅ Aucun doublon pour ce vendeur`);
        }
      }
    }

    // 4. Vérifier la structure des données
    console.log('\n4️⃣ Vérification de la structure des données...');
    
    if (response.data.success && response.data.data.products.length > 0) {
      const sampleProduct = response.data.data.products[0];
      console.log('   Structure d\'un produit:');
      console.log(`     - ID: ${sampleProduct.id}`);
      console.log(`     - Nom: ${sampleProduct.vendorName}`);
      console.log(`     - Prix: ${sampleProduct.price}`);
      console.log(`     - Status: ${sampleProduct.status}`);
      
      // Vérifier les propriétés importantes
      const importantProps = ['id', 'vendorName', 'price', 'status', 'designId', 'baseProductId'];
      const missingProps = importantProps.filter(prop => !(prop in sampleProduct));
      
      if (missingProps.length > 0) {
        console.log(`   ⚠️ Propriétés manquantes: ${missingProps.join(', ')}`);
      } else {
        console.log(`   ✅ Toutes les propriétés importantes sont présentes`);
      }
    }

    // 5. Recommandations
    console.log('\n5️⃣ Recommandations:');
    
    if (response.data.success) {
      const products = response.data.data.products;
      const productIds = products.map(p => p.id);
      const uniqueIds = [...new Set(productIds)];
      
      if (productIds.length !== uniqueIds.length) {
        console.log('   🔧 Actions nécessaires:');
        console.log('   1. Exécuter: node clean-duplicates.js');
        console.log('   2. Appliquer la migration: npx prisma migrate dev --name add-uniqueness-constraints');
        console.log('   3. Redémarrer le serveur');
        console.log('   4. Tester à nouveau');
      } else {
        console.log('   ✅ Aucune action nécessaire - pas de doublons détectés');
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Relancer ce test: node test-duplication-fix.js');
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
  console.log('🚀 Démarrage des tests de correction duplication...\n');
  
  await testSwaggerEndpoint();
  await testDuplicationFix();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 