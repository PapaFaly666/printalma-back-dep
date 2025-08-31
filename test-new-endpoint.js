const axios = require('axios');

async function testNewEndpoint() {
  console.log('🔍 Test du nouvel endpoint best-sellers-v2...\n');

  try {
    const response = await axios.get('http://localhost:3004/public/best-sellers-v2');
    
    console.log('📊 Structure de réponse:');
    console.log('Success:', response.data.success);
    console.log('Data length:', response.data.data?.length || 0);
    
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      const firstProduct = response.data.data[0];
      
      console.log('\n📦 Premier produit:', firstProduct.name);
      console.log('🎨 Design URL:', firstProduct.designCloudinaryUrl);
      console.log('📏 Design Width:', firstProduct.designWidth);
      console.log('📏 Design Height:', firstProduct.designHeight);
      console.log('📏 Design Scale:', firstProduct.designScale);
      console.log('📏 Design Positioning:', firstProduct.designPositioning);
      
      // Vérifier si ce sont les vraies dimensions ou les valeurs par défaut
      if (firstProduct.designWidth === 500 && firstProduct.designHeight === 500) {
        console.log('⚠️  Dimensions par défaut (500x500) - peut-être pas les vraies dimensions');
      } else {
        console.log('✅ Dimensions réalistes détectées !');
      }
      
      // Afficher les informations du vendeur
      if (firstProduct.vendor) {
        console.log('\n👤 Vendeur:', firstProduct.vendor.firstName, firstProduct.vendor.lastName);
      }
      
      // Afficher les statistiques
      if (firstProduct.salesCount) {
        console.log('\n📊 Statistiques:');
        console.log(`   - Ventes: ${firstProduct.salesCount}`);
        console.log(`   - CA: ${firstProduct.totalRevenue}€`);
        console.log(`   - Rang: ${firstProduct.bestSellerRank}`);
        console.log(`   - Vues: ${firstProduct.viewsCount}`);
      }
      
    } else {
      console.log('❌ Aucun produit trouvé dans le nouvel endpoint');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.log('📄 Status:', error.response.status);
      console.log('📄 Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

if (require.main === module) {
  testNewEndpoint();
}

module.exports = { testNewEndpoint }; 