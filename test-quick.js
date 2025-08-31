const axios = require('axios');

async function testQuick() {
  try {
    console.log('🧪 Test rapide...');
    
    // Test endpoint par défaut
    const response1 = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    const products1 = response1.data.data.products;
    console.log(`📊 Endpoint par défaut: ${products1.length} produits`);
    
    // Test endpoint allProducts
    const response2 = await axios.get('http://localhost:3004/public/vendor-products?limit=5&allProducts=true');
    const products2 = response2.data.data.products;
    console.log(`📊 Endpoint allProducts: ${products2.length} produits`);
    
    if (products1.length < products2.length) {
      console.log('✅ SUCCÈS: L\'endpoint par défaut retourne moins de produits');
    } else {
      console.log('❌ ÉCHEC: L\'endpoint par défaut retourne autant de produits');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testQuick(); 

async function testQuick() {
  try {
    console.log('🧪 Test rapide...');
    
    // Test endpoint par défaut
    const response1 = await axios.get('http://localhost:3004/public/vendor-products?limit=5');
    const products1 = response1.data.data.products;
    console.log(`📊 Endpoint par défaut: ${products1.length} produits`);
    
    // Test endpoint allProducts
    const response2 = await axios.get('http://localhost:3004/public/vendor-products?limit=5&allProducts=true');
    const products2 = response2.data.data.products;
    console.log(`📊 Endpoint allProducts: ${products2.length} produits`);
    
    if (products1.length < products2.length) {
      console.log('✅ SUCCÈS: L\'endpoint par défaut retourne moins de produits');
    } else {
      console.log('❌ ÉCHEC: L\'endpoint par défaut retourne autant de produits');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testQuick(); 