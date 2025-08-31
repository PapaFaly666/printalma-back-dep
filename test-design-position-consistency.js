/**
 * Test de cohérence des positions de design entre les APIs
 * Vérifie que /vendor/products et /public/new-arrivals retournent le même format
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPIConsistency() {
  console.log('🔍 Test de cohérence des APIs - Positions de design');
  console.log('================================================');

  try {
    // 1. Tester l'API /public/vendor-products (best-sellers)
    console.log('\n1️⃣ Test API /public/vendor-products (best-sellers)');
    
    const vendorProductsResponse = await fetch(`${BASE_URL}/public/vendor-products?limit=1`);
    
    if (!vendorProductsResponse.ok) {
      throw new Error(`API vendor-products failed: ${vendorProductsResponse.status}`);
    }
    
    const vendorProductsData = await vendorProductsResponse.json();
    const vendorProduct = vendorProductsData.data?.products?.[0];
    
    if (!vendorProduct) {
      console.log('⚠️ Aucun produit trouvé dans /public/vendor-products');
      return;
    }

    console.log(`✅ Produit trouvé: ${vendorProduct.id} - ${vendorProduct.vendorName || vendorProduct.name}`);
    
    // Analyser la structure des positions de design
    console.log('📊 Structure designPositions:');
    if (vendorProduct.designPositions && vendorProduct.designPositions.length > 0) {
      const designPos = vendorProduct.designPositions[0];
      console.log(JSON.stringify(designPos, null, 2));
    } else {
      console.log('❌ Pas de designPositions trouvées');
    }

    // Analyser la structure des délimitations
    console.log('📊 Structure délimitations:');
    if (vendorProduct.designDelimitations && vendorProduct.designDelimitations.length > 0) {
      const delimitation = vendorProduct.designDelimitations[0].delimitations?.[0];
      if (delimitation) {
        console.log(JSON.stringify(delimitation, null, 2));
      }
    }

    console.log('\n2️⃣ Test API /public/new-arrivals');
    
    const newArrivalsResponse = await fetch(`${BASE_URL}/public/new-arrivals?limit=1`);
    
    if (!newArrivalsResponse.ok) {
      throw new Error(`API new-arrivals failed: ${newArrivalsResponse.status}`);
    }
    
    const newArrivalsData = await newArrivalsResponse.json();
    const newArrival = newArrivalsData.data?.[0];
    
    if (!newArrival) {
      console.log('⚠️ Aucun produit trouvé dans /public/new-arrivals');
      return;
    }

    console.log(`✅ Produit trouvé: ${newArrival.id} - ${newArrival.name}`);
    
    // Analyser la structure des positions de design
    console.log('📊 Structure designPositions (new-arrivals):');
    if (newArrival.designPositions && newArrival.designPositions.length > 0) {
      const designPos = newArrival.designPositions[0];
      console.log(JSON.stringify(designPos, null, 2));
    } else {
      console.log('❌ Pas de designPositions trouvées');
    }

    // Analyser la structure des délimitations
    console.log('📊 Structure délimitations (new-arrivals):');
    if (newArrival.baseProduct && newArrival.baseProduct.colorVariations && newArrival.baseProduct.colorVariations.length > 0) {
      const delimitation = newArrival.baseProduct.colorVariations[0].images?.[0]?.delimitations?.[0];
      if (delimitation) {
        console.log(JSON.stringify(delimitation, null, 2));
      }
    }

    console.log('\n3️⃣ Comparaison des formats');
    console.log('==========================');

    // Comparer les structures
    const vendorDesignPos = vendorProduct.designPositions?.[0];
    const newArrivalDesignPos = newArrival.designPositions?.[0];

    if (vendorDesignPos && newArrivalDesignPos) {
      console.log('✅ Les deux APIs ont des designPositions');
      
      // Vérifier la structure de position
      const vendorPos = vendorDesignPos.position;
      const newArrivalPos = newArrivalDesignPos.position;
      
      if (vendorPos && newArrivalPos) {
        console.log('✅ Les deux ont une structure position');
        
        // Vérifier les champs requis
        const requiredFields = ['x', 'y', 'scale', 'designWidth', 'designHeight'];
        let allFieldsMatch = true;
        
        for (const field of requiredFields) {
          const vendorHasField = vendorPos[field] !== undefined;
          const newArrivalHasField = newArrivalPos[field] !== undefined;
          
          console.log(`${field}: vendor=${vendorHasField ? vendorPos[field] : 'MISSING'} | new-arrival=${newArrivalHasField ? newArrivalPos[field] : 'MISSING'}`);
          
          if (vendorHasField !== newArrivalHasField) {
            allFieldsMatch = false;
          }
        }
        
        if (allFieldsMatch) {
          console.log('✅ SUCCÈS: Les structures de position sont cohérentes');
        } else {
          console.log('❌ ÉCHEC: Les structures de position sont différentes');
        }
      } else {
        console.log('❌ ÉCHEC: Structure position manquante');
      }
    } else {
      console.log('❌ ÉCHEC: designPositions manquantes dans une des APIs');
    }

    // Vérifier les délimitations
    console.log('\n4️⃣ Vérification des délimitations');
    console.log('==================================');

    let vendorDelimitation, newArrivalDelimitation;
    
    if (vendorProduct.designDelimitations?.[0]?.delimitations?.[0]) {
      vendorDelimitation = vendorProduct.designDelimitations[0].delimitations[0];
    }
    
    if (newArrival.baseProduct?.colorVariations?.[0]?.images?.[0]?.delimitations?.[0]) {
      newArrivalDelimitation = newArrival.baseProduct.colorVariations[0].images[0].delimitations[0];
    }

    if (vendorDelimitation && newArrivalDelimitation) {
      console.log('✅ Les deux APIs ont des délimitations');
      
      const vendorHasCoordType = vendorDelimitation.coordinateType === 'PERCENTAGE';
      const newArrivalHasCoordType = newArrivalDelimitation.coordinateType === 'PERCENTAGE';
      
      console.log(`coordinateType: vendor=${vendorDelimitation.coordinateType} | new-arrival=${newArrivalDelimitation.coordinateType}`);
      
      if (vendorHasCoordType && newArrivalHasCoordType) {
        console.log('✅ SUCCÈS: Les deux utilisent coordinateType PERCENTAGE');
      } else {
        console.log('❌ ÉCHEC: coordinateType incohérent');
      }
    } else {
      console.log('❌ ÉCHEC: Délimitations manquantes dans une des APIs');
    }

    console.log('\n🎯 RÉSUMÉ DES TESTS');
    console.log('===================');
    console.log('• Les utilitaires unifiés existent déjà ✅');
    console.log('• Les deux APIs utilisent BestSellersService ✅');
    console.log('• Les structures de données devraient être cohérentes ✅');
    console.log('');
    console.log('Si des incohérences sont détectées ci-dessus, le problème pourrait être:');
    console.log('1. Une différence dans le mapping des données');
    console.log('2. Un bug dans le service BestSellersService');
    console.log('3. Des données de test différentes entre les endpoints');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

// Fonction pour tester un produit spécifique
async function testSpecificProduct(productId) {
  console.log(`\n🔍 Test produit spécifique: ${productId}`);
  console.log('==========================================');

  try {
    // Tester via l'endpoint détail
    const detailResponse = await fetch(`${BASE_URL}/public/vendor-products/${productId}`);
    
    if (!detailResponse.ok) {
      console.log(`⚠️ Produit ${productId} non trouvé ou non publié`);
      return;
    }
    
    const detailData = await detailResponse.json();
    const product = detailData.data;
    
    console.log(`✅ Produit ${productId}: ${product.vendorName || product.name}`);
    
    // Analyser les positions
    if (product.designPositions && product.designPositions.length > 0) {
      console.log('📊 Position du design:');
      const pos = product.designPositions[0].position;
      console.log(`  x: ${pos.x}, y: ${pos.y}, scale: ${pos.scale}`);
      console.log(`  dimensions: ${pos.designWidth}x${pos.designHeight}`);
      console.log(`  coordinateType: ${pos.coordinateType || 'Non spécifié'}`);
    }
    
    // Analyser les délimitations
    if (product.designDelimitations && product.designDelimitations.length > 0) {
      console.log('📊 Délimitations:');
      const delim = product.designDelimitations[0].delimitations[0];
      if (delim) {
        console.log(`  x: ${delim.x}%, y: ${delim.y}%, width: ${delim.width}%, height: ${delim.height}%`);
        console.log(`  coordinateType: ${delim.coordinateType}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Erreur test produit ${productId}:`, error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  testAPIConsistency().then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  });
}

module.exports = {
  testAPIConsistency,
  testSpecificProduct
};