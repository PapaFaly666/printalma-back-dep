const axios = require('axios');

// Test des deux ports pour identifier le bon endpoint
async function testBothPorts() {
  console.log('🔍 Test des ports pour identifier le bon endpoint\n');

  const ports = [3004, 5174];
  const endpoints = [
    '/api/products?isReadyProduct=true',
    '/api/products?forVendorDesign=true',
    '/products?isReadyProduct=true',
    '/products?forVendorDesign=true'
  ];

  for (const port of ports) {
    console.log(`\n🧪 Test du port ${port}:`);
    console.log(`📍 URL: http://localhost:${port}`);
    
    for (const endpoint of endpoints) {
      try {
        const url = `http://localhost:${port}${endpoint}`;
        console.log(`\n   🔍 Test: ${url}`);
        
        const response = await axios.get(url, {
          timeout: 5000
        });
        
        console.log(`   ✅ Succès (${response.status}): ${response.data.data?.length || 0} produits`);
        
        if (response.data.data && response.data.data.length > 0) {
          console.log(`   📊 Premier produit:`, {
            id: response.data.data[0].id,
            name: response.data.data[0].name,
            isReadyProduct: response.data.data[0].isReadyProduct,
            hasDelimitations: response.data.data[0].hasDelimitations
          });
        }
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ Connexion refusée`);
        } else if (error.response?.status === 404) {
          console.log(`   ❌ 404 - Endpoint non trouvé`);
        } else if (error.response?.status === 500) {
          console.log(`   ❌ 500 - Erreur serveur`);
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      }
    }
  }
}

// Test spécifique pour les produits prêts
async function testReadyProducts() {
  console.log('\n🎯 Test spécifique pour les produits prêts\n');

  const tests = [
    { port: 3004, endpoint: '/api/products?isReadyProduct=true' },
    { port: 5174, endpoint: '/api/products?isReadyProduct=true' },
    { port: 3004, endpoint: '/products?isReadyProduct=true' },
    { port: 5174, endpoint: '/products?isReadyProduct=true' }
  ];

  for (const test of tests) {
    try {
      const url = `http://localhost:${test.port}${test.endpoint}`;
      console.log(`🧪 Test: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 5000
      });
      
      console.log(`✅ Succès: ${response.data.data?.length || 0} produits prêts`);
      
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((product, index) => {
          console.log(`   Produit ${index + 1}:`, {
            id: product.id,
            name: product.name,
            isReadyProduct: product.isReadyProduct,
            status: product.status
          });
        });
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

// Test de santé des serveurs
async function testServerHealth() {
  console.log('\n🏥 Test de santé des serveurs\n');

  const healthEndpoints = [
    { port: 3004, path: '/health' },
    { port: 3004, path: '/api/health' },
    { port: 5174, path: '/health' },
    { port: 5174, path: '/api/health' },
    { port: 3004, path: '/' },
    { port: 5174, path: '/' }
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const url = `http://localhost:${endpoint.port}${endpoint.path}`;
      console.log(`🧪 Test: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 3000
      });
      
      console.log(`✅ Serveur actif (${response.status})`);
      
    } catch (error) {
      console.log(`❌ Serveur non accessible: ${error.message}`);
    }
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Diagnostic des ports et endpoints\n');
  
  await testServerHealth();
  await testBothPorts();
  await testReadyProducts();
  
  console.log('\n📋 Résumé:');
  console.log('   🔍 Vérifiez quel port utilise votre frontend');
  console.log('   🔍 Vérifiez quel port utilise votre backend');
  console.log('   🔍 Assurez-vous que les URLs correspondent');
  console.log('');
  console.log('💡 Solutions possibles:');
  console.log('   1. Changer le port du frontend vers 5174');
  console.log('   2. Changer le port du backend vers 3004');
  console.log('   3. Configurer un proxy pour rediriger les requêtes');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBothPorts,
  testReadyProducts,
  testServerHealth,
  runAllTests
}; 