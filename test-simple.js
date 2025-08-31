const axios = require('axios');

async function testSimple() {
  try {
    console.log('🧪 Test simple de l\'endpoint...\n');
    
    // Test 1: Endpoint par défaut (meilleures ventes)
    console.log('1️⃣ Test endpoint par défaut (meilleures ventes)...');
    const response1 = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    
    if (response1.data.success) {
      const products1 = response1.data.data.products;
      console.log(`📊 ${products1.length} produits retournés`);
      
      const bestSellers1 = products1.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers1.length} meilleures ventes`);
      
      products1.forEach((product, index) => {
        console.log(`${index + 1}. ${product.vendorName} - ${product.bestSeller?.isBestSeller ? '🏆' : '❌'}`);
      });
    }
    
    console.log('\n2️⃣ Test avec allProducts=true...');
    const response2 = await axios.get('http://localhost:3004/public/vendor-products?limit=5&allProducts=true');
    
    if (response2.data.success) {
      const products2 = response2.data.data.products;
      console.log(`📊 ${products2.length} produits retournés`);
      
      const bestSellers2 = products2.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers2.length} meilleures ventes`);
      
      products2.forEach((product, index) => {
        console.log(`${index + 1}. ${product.vendorName} - ${product.bestSeller?.isBestSeller ? '🏆' : '❌'}`);
      });
    }
    
    console.log('\n✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimple(); 

async function testSimple() {
  try {
    console.log('🧪 Test simple de l\'endpoint...\n');
    
    // Test 1: Endpoint par défaut (meilleures ventes)
    console.log('1️⃣ Test endpoint par défaut (meilleures ventes)...');
    const response1 = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    
    if (response1.data.success) {
      const products1 = response1.data.data.products;
      console.log(`📊 ${products1.length} produits retournés`);
      
      const bestSellers1 = products1.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers1.length} meilleures ventes`);
      
      products1.forEach((product, index) => {
        console.log(`${index + 1}. ${product.vendorName} - ${product.bestSeller?.isBestSeller ? '🏆' : '❌'}`);
      });
    }
    
    console.log('\n2️⃣ Test avec allProducts=true...');
    const response2 = await axios.get('http://localhost:3004/public/vendor-products?limit=5&allProducts=true');
    
    if (response2.data.success) {
      const products2 = response2.data.data.products;
      console.log(`📊 ${products2.length} produits retournés`);
      
      const bestSellers2 = products2.filter(p => p.bestSeller?.isBestSeller);
      console.log(`🏆 ${bestSellers2.length} meilleures ventes`);
      
      products2.forEach((product, index) => {
        console.log(`${index + 1}. ${product.vendorName} - ${product.bestSeller?.isBestSeller ? '🏆' : '❌'}`);
      });
    }
    
    console.log('\n✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimple(); 