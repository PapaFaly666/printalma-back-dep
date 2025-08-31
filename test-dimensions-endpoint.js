const axios = require('axios');

async function testDimensions() {
  try {
    console.log('🔍 Test des dimensions de design...\n');
    
    // Test de l'endpoint public/best-sellers
    const response = await axios.get('http://localhost:3004/public/best-sellers?limit=1');
    
    console.log('📊 Réponse complète:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.bestSellers && response.data.data.bestSellers.length > 0) {
      const product = response.data.data.bestSellers[0];
      console.log('✅ Produit trouvé:', product.vendorName);
      
      if (product.designPositions && product.designPositions.length > 0) {
        const position = product.designPositions[0].position;
        console.log('📏 Dimensions du design:');
        console.log(`   - designWidth: ${position.designWidth}`);
        console.log(`   - designHeight: ${position.designHeight}`);
        
        if (position.designWidth === 500 && position.designHeight === 500) {
          console.log('❌ PROBLÈME: Dimensions encore à 500x500 (valeurs par défaut)');
          
          // Afficher les données brutes pour debug
          console.log('\n🔍 Données brutes du produit:');
          console.log('   - designCloudinaryUrl:', product.designCloudinaryUrl);
          console.log('   - designWidth (brut):', product.designWidth);
          console.log('   - designHeight (brut):', product.designHeight);
          console.log('   - designPositions:', JSON.stringify(product.designPositions, null, 2));
        } else {
          console.log('✅ SUCCÈS: Vraies dimensions récupérées');
        }
      } else {
        console.log('⚠️ Aucune position de design trouvée');
      }
      
      // Afficher aussi les autres informations
      console.log('\n📊 Informations complètes:');
      console.log(`   - ID: ${product.id}`);
      console.log(`   - Nom: ${product.vendorName}`);
      console.log(`   - Prix: ${product.price}`);
      console.log(`   - Ventes: ${product.bestSeller?.salesCount || 0}`);
      console.log(`   - Rang: ${product.bestSellerRank || 'N/A'}`);
      
    } else {
      console.log('❌ Erreur:', response.data.message || 'Aucun produit trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('📊 Réponse d\'erreur:', error.response.data);
    }
  }
}

testDimensions(); 