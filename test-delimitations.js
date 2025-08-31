const axios = require('axios');

async function testDelimitations() {
  try {
    console.log('🔍 Test des délimitations avec vraies dimensions...\n');
    
    const response = await axios.get('http://localhost:3004/public/vendor-products?limit=3');
    
    if (response.data.success) {
      const products = response.data.data.products;
      
      console.log(`📦 ${products.length} produits récupérés\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. Produit ${product.id} - ${product.vendorName}`);
        
        if (product.designDelimitations && product.designDelimitations.length > 0) {
          console.log(`   🎨 ${product.designDelimitations.length} délimitations:`);
          
          product.designDelimitations.forEach((delimitation, delimIndex) => {
            console.log(`      ${delimIndex + 1}. ${delimitation.colorName} (${delimitation.colorCode}):`);
            console.log(`         - Image: ${delimitation.imageUrl}`);
            console.log(`         - Dimensions: ${delimitation.naturalWidth}x${delimitation.naturalHeight}`);
            
            if (delimitation.delimitations && delimitation.delimitations.length > 0) {
              delimitation.delimitations.forEach((zone, zoneIndex) => {
                console.log(`         - Zone ${zoneIndex + 1}: ${zone.name}`);
                console.log(`           Position: (${zone.x}, ${zone.y})`);
                console.log(`           Taille: ${zone.width}x${zone.height}`);
                console.log(`           Description: ${zone.description}`);
              });
            }
          });
        } else {
          console.log(`   ⚠️ Aucune délimitation trouvée`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDelimitations(); 

async function testDelimitations() {
  try {
    console.log('🔍 Test des délimitations avec vraies dimensions...\n');
    
    const response = await axios.get('http://localhost:3004/public/vendor-products?limit=3');
    
    if (response.data.success) {
      const products = response.data.data.products;
      
      console.log(`📦 ${products.length} produits récupérés\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. Produit ${product.id} - ${product.vendorName}`);
        
        if (product.designDelimitations && product.designDelimitations.length > 0) {
          console.log(`   🎨 ${product.designDelimitations.length} délimitations:`);
          
          product.designDelimitations.forEach((delimitation, delimIndex) => {
            console.log(`      ${delimIndex + 1}. ${delimitation.colorName} (${delimitation.colorCode}):`);
            console.log(`         - Image: ${delimitation.imageUrl}`);
            console.log(`         - Dimensions: ${delimitation.naturalWidth}x${delimitation.naturalHeight}`);
            
            if (delimitation.delimitations && delimitation.delimitations.length > 0) {
              delimitation.delimitations.forEach((zone, zoneIndex) => {
                console.log(`         - Zone ${zoneIndex + 1}: ${zone.name}`);
                console.log(`           Position: (${zone.x}, ${zone.y})`);
                console.log(`           Taille: ${zone.width}x${zone.height}`);
                console.log(`           Description: ${zone.description}`);
              });
            }
          });
        } else {
          console.log(`   ⚠️ Aucune délimitation trouvée`);
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDelimitations(); 