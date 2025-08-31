/**
 * Test de comparaison direct des positions entre les 3 endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function compareAPIPositions() {
  console.log('🔍 Test de comparaison des positions entre les APIs');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer un produit depuis /public/vendor-products
    console.log('\n1️⃣ Test /public/vendor-products');
    const vendorProductsResponse = await fetch(`${BASE_URL}/public/vendor-products?limit=1`);
    if (!vendorProductsResponse.ok) throw new Error('Vendor products API failed');
    const vendorProductsData = await vendorProductsResponse.json();
    const vendorProduct = vendorProductsData.data?.products?.[0];

    if (vendorProduct) {
      console.log(`✅ Produit ${vendorProduct.id}: ${vendorProduct.vendorName}`);
      if (vendorProduct.designPositions?.[0]?.position) {
        const pos = vendorProduct.designPositions[0].position;
        console.log(`   📍 Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   📐 Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
    }

    // 2. Récupérer le même produit depuis /public/new-arrivals
    console.log('\n2️⃣ Test /public/new-arrivals');
    const newArrivalsResponse = await fetch(`${BASE_URL}/public/new-arrivals?limit=10`);
    if (!newArrivalsResponse.ok) throw new Error('New arrivals API failed');
    const newArrivalsData = await newArrivalsResponse.json();
    const newArrivals = newArrivalsData.data || [];

    // Chercher le même produit
    const matchingNewArrival = newArrivals.find(p => p.id === vendorProduct?.id);
    
    if (matchingNewArrival) {
      console.log(`✅ Même produit trouvé: ${matchingNewArrival.id}: ${matchingNewArrival.name}`);
      if (matchingNewArrival.designPositions?.[0]?.position) {
        const pos = matchingNewArrival.designPositions[0].position;
        console.log(`   📍 Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   📐 Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
      
      // Comparer les positions
      if (vendorProduct && vendorProduct.designPositions?.[0]?.position && matchingNewArrival.designPositions?.[0]?.position) {
        const vp = vendorProduct.designPositions[0].position;
        const na = matchingNewArrival.designPositions[0].position;
        
        const identical = vp.x === na.x && vp.y === na.y && vp.scale === na.scale 
          && vp.designWidth === na.designWidth && vp.designHeight === na.designHeight;
        
        if (identical) {
          console.log('   ✅ POSITIONS IDENTIQUES entre vendor-products et new-arrivals!');
        } else {
          console.log('   ❌ DIFFÉRENCE DÉTECTÉE:');
          console.log(`      vendor-products: x=${vp.x}, y=${vp.y}, scale=${vp.scale}, size=${vp.designWidth}x${vp.designHeight}`);
          console.log(`      new-arrivals: x=${na.x}, y=${na.y}, scale=${na.scale}, size=${na.designWidth}x${na.designHeight}`);
        }
      }
    } else {
      console.log('⚠️ Même produit non trouvé dans new-arrivals');
    }

    // 3. Tester /public/best-sellers
    console.log('\n3️⃣ Test /public/best-sellers');
    const bestSellersResponse = await fetch(`${BASE_URL}/public/best-sellers?limit=10`);
    if (!bestSellersResponse.ok) throw new Error('Best sellers API failed');
    const bestSellersData = await bestSellersResponse.json();
    const bestSellers = bestSellersData.data?.bestSellers || [];

    // Chercher le même produit
    const matchingBestSeller = bestSellers.find(p => p.id === vendorProduct?.id);
    
    if (matchingBestSeller) {
      console.log(`✅ Même produit trouvé: ${matchingBestSeller.id}: ${matchingBestSeller.vendorName}`);
      if (matchingBestSeller.designPositions?.[0]?.position) {
        const pos = matchingBestSeller.designPositions[0].position;
        console.log(`   📍 Position: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
        console.log(`   📐 Dimensions: ${pos.designWidth}x${pos.designHeight}`);
      }
      
      // Comparer les positions avec vendor-products
      if (vendorProduct && vendorProduct.designPositions?.[0]?.position && matchingBestSeller.designPositions?.[0]?.position) {
        const vp = vendorProduct.designPositions[0].position;
        const bs = matchingBestSeller.designPositions[0].position;
        
        const identical = vp.x === bs.x && vp.y === bs.y && vp.scale === bs.scale 
          && vp.designWidth === bs.designWidth && vp.designHeight === bs.designHeight;
        
        if (identical) {
          console.log('   ✅ POSITIONS IDENTIQUES entre vendor-products et best-sellers!');
        } else {
          console.log('   ❌ DIFFÉRENCE DÉTECTÉE:');
          console.log(`      vendor-products: x=${vp.x}, y=${vp.y}, scale=${vp.scale}, size=${vp.designWidth}x${vp.designHeight}`);
          console.log(`      best-sellers: x=${bs.x}, y=${bs.y}, scale=${bs.scale}, size=${bs.designWidth}x${bs.designHeight}`);
        }
      }
    } else {
      console.log('⚠️ Même produit non trouvé dans best-sellers');
    }

    // 4. Tester les délimitations
    console.log('\n4️⃣ Test des délimitations');
    
    if (vendorProduct?.designDelimitations?.[0]?.delimitations?.[0]) {
      const vDelim = vendorProduct.designDelimitations[0].delimitations[0];
      console.log(`vendor-products délimitation: x=${vDelim.x}%, coordinateType=${vDelim.coordinateType}`);
    }
    
    if (matchingNewArrival?.baseProduct?.colorVariations?.[0]?.images?.[0]?.delimitations?.[0]) {
      const naDelim = matchingNewArrival.baseProduct.colorVariations[0].images[0].delimitations[0];
      console.log(`new-arrivals délimitation: x=${naDelim.x}%, coordinateType=${naDelim.coordinateType}`);
    }

    if (matchingBestSeller?.designDelimitations?.[0]?.delimitations?.[0]) {
      const bsDelim = matchingBestSeller.designDelimitations[0].delimitations[0];
      console.log(`best-sellers délimitation: x=${bsDelim.x}%, coordinateType=${bsDelim.coordinateType}`);
    }

    console.log('\n🎯 RÉSUMÉ');
    console.log('='.repeat(30));
    console.log('Si toutes les APIs montrent "POSITIONS IDENTIQUES", le problème est résolu ✅');
    console.log('Si des différences sont détectées, il faut investiguer plus ❌');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Test spécifique pour un produit donné
async function testSpecificProductPositions(productId) {
  console.log(`\n🔍 Test positions pour produit ${productId}`);
  console.log('='.repeat(40));

  try {
    // Test via détail produit
    const detailResponse = await fetch(`${BASE_URL}/public/vendor-products/${productId}`);
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      const product = detailData.data;
      
      console.log(`✅ Produit ${productId}: ${product.vendorName || product.name}`);
      
      if (product.designPositions?.[0]?.position) {
        const pos = product.designPositions[0].position;
        console.log(`📍 Position détaillée:`);
        console.log(`   x: ${pos.x}`);
        console.log(`   y: ${pos.y}`);
        console.log(`   scale: ${pos.scale}`);
        console.log(`   rotation: ${pos.rotation || 0}`);
        console.log(`   dimensions: ${pos.designWidth}x${pos.designHeight}`);
        console.log(`   coordinateType: ${pos.coordinateType || 'Non défini'}`);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur test produit ${productId}:`, error.message);
  }
}

// Exécution
if (require.main === module) {
  compareAPIPositions().then(() => {
    console.log('\n✅ Comparaison terminée');
  });
}

module.exports = {
  compareAPIPositions,
  testSpecificProductPositions
};