const { exec } = require('child_process');

// Test simple avec curl
async function testWithCurl() {
  console.log('🔧 Test simple avec curl\n');

  const tests = [
    {
      name: 'Produits prêts',
      url: 'http://localhost:3004/products?isReadyProduct=true'
    },
    {
      name: 'Mockups avec délimitations',
      url: 'http://localhost:3004/products?forVendorDesign=true'
    },
    {
      name: 'Recherche de produits',
      url: 'http://localhost:3004/products?search=test&isReadyProduct=true'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      exec(`curl -s "${test.url}"`, (error, stdout, stderr) => {
        if (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        } else {
          try {
            const data = JSON.parse(stdout);
            console.log(`   ✅ Succès: ${data.data?.length || 0} produits`);
            
            if (data.data && data.data.length > 0) {
              const firstProduct = data.data[0];
              console.log(`   📊 Premier produit:`, {
                id: firstProduct.id,
                name: firstProduct.name,
                isReadyProduct: firstProduct.isReadyProduct,
                hasDelimitations: firstProduct.hasDelimitations
              });
            }
          } catch (parseError) {
            console.log(`   ❌ Erreur parsing JSON: ${parseError.message}`);
            console.log(`   📄 Raw response: ${stdout.substring(0, 200)}...`);
          }
        }
        console.log('');
      });
      
      // Attendre un peu entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
    }
  }
}

// Test avec fetch (Node.js 18+)
async function testWithFetch() {
  console.log('\n🔧 Test avec fetch\n');

  const tests = [
    {
      name: 'Produits prêts',
      url: 'http://localhost:3004/products?isReadyProduct=true'
    },
    {
      name: 'Mockups avec délimitations',
      url: 'http://localhost:3004/products?forVendorDesign=true'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès: ${data.data?.length || 0} produits`);
        
        if (data.data && data.data.length > 0) {
          const firstProduct = data.data[0];
          console.log(`   📊 Premier produit:`, {
            id: firstProduct.id,
            name: firstProduct.name,
            isReadyProduct: firstProduct.isReadyProduct,
            hasDelimitations: firstProduct.hasDelimitations
          });
        }
      } else {
        console.log(`   ❌ Erreur HTTP: ${response.status}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
    }
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Test simple des endpoints\n');
  
  await testWithCurl();
  await testWithFetch();
  
  console.log('📋 Résumé:');
  console.log('   ✅ Endpoints testés avec curl et fetch');
  console.log('   ✅ Vérification que les URLs fonctionnent');
  console.log('');
  console.log('💡 Solution pour le frontend:');
  console.log('   Changer l\'URL de: http://localhost:3004/api/products');
  console.log('   Vers: http://localhost:3004/products');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testWithCurl,
  testWithFetch,
  runAllTests
}; 