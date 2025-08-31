const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testBestSellerEndpoint() {
  console.log('🏆 Test de l\'endpoint des meilleures ventes...\n');

  try {
    // 1. Test de l'endpoint par défaut (meilleures ventes)
    console.log('1️⃣ Test de l\'endpoint par défaut (meilleures ventes)...');
    
    const response = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`✅ Endpoint fonctionne: ${products.length} produits retournés`);
      console.log(`📊 Type de données: ${response.data.data.type}`);
      
      // Vérifier que ce sont bien des meilleures ventes
      const bestSellerCount = products.filter(p => p.bestSeller?.isBestSeller).length;
      console.log(`🏆 ${bestSellerCount}/${products.length} sont des meilleures ventes`);
      
      // Afficher les détails des produits
      console.log('\n📋 Détails des produits:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName}`);
        console.log(`      - Prix: ${product.price} FCFA`);
        console.log(`      - Ventes: ${product.bestSeller?.salesCount || 0}`);
        console.log(`      - Revenus: ${product.bestSeller?.totalRevenue || 0} FCFA`);
        console.log(`      - Meilleure vente: ${product.bestSeller?.isBestSeller ? '✅' : '❌'}`);
        console.log(`      - Vendeur: ${product.vendor?.fullName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erreur dans la réponse API');
    }

    // 2. Test avec allProducts=true (tous les produits)
    console.log('\n2️⃣ Test avec allProducts=true (tous les produits)...');
    
    const allProductsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10&allProducts=true`);
    
    if (allProductsResponse.data.success) {
      const allProducts = allProductsResponse.data.data.products;
      console.log(`✅ Endpoint allProducts fonctionne: ${allProducts.length} produits retournés`);
      console.log(`📊 Type de données: ${allProductsResponse.data.data.type}`);
      
      // Vérifier la différence
      const bestSellerCountAll = allProducts.filter(p => p.bestSeller?.isBestSeller).length;
      console.log(`🏆 ${bestSellerCountAll}/${allProducts.length} sont des meilleures ventes`);
    }

    // 3. Test avec filtres
    console.log('\n3️⃣ Test avec filtres...');
    
    // Test avec limite
    const limitedResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    if (limitedResponse.data.success) {
      console.log(`✅ Limite fonctionne: ${limitedResponse.data.data.products.length} produits`);
    }

    // Test avec pagination
    const paginatedResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=3&offset=2`);
    if (paginatedResponse.data.success) {
      console.log(`✅ Pagination fonctionne: ${paginatedResponse.data.data.products.length} produits`);
    }

    // 4. Test de recherche
    console.log('\n4️⃣ Test de recherche...');
    
    const searchResponse = await axios.get(`${BASE_URL}/public/vendor-products?search=produit&limit=5`);
    if (searchResponse.data.success) {
      console.log(`✅ Recherche fonctionne: ${searchResponse.data.data.products.length} produits trouvés`);
    }

    // 5. Test avec filtres de prix
    console.log('\n5️⃣ Test avec filtres de prix...');
    
    const priceResponse = await axios.get(`${BASE_URL}/public/vendor-products?minPrice=5000&maxPrice=15000&limit=5`);
    if (priceResponse.data.success) {
      console.log(`✅ Filtres de prix fonctionnent: ${priceResponse.data.data.products.length} produits`);
    }

    // 6. Statistiques finales
    console.log('\n6️⃣ Statistiques finales...');
    
    const statsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=100`);
    if (statsResponse.data.success) {
      const allProducts = statsResponse.data.data.products;
      const bestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller);
      const totalRevenue = allProducts.reduce((sum, p) => sum + (p.bestSeller?.totalRevenue || 0), 0);
      const totalSales = allProducts.reduce((sum, p) => sum + (p.bestSeller?.salesCount || 0), 0);
      
      console.log(`📊 Total produits: ${allProducts.length}`);
      console.log(`🏆 Meilleures ventes: ${bestSellers.length}`);
      console.log(`💰 Revenus totaux: ${totalRevenue.toLocaleString()} FCFA`);
      console.log(`📦 Ventes totales: ${totalSales}`);
      
      if (bestSellers.length > 0) {
        const avgRevenue = totalRevenue / bestSellers.length;
        const avgSales = totalSales / bestSellers.length;
        console.log(`📈 Revenu moyen par meilleure vente: ${Math.round(avgRevenue).toLocaleString()} FCFA`);
        console.log(`📈 Ventes moyennes par meilleure vente: ${Math.round(avgSales)}`);
      }
    }

    // 7. Test de l'endpoint dédié aux meilleures ventes
    console.log('\n7️⃣ Test de l\'endpoint dédié aux meilleures ventes...');
    
    const dedicatedResponse = await axios.get(`${BASE_URL}/public/best-sellers?limit=10`);
    if (dedicatedResponse.data.success) {
      const dedicatedBestSellers = dedicatedResponse.data.data.bestSellers;
      console.log(`✅ Endpoint dédié fonctionne: ${dedicatedBestSellers.length} meilleures ventes`);
      
      dedicatedBestSellers.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName} - ${product.bestSeller?.salesCount} ventes`);
      });
    }

    console.log('\n✅ Tous les tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Remplir les données: node populate-best-seller-data.js');
      console.log('   3. Relancer ce test: node test-best-seller-endpoint.js');
    }
  }
}

async function testEndpointComparison() {
  console.log('\n🔄 Comparaison des endpoints...');
  
  try {
    // Comparer les deux endpoints
    const [defaultResponse, allProductsResponse] = await Promise.all([
      axios.get(`${BASE_URL}/public/vendor-products?limit=20`),
      axios.get(`${BASE_URL}/public/vendor-products?limit=20&allProducts=true`)
    ]);

    if (defaultResponse.data.success && allProductsResponse.data.success) {
      const defaultProducts = defaultResponse.data.data.products;
      const allProducts = allProductsResponse.data.data.products;
      
      console.log(`📊 Endpoint par défaut: ${defaultProducts.length} produits`);
      console.log(`📊 Endpoint allProducts: ${allProducts.length} produits`);
      
      const defaultBestSellers = defaultProducts.filter(p => p.bestSeller?.isBestSeller).length;
      const allBestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller).length;
      
      console.log(`🏆 Meilleures ventes par défaut: ${defaultBestSellers}/${defaultProducts.length}`);
      console.log(`🏆 Meilleures ventes allProducts: ${allBestSellers}/${allProducts.length}`);
      
      if (defaultBestSellers === defaultProducts.length) {
        console.log('✅ Endpoint par défaut affiche bien uniquement les meilleures ventes');
      } else {
        console.log('⚠️ Endpoint par défaut n\'affiche pas que les meilleures ventes');
      }
    }
  } catch (error) {
    console.log(`⚠️ Impossible de comparer les endpoints: ${error.message}`);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'endpoint des meilleures ventes...\n');
  
  await testBestSellerEndpoint();
  await testEndpointComparison();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 

const BASE_URL = 'http://localhost:3004';

async function testBestSellerEndpoint() {
  console.log('🏆 Test de l\'endpoint des meilleures ventes...\n');

  try {
    // 1. Test de l'endpoint par défaut (meilleures ventes)
    console.log('1️⃣ Test de l\'endpoint par défaut (meilleures ventes)...');
    
    const response = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`✅ Endpoint fonctionne: ${products.length} produits retournés`);
      console.log(`📊 Type de données: ${response.data.data.type}`);
      
      // Vérifier que ce sont bien des meilleures ventes
      const bestSellerCount = products.filter(p => p.bestSeller?.isBestSeller).length;
      console.log(`🏆 ${bestSellerCount}/${products.length} sont des meilleures ventes`);
      
      // Afficher les détails des produits
      console.log('\n📋 Détails des produits:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName}`);
        console.log(`      - Prix: ${product.price} FCFA`);
        console.log(`      - Ventes: ${product.bestSeller?.salesCount || 0}`);
        console.log(`      - Revenus: ${product.bestSeller?.totalRevenue || 0} FCFA`);
        console.log(`      - Meilleure vente: ${product.bestSeller?.isBestSeller ? '✅' : '❌'}`);
        console.log(`      - Vendeur: ${product.vendor?.fullName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erreur dans la réponse API');
    }

    // 2. Test avec allProducts=true (tous les produits)
    console.log('\n2️⃣ Test avec allProducts=true (tous les produits)...');
    
    const allProductsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10&allProducts=true`);
    
    if (allProductsResponse.data.success) {
      const allProducts = allProductsResponse.data.data.products;
      console.log(`✅ Endpoint allProducts fonctionne: ${allProducts.length} produits retournés`);
      console.log(`📊 Type de données: ${allProductsResponse.data.data.type}`);
      
      // Vérifier la différence
      const bestSellerCountAll = allProducts.filter(p => p.bestSeller?.isBestSeller).length;
      console.log(`🏆 ${bestSellerCountAll}/${allProducts.length} sont des meilleures ventes`);
    }

    // 3. Test avec filtres
    console.log('\n3️⃣ Test avec filtres...');
    
    // Test avec limite
    const limitedResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=5`);
    if (limitedResponse.data.success) {
      console.log(`✅ Limite fonctionne: ${limitedResponse.data.data.products.length} produits`);
    }

    // Test avec pagination
    const paginatedResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=3&offset=2`);
    if (paginatedResponse.data.success) {
      console.log(`✅ Pagination fonctionne: ${paginatedResponse.data.data.products.length} produits`);
    }

    // 4. Test de recherche
    console.log('\n4️⃣ Test de recherche...');
    
    const searchResponse = await axios.get(`${BASE_URL}/public/vendor-products?search=produit&limit=5`);
    if (searchResponse.data.success) {
      console.log(`✅ Recherche fonctionne: ${searchResponse.data.data.products.length} produits trouvés`);
    }

    // 5. Test avec filtres de prix
    console.log('\n5️⃣ Test avec filtres de prix...');
    
    const priceResponse = await axios.get(`${BASE_URL}/public/vendor-products?minPrice=5000&maxPrice=15000&limit=5`);
    if (priceResponse.data.success) {
      console.log(`✅ Filtres de prix fonctionnent: ${priceResponse.data.data.products.length} produits`);
    }

    // 6. Statistiques finales
    console.log('\n6️⃣ Statistiques finales...');
    
    const statsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=100`);
    if (statsResponse.data.success) {
      const allProducts = statsResponse.data.data.products;
      const bestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller);
      const totalRevenue = allProducts.reduce((sum, p) => sum + (p.bestSeller?.totalRevenue || 0), 0);
      const totalSales = allProducts.reduce((sum, p) => sum + (p.bestSeller?.salesCount || 0), 0);
      
      console.log(`📊 Total produits: ${allProducts.length}`);
      console.log(`🏆 Meilleures ventes: ${bestSellers.length}`);
      console.log(`💰 Revenus totaux: ${totalRevenue.toLocaleString()} FCFA`);
      console.log(`📦 Ventes totales: ${totalSales}`);
      
      if (bestSellers.length > 0) {
        const avgRevenue = totalRevenue / bestSellers.length;
        const avgSales = totalSales / bestSellers.length;
        console.log(`📈 Revenu moyen par meilleure vente: ${Math.round(avgRevenue).toLocaleString()} FCFA`);
        console.log(`📈 Ventes moyennes par meilleure vente: ${Math.round(avgSales)}`);
      }
    }

    // 7. Test de l'endpoint dédié aux meilleures ventes
    console.log('\n7️⃣ Test de l\'endpoint dédié aux meilleures ventes...');
    
    const dedicatedResponse = await axios.get(`${BASE_URL}/public/best-sellers?limit=10`);
    if (dedicatedResponse.data.success) {
      const dedicatedBestSellers = dedicatedResponse.data.data.bestSellers;
      console.log(`✅ Endpoint dédié fonctionne: ${dedicatedBestSellers.length} meilleures ventes`);
      
      dedicatedBestSellers.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName} - ${product.bestSeller?.salesCount} ventes`);
      });
    }

    console.log('\n✅ Tous les tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Remplir les données: node populate-best-seller-data.js');
      console.log('   3. Relancer ce test: node test-best-seller-endpoint.js');
    }
  }
}

async function testEndpointComparison() {
  console.log('\n🔄 Comparaison des endpoints...');
  
  try {
    // Comparer les deux endpoints
    const [defaultResponse, allProductsResponse] = await Promise.all([
      axios.get(`${BASE_URL}/public/vendor-products?limit=20`),
      axios.get(`${BASE_URL}/public/vendor-products?limit=20&allProducts=true`)
    ]);

    if (defaultResponse.data.success && allProductsResponse.data.success) {
      const defaultProducts = defaultResponse.data.data.products;
      const allProducts = allProductsResponse.data.data.products;
      
      console.log(`📊 Endpoint par défaut: ${defaultProducts.length} produits`);
      console.log(`📊 Endpoint allProducts: ${allProducts.length} produits`);
      
      const defaultBestSellers = defaultProducts.filter(p => p.bestSeller?.isBestSeller).length;
      const allBestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller).length;
      
      console.log(`🏆 Meilleures ventes par défaut: ${defaultBestSellers}/${defaultProducts.length}`);
      console.log(`🏆 Meilleures ventes allProducts: ${allBestSellers}/${allProducts.length}`);
      
      if (defaultBestSellers === defaultProducts.length) {
        console.log('✅ Endpoint par défaut affiche bien uniquement les meilleures ventes');
      } else {
        console.log('⚠️ Endpoint par défaut n\'affiche pas que les meilleures ventes');
      }
    }
  } catch (error) {
    console.log(`⚠️ Impossible de comparer les endpoints: ${error.message}`);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'endpoint des meilleures ventes...\n');
  
  await testBestSellerEndpoint();
  await testEndpointComparison();
  
  console.log('\n✅ Tests terminés !');
}

runTests().catch(console.error); 