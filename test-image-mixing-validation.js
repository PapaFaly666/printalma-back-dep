const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3004';
const TEST_CREDENTIALS = {
  email: 'pf.d@gmail.com',
  password: 'printalmatest123'
};

async function testImageMixingValidation() {
  console.log('🧪 === TEST VALIDATION MÉLANGES D\'IMAGES ===\n');

  try {
    // 1. Authentification
    console.log('🔐 1. Authentification...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.access_token || loginResponse.data.token;
    
    if (!token) {
      throw new Error('Token d\'authentification non reçu');
    }
    console.log('✅ Authentification réussie\n');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test de l'endpoint /api/vendor/products
    console.log('📦 2. Test de l\'endpoint /api/vendor/products...');
    const productsResponse = await axios.get(`${BASE_URL}/api/vendor/products`, { headers });
    const products = productsResponse.data.data?.products || productsResponse.data.products || [];
    
    console.log(`📊 ${products.length} produits récupérés\n`);

    // 3. Validation de la structure colorVariations
    console.log('🎨 3. Validation de la structure colorVariations...');
    let totalIssues = 0;
    let totalValidatedProducts = 0;

    for (const product of products) {
      console.log(`\n🔍 Produit ${product.id}: \"${product.vendorName}\" (${product.baseProduct?.name || 'Type inconnu'})`);
      
      // Vérifier la présence de colorVariations
      if (!product.colorVariations || !Array.isArray(product.colorVariations)) {
        console.log('   ❌ Pas de colorVariations ou structure incorrecte');
        totalIssues++;
        continue;
      }

      console.log(`   📋 ${product.colorVariations.length} couleurs disponibles:`);
      
      // Valider chaque couleur
      for (const color of product.colorVariations) {
        console.log(`     🎨 Couleur \"${color.name}\" (${color.colorCode}): ${color.images?.length || 0} images`);
        
        if (!color.images || !Array.isArray(color.images)) {
          console.log('       ❌ Pas d\'images ou structure incorrecte');
          totalIssues++;
          continue;
        }

        // Vérifier chaque image de la couleur
        for (const image of color.images) {
          const issues = [];
          
          // Vérifier que l'image correspond à la couleur
          if (image.colorName && image.colorName.toLowerCase() !== color.name.toLowerCase()) {
            issues.push(`Nom couleur incorrect: "${image.colorName}" vs "${color.name}"`);
          }
          
          if (image.colorCode && image.colorCode !== color.colorCode) {
            issues.push(`Code couleur incorrect: "${image.colorCode}" vs "${color.colorCode}"`);
          }
          
          if (image.validation?.colorId && image.validation.colorId !== color.id) {
            issues.push(`ID couleur incorrect: ${image.validation.colorId} vs ${color.id}`);
          }

          if (issues.length > 0) {
            console.log(`       ❌ Image ${image.id}: ${issues.join(', ')}`);
            totalIssues++;
          } else {
            console.log(`       ✅ Image ${image.id}: Validation OK`);
          }
        }

        // Afficher les métadonnées de debug si disponibles
        if (color._debug) {
          const debug = color._debug;
          if (debug.filteredOut > 0) {
            console.log(`       ⚠️ ${debug.filteredOut} images filtrées (mélange détecté)`);
            totalIssues += debug.filteredOut;
          }
        }
      }

      // Vérifier les métadonnées de validation globale
      if (product.images?.validation) {
        const validation = product.images.validation;
        console.log(`   📊 Validation globale:`);
        console.log(`     - Type de produit: ${validation.productType}`);
        console.log(`     - Mélange détecté: ${validation.hasImageMixing ? '❌ OUI' : '✅ NON'}`);
        console.log(`     - Images validées: ${validation.allImagesValidated ? '✅ OUI' : '❌ NON'}`);
        console.log(`     - Images filtrées: ${product.images.filteredOutImages || 0}`);
        
        if (validation.hasImageMixing) {
          totalIssues++;
        } else {
          totalValidatedProducts++;
        }
      }
    }

    // 4. Résumé de la validation
    console.log('\n📊 === RÉSUMÉ DE LA VALIDATION ===');
    console.log(`Produits testés: ${products.length}`);
    console.log(`Produits sans mélange: ${totalValidatedProducts}`);
    console.log(`Problèmes détectés: ${totalIssues}`);
    
    if (totalIssues === 0) {
      console.log('✅ AUCUN MÉLANGE D\'IMAGES DÉTECTÉ !');
      console.log('🎉 La structure colorVariations fonctionne correctement.');
    } else {
      console.log('❌ DES MÉLANGES D\'IMAGES ONT ÉTÉ DÉTECTÉS !');
      console.log('⚠️ Il est recommandé de lancer la validation et correction automatique.');
    }

    // 5. Test d'un produit spécifique (si disponible)
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`\n🔬 5. Test détaillé du produit ${firstProduct.id}:`);
      console.log(JSON.stringify({
        id: firstProduct.id,
        vendorName: firstProduct.vendorName,
        baseProduct: firstProduct.baseProduct?.name,
        colorVariations: firstProduct.colorVariations?.map(color => ({
          name: color.name,
          colorCode: color.colorCode,
          imagesCount: color.images?.length || 0,
          imageUrls: color.images?.map(img => img.url) || []
        }))
      }, null, 2));
    }

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Vérifiez les credentials de test ou l\'état du serveur d\'authentification.');
    } else if (error.response?.status === 404) {
      console.log('💡 Vérifiez que le serveur backend est démarré sur le port 3004.');
    }
  }
}

// Fonction utilitaire pour tester la validation des mélanges (si endpoint disponible)
async function testValidationEndpoint() {
  console.log('\n🔧 === TEST ENDPOINT VALIDATION MÉLANGES ===');
  
  try {
    // Cette partie serait à implémenter si un endpoint de validation est exposé
    console.log('💡 Endpoint de validation non encore exposé via API REST.');
    console.log('💡 La validation se fait actuellement au niveau du service backend.');
    
  } catch (error) {
    console.log('⚠️ Endpoint de validation non disponible:', error.message);
  }
}

// Exécution du test
if (require.main === module) {
  testImageMixingValidation()
    .then(() => testValidationEndpoint())
    .catch(console.error);
}

module.exports = { testImageMixingValidation, testValidationEndpoint }; 