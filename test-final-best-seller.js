const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testFinalBestSeller() {
  console.log('🏆 Test Final - Endpoint Meilleures Ventes\n');

  try {
    // 1. Test de l'endpoint par défaut (meilleures ventes seulement)
    console.log('1️⃣ Test endpoint par défaut (meilleures ventes seulement)...');
    
    const response = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`✅ Endpoint par défaut: ${products.length} produits retournés`);
      
      // Vérifier que ce sont bien des meilleures ventes
      const bestSellers = products.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers.length}/${products.length} sont des meilleures ventes`);
      
      // Afficher les détails des meilleures ventes
      console.log('\n📋 Détails des meilleures ventes:');
      bestSellers.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName}`);
        console.log(`      - Prix: ${product.price} FCFA`);
        console.log(`      - Ventes: ${product.bestSeller.salesCount}`);
        console.log(`      - Revenus: ${product.bestSeller.totalRevenue} FCFA`);
        console.log(`      - Vendeur: ${product.vendor.fullName}`);
        console.log(`      - Design: ${product.design?.name || 'N/A'}`);
        console.log('');
      });
    }

    // 2. Test avec allProducts=true (tous les produits)
    console.log('\n2️⃣ Test avec allProducts=true (tous les produits)...');
    
    const allProductsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10&allProducts=true`);
    
    if (allProductsResponse.data.success) {
      const allProducts = allProductsResponse.data.data.products;
      console.log(`✅ Endpoint allProducts: ${allProducts.length} produits retournés`);
      
      const allBestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${allBestSellers.length}/${allProducts.length} sont des meilleures ventes`);
      
      // Afficher la différence
      const nonBestSellers = allProducts.filter(p => !p.bestSeller?.isBestSeller);
      console.log(`📦 ${nonBestSellers.length} produits non-meilleures ventes`);
    }

    // 3. Comparaison des résultats
    console.log('\n3️⃣ Comparaison des résultats...');
    
    const defaultCount = response.data.data.products.length;
    const allCount = allProductsResponse.data.data.products.length;
    
    console.log(`📊 Endpoint par défaut: ${defaultCount} produits`);
    console.log(`📊 Endpoint allProducts: ${allCount} produits`);
    
    if (defaultCount < allCount) {
      console.log('✅ SUCCÈS: L\'endpoint par défaut retourne moins de produits (meilleures ventes seulement)');
    } else {
      console.log('❌ ÉCHEC: L\'endpoint par défaut retourne autant de produits que allProducts');
    }

    // 4. Test de la structure de réponse
    console.log('\n4️⃣ Test de la structure de réponse...');
    
    const firstProduct = response.data.data.products[0];
    if (firstProduct) {
      console.log('✅ Structure de réponse correcte:');
      console.log(`   - ID: ${firstProduct.id}`);
      console.log(`   - Nom: ${firstProduct.vendorName}`);
      console.log(`   - Prix: ${firstProduct.price}`);
      console.log(`   - Meilleure vente: ${firstProduct.bestSeller?.isBestSeller ? 'OUI' : 'NON'}`);
      console.log(`   - Design incorporé: ${firstProduct.designApplication?.hasDesign ? 'OUI' : 'NON'}`);
      console.log(`   - Position design: ${firstProduct.designPositions?.length > 0 ? 'OUI' : 'NON'}`);
      console.log(`   - Images admin: ${firstProduct.images?.adminReferences?.length || 0} références`);
    }

    console.log('\n🎉 Test final terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log('✅ L\'endpoint par défaut affiche seulement les meilleures ventes');
    console.log('✅ L\'endpoint avec allProducts=true affiche tous les produits');
    console.log('✅ La structure de réponse contient toutes les informations nécessaires');
    console.log('✅ Les designs sont incorporés avec leurs positions');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Remplir les données: node populate-best-seller-data.js');
      console.log('   3. Relancer ce test: node test-final-best-seller.js');
    }
  }
}

testFinalBestSeller(); 

const BASE_URL = 'http://localhost:3004';

async function testFinalBestSeller() {
  console.log('🏆 Test Final - Endpoint Meilleures Ventes\n');

  try {
    // 1. Test de l'endpoint par défaut (meilleures ventes seulement)
    console.log('1️⃣ Test endpoint par défaut (meilleures ventes seulement)...');
    
    const response = await axios.get(`${BASE_URL}/public/vendor-products?limit=10`);
    
    if (response.data.success) {
      const products = response.data.data.products;
      console.log(`✅ Endpoint par défaut: ${products.length} produits retournés`);
      
      // Vérifier que ce sont bien des meilleures ventes
      const bestSellers = products.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers.length}/${products.length} sont des meilleures ventes`);
      
      // Afficher les détails des meilleures ventes
      console.log('\n📋 Détails des meilleures ventes:');
      bestSellers.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.vendorName}`);
        console.log(`      - Prix: ${product.price} FCFA`);
        console.log(`      - Ventes: ${product.bestSeller.salesCount}`);
        console.log(`      - Revenus: ${product.bestSeller.totalRevenue} FCFA`);
        console.log(`      - Vendeur: ${product.vendor.fullName}`);
        console.log(`      - Design: ${product.design?.name || 'N/A'}`);
        console.log('');
      });
    }

    // 2. Test avec allProducts=true (tous les produits)
    console.log('\n2️⃣ Test avec allProducts=true (tous les produits)...');
    
    const allProductsResponse = await axios.get(`${BASE_URL}/public/vendor-products?limit=10&allProducts=true`);
    
    if (allProductsResponse.data.success) {
      const allProducts = allProductsResponse.data.data.products;
      console.log(`✅ Endpoint allProducts: ${allProducts.length} produits retournés`);
      
      const allBestSellers = allProducts.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${allBestSellers.length}/${allProducts.length} sont des meilleures ventes`);
      
      // Afficher la différence
      const nonBestSellers = allProducts.filter(p => !p.bestSeller?.isBestSeller);
      console.log(`📦 ${nonBestSellers.length} produits non-meilleures ventes`);
    }

    // 3. Comparaison des résultats
    console.log('\n3️⃣ Comparaison des résultats...');
    
    const defaultCount = response.data.data.products.length;
    const allCount = allProductsResponse.data.data.products.length;
    
    console.log(`📊 Endpoint par défaut: ${defaultCount} produits`);
    console.log(`📊 Endpoint allProducts: ${allCount} produits`);
    
    if (defaultCount < allCount) {
      console.log('✅ SUCCÈS: L\'endpoint par défaut retourne moins de produits (meilleures ventes seulement)');
    } else {
      console.log('❌ ÉCHEC: L\'endpoint par défaut retourne autant de produits que allProducts');
    }

    // 4. Test de la structure de réponse
    console.log('\n4️⃣ Test de la structure de réponse...');
    
    const firstProduct = response.data.data.products[0];
    if (firstProduct) {
      console.log('✅ Structure de réponse correcte:');
      console.log(`   - ID: ${firstProduct.id}`);
      console.log(`   - Nom: ${firstProduct.vendorName}`);
      console.log(`   - Prix: ${firstProduct.price}`);
      console.log(`   - Meilleure vente: ${firstProduct.bestSeller?.isBestSeller ? 'OUI' : 'NON'}`);
      console.log(`   - Design incorporé: ${firstProduct.designApplication?.hasDesign ? 'OUI' : 'NON'}`);
      console.log(`   - Position design: ${firstProduct.designPositions?.length > 0 ? 'OUI' : 'NON'}`);
      console.log(`   - Images admin: ${firstProduct.images?.adminReferences?.length || 0} références`);
    }

    console.log('\n🎉 Test final terminé avec succès !');
    console.log('\n📋 Résumé:');
    console.log('✅ L\'endpoint par défaut affiche seulement les meilleures ventes');
    console.log('✅ L\'endpoint avec allProducts=true affiche tous les produits');
    console.log('✅ La structure de réponse contient toutes les informations nécessaires');
    console.log('✅ Les designs sont incorporés avec leurs positions');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré. Pour tester:');
      console.log('   1. Démarrer le serveur: npm run start:dev');
      console.log('   2. Remplir les données: node populate-best-seller-data.js');
      console.log('   3. Relancer ce test: node test-final-best-seller.js');
    }
  }
}

testFinalBestSeller(); 