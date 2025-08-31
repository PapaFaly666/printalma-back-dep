/**
 * ✅ TEST: Endpoint GET /vendor/products enrichi avec transformations et positionnements
 * 
 * Ce script teste le nouvel endpoint qui inclut:
 * - Informations complètes sur le design
 * - Transformations appliquées au design
 * - Positionnements du design sur le produit
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/vendor`;

async function testEnrichedVendorProducts() {
  console.log('🧪 TEST: Endpoint GET /vendor/products enrichi');
  console.log('=' .repeat(50));

  try {
    // 1. Récupérer les produits vendeur avec toutes les informations
    console.log('\n📋 1. Récupération des produits vendeur enrichis...');
    
    const response = await axios.get(`${API_URL}/products`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5
      }
    });

    console.log('✅ Réponse reçue:', response.status);
    console.log('📊 Structure de la réponse:');
    console.log(JSON.stringify({
      success: response.data.success,
      productCount: response.data.data?.products?.length || 0,
      architecture: response.data.architecture,
      pagination: response.data.data?.pagination
    }, null, 2));

    // 2. Analyser les données enrichies
    if (response.data.data?.products?.length > 0) {
      const firstProduct = response.data.data.products[0];
      
      console.log('\n🔍 2. Analyse du premier produit:');
      console.log('   - ID:', firstProduct.id);
      console.log('   - Nom:', firstProduct.vendorName);
      console.log('   - Status:', firstProduct.status);
      
      // Vérifier les informations du design
      console.log('\n🎨 3. Informations du design:');
      if (firstProduct.design) {
        console.log('   - Design ID:', firstProduct.design.id);
        console.log('   - Nom du design:', firstProduct.design.name);
        console.log('   - Catégorie:', firstProduct.design.category);
        console.log('   - Validé:', firstProduct.design.isValidated);
        console.log('   - URL:', firstProduct.design.imageUrl);
        console.log('   - Tags:', firstProduct.design.tags);
      } else {
        console.log('   ❌ Aucune information de design trouvée');
      }
      
      // Vérifier les transformations
      console.log('\n🔄 4. Transformations du design:');
      if (firstProduct.designTransforms && firstProduct.designTransforms.length > 0) {
        console.log(`   - Nombre de transformations: ${firstProduct.designTransforms.length}`);
        firstProduct.designTransforms.forEach((transform, index) => {
          console.log(`   - Transformation ${index + 1}:`);
          console.log(`     • ID: ${transform.id}`);
          console.log(`     • URL: ${transform.designUrl}`);
          console.log(`     • Modifié: ${transform.lastModified}`);
          console.log(`     • Transformations:`, JSON.stringify(transform.transforms, null, 6));
        });
      } else {
        console.log('   ℹ️ Aucune transformation trouvée');
      }
      
      // Vérifier les positionnements
      console.log('\n📍 5. Positionnements du design:');
      if (firstProduct.designPositions && firstProduct.designPositions.length > 0) {
        console.log(`   - Nombre de positions: ${firstProduct.designPositions.length}`);
        firstProduct.designPositions.forEach((position, index) => {
          console.log(`   - Position ${index + 1}:`);
          console.log(`     • Design ID: ${position.designId}`);
          console.log(`     • Créé: ${position.createdAt}`);
          console.log(`     • Modifié: ${position.updatedAt}`);
          console.log(`     • Position:`, JSON.stringify(position.position, null, 6));
        });
      } else {
        console.log('   ℹ️ Aucune position trouvée');
      }
      
      // Application design (existant)
      console.log('\n🖼️ 6. Application design (existant):');
      if (firstProduct.designApplication) {
        console.log('   - A un design:', firstProduct.designApplication.hasDesign);
        console.log('   - URL:', firstProduct.designApplication.designUrl);
        console.log('   - Positionnement:', firstProduct.designApplication.positioning);
        console.log('   - Échelle:', firstProduct.designApplication.scale);
        console.log('   - Mode:', firstProduct.designApplication.mode);
      }
      
      // Structure admin préservée
      console.log('\n🏗️ 7. Structure admin préservée:');
      if (firstProduct.adminProduct) {
        console.log('   - ID produit admin:', firstProduct.adminProduct.id);
        console.log('   - Nom admin:', firstProduct.adminProduct.name);
        console.log('   - Prix admin:', firstProduct.adminProduct.price);
        console.log('   - Variations couleur:', firstProduct.adminProduct.colorVariations?.length || 0);
        
        if (firstProduct.adminProduct.colorVariations && firstProduct.adminProduct.colorVariations.length > 0) {
          const firstColor = firstProduct.adminProduct.colorVariations[0];
          console.log('   - Première couleur:', firstColor.name);
          console.log('   - Images de la couleur:', firstColor.images?.length || 0);
          if (firstColor.images && firstColor.images.length > 0) {
            const firstImage = firstColor.images[0];
            console.log('   - Délimitations:', firstImage.delimitations?.length || 0);
          }
        }
      }
      
    } else {
      console.log('\n❌ Aucun produit trouvé');
    }
    
    console.log('\n✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testEnrichedVendorProducts();
}

module.exports = { testEnrichedVendorProducts }; 