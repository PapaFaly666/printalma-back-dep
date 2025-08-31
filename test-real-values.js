const axios = require('axios');

async function testRealValues() {
  try {
    console.log('🔍 Test des vraies valeurs dans l\'API...\n');
    
    const response = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    
    if (response.data.success) {
      const products = response.data.data.products;
      
      console.log(`📦 ${products.length} produits récupérés\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. Produit ${product.id} - ${product.vendorName}`);
        
        if (product.designPositions && product.designPositions.length > 0) {
          product.designPositions.forEach((position, posIndex) => {
            console.log(`   📍 Position ${posIndex + 1}:`);
            console.log(`      - designWidth: ${position.position.designWidth}`);
            console.log(`      - designHeight: ${position.position.designHeight}`);
            console.log(`      - x: ${position.position.x}`);
            console.log(`      - y: ${position.position.y}`);
            console.log(`      - scale: ${position.position.scale}`);
            console.log(`      - rotation: ${position.position.rotation}`);
          });
        } else {
          console.log(`   ⚠️ Aucune position trouvée`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testRealValues(); 

async function testRealValues() {
  try {
    console.log('🔍 Test des vraies valeurs dans l\'API...\n');
    
    const response = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    
    if (response.data.success) {
      const products = response.data.data.products;
      
      console.log(`📦 ${products.length} produits récupérés\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. Produit ${product.id} - ${product.vendorName}`);
        
        if (product.designPositions && product.designPositions.length > 0) {
          product.designPositions.forEach((position, posIndex) => {
            console.log(`   📍 Position ${posIndex + 1}:`);
            console.log(`      - designWidth: ${position.position.designWidth}`);
            console.log(`      - designHeight: ${position.position.designHeight}`);
            console.log(`      - x: ${position.position.x}`);
            console.log(`      - y: ${position.position.y}`);
            console.log(`      - scale: ${position.position.scale}`);
            console.log(`      - rotation: ${position.position.rotation}`);
          });
        } else {
          console.log(`   ⚠️ Aucune position trouvée`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testRealValues(); 