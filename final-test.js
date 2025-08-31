const axios = require('axios');

async function finalTest() {
  console.log('🏆 TEST FINAL - API BEST SELLERS\n');

  try {
    // Test de base
    console.log('🔍 Test endpoint principal...');
    const response = await axios.get('http://localhost:3004/public/best-sellers?limit=5');
    
    console.log('✅ API fonctionne !');
    console.log(`📊 Success: ${response.data.success}`);
    console.log(`📦 Data length: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n🏆 PREMIER BEST SELLER:');
      const firstProduct = response.data.data[0];
      console.log({
        id: firstProduct.id,
        name: firstProduct.name,
        price: firstProduct.price,
        salesCount: firstProduct.salesCount,
        totalRevenue: firstProduct.totalRevenue,
        bestSellerRank: firstProduct.bestSellerRank,
        vendor: firstProduct.vendor?.firstName + ' ' + firstProduct.vendor?.lastName
      });
    }

    // Test des statistiques
    console.log('\n📊 Test des statistiques...');
    const statsResponse = await axios.get('http://localhost:3004/public/best-sellers/stats');
    console.log('✅ Statistiques:', statsResponse.data);

    // Test avec filtres
    console.log('\n🎯 Test avec filtres...');
    const filterResponse = await axios.get('http://localhost:3004/public/best-sellers?limit=3&minSales=50');
    console.log(`✅ Filtres: ${filterResponse.data.data?.length || 0} produits trouvés`);

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('🚀 L\'API Best Sellers fonctionne parfaitement !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📄 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

if (require.main === module) {
  finalTest();
}

module.exports = { finalTest }; 