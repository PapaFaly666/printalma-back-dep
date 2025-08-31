const http = require('http');

// 🧪 Test Endpoint GET /vendor/products/:id
console.log('🧪 === TEST ENDPOINT GET /vendor/products/:id ===');

// Configuration
const HOST = 'localhost';
const PORT = 3004;
const PRODUCT_ID = 1; // À adapter selon vos données

// Test sans authentification
function testWithoutAuth() {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/vendor/products/${PRODUCT_ID}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n🔍 === TEST SANS AUTHENTIFICATION ===');
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('📄 Réponse:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('📄 Réponse brute:', data);
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Test avec token JWT (simulé)
function testWithAuth() {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/vendor/products/${PRODUCT_ID}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n🔐 === TEST AVEC AUTHENTIFICATION ===');
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('📄 Réponse:', JSON.stringify(jsonData, null, 2));
          
          // Analyser la structure de la réponse
          if (jsonData.success && jsonData.data) {
            console.log('\n✅ === ANALYSE DÉTAILS PRODUIT ===');
            console.log(`🏷️  Nom: ${jsonData.data.vendorName}`);
            console.log(`💰 Prix: ${jsonData.data.price / 100} €`);
            console.log(`📦 Stock: ${jsonData.data.vendorStock}`);
            console.log(`🎨 Design URL: ${jsonData.data.designUrl ? 'Présent' : 'Absent'}`);
            console.log(`🖼️  Images: ${jsonData.data.images.total}`);
            console.log(`📏 Tailles: ${jsonData.data.selectedSizes.length}`);
            console.log(`🎨 Couleurs: ${jsonData.data.selectedColors.length}`);
            console.log(`💡 Marge: ${jsonData.data.metadata.profitMargin / 100} € (${jsonData.data.metadata.profitPercentage}%)`);
            console.log(`🏆 Qualité: ${jsonData.data.metadata.designQuality}`);
          }
        } catch (e) {
          console.log('📄 Réponse brute:', data);
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Test avec ID inexistant
function testNotFound() {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: `/vendor/products/99999`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n🔍 === TEST PRODUIT INEXISTANT ===');
        console.log(`📊 Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('📄 Réponse:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log('📄 Réponse brute:', data);
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Exécuter tous les tests
async function runAllTests() {
  console.log(`🎯 Test endpoint: GET /vendor/products/${PRODUCT_ID}`);
  console.log(`🌐 Serveur: http://${HOST}:${PORT}`);
  console.log('\n' + '='.repeat(60));
  
  try {
    // Test 1: Sans authentification
    const status1 = await testWithoutAuth();
    
    // Test 2: Avec authentification
    const status2 = await testWithAuth();
    
    // Test 3: Produit inexistant
    const status3 = await testNotFound();
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    console.log(`🔓 Sans auth: ${status1 === 401 ? '✅ 401 (Attendu)' : '❌ ' + status1}`);
    console.log(`🔐 Avec auth: ${status2 === 200 ? '✅ 200 (Succès)' : status2 === 401 ? '⚠️ 401 (Token invalide)' : '❌ ' + status2}`);
    console.log(`🔍 Inexistant: ${status3 === 404 ? '✅ 404 (Attendu)' : '❌ ' + status3}`);
    
    if (status2 === 200) {
      console.log('\n🎉 SUCCESS: Endpoint détails produit fonctionne parfaitement !');
    } else if (status2 === 401) {
      console.log('\n⚠️  ATTENTION: Endpoint existe mais nécessite un token JWT valide');
    } else {
      console.log('\n❌ PROBLÈME: Endpoint ne fonctionne pas correctement');
    }
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
  }
}

// Lancer les tests
runAllTests(); 