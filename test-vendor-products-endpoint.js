const http = require('http');

// 🧪 Test Endpoint POST /vendor/products
console.log('🧪 === TEST ENDPOINT POST /vendor/products ===');

// ✅ Payload de test avec structure correcte
const testPayload = {
  baseProductId: 1,
  vendorName: 'Test Produit Vendeur',
  vendorDescription: 'Test de l\'endpoint POST /vendor/products',
  vendorPrice: 25000,
  basePriceAdmin: 15000,
  vendorStock: 10,
  
  // Design en base64
  designUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==',
  
  // Métadonnées du design
  designFile: {
    name: 'test_design.png',
    size: 1024,
    type: 'image/png'
  },
  
  // ✅ STRUCTURE CORRIGÉE: Design + Mockups séparés
  finalImagesBase64: {
    'design': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==',
    'blanc': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==',
    'noir': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg=='
  },
  
  // Structure finalImages (métadonnées)
  finalImages: {
    colorImages: {
      'blanc': {
        colorInfo: { id: 1, name: 'blanc', colorCode: '#FFFFFF' },
        imageUrl: 'blob:http://localhost:5173/blanc-mockup',
        imageKey: 'blanc'
      },
      'noir': {
        colorInfo: { id: 2, name: 'noir', colorCode: '#000000' },
        imageUrl: 'blob:http://localhost:5173/noir-mockup',
        imageKey: 'noir'
      }
    },
    statistics: {
      totalColorImages: 2,
      hasDefaultImage: false,
      availableColors: ['blanc', 'noir'],
      totalImagesGenerated: 3
    }
  },
  
  selectedColors: [
    { id: 1, name: 'blanc', colorCode: '#FFFFFF' },
    { id: 2, name: 'noir', colorCode: '#000000' }
  ],
  
  selectedSizes: [
    { id: 1, sizeName: 'S' },
    { id: 2, sizeName: 'M' },
    { id: 3, sizeName: 'L' }
  ],
  
  previewView: {
    viewType: 'FRONT',
    url: 'https://example.com/preview',
    delimitations: []
  },
  
  publishedAt: new Date().toISOString()
};

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🔗 Testing backend: http://localhost:3004');
  
  // Test 1: Connectivité générale
  console.log('\n📋 === TEST 1: CONNECTIVITÉ ===');
  
  try {
    const healthOptions = {
      hostname: 'localhost',
      port: 3004,
      path: '/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const healthResult = await makeRequest(healthOptions);
    
    if (healthResult.status === 200 || healthResult.status === 404) {
      console.log('✅ Backend accessible');
    } else {
      console.log(`⚠️ Backend répond mais status: ${healthResult.status}`);
    }
    
  } catch (error) {
    console.log('❌ Backend inaccessible:', error.message);
    console.log('💡 Vérifiez que le backend est démarré sur localhost:3004');
    return;
  }
  
  // Test 2: Endpoint POST /vendor/products (nouveau)
  console.log('\n📋 === TEST 2: POST /vendor/products ===');
  
  const payloadString = JSON.stringify(testPayload);
  const payloadSize = payloadString.length / 1024 / 1024;
  
  console.log(`📊 Taille payload: ${payloadSize.toFixed(2)}MB`);
  console.log(`📊 Design présent: ${!!testPayload.finalImagesBase64.design ? '✅' : '❌'}`);
  console.log(`📊 Mockups: ${Object.keys(testPayload.finalImagesBase64).filter(k => k !== 'design').join(', ')}`);
  
  try {
    const productsOptions = {
      hostname: 'localhost',
      port: 3004,
      path: '/vendor/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
        'Authorization': 'Bearer test-token' // Token de test
      }
    };
    
    console.log('🚀 Test POST /vendor/products...');
    const productsResult = await makeRequest(productsOptions, payloadString);
    
    console.log(`📊 Status: ${productsResult.status}`);
    console.log(`📊 Response:`, JSON.stringify(productsResult.data, null, 2));
    
    if (productsResult.status === 201) {
      console.log('🎉 SUCCÈS: POST /vendor/products fonctionne !');
      
      if (productsResult.data.success && productsResult.data.productId) {
        console.log(`✅ Produit créé: ID ${productsResult.data.productId}`);
        console.log(`✅ Images processées: ${productsResult.data.imagesProcessed}`);
      }
      
    } else if (productsResult.status === 404) {
      console.log('❌ ERREUR: Endpoint POST /vendor/products introuvable');
      console.log('💡 La route n\'a pas été ajoutée correctement');
      
    } else if (productsResult.status === 401) {
      console.log('🔐 Authentification requise (normal sans token valide)');
      console.log('✅ Route existe mais nécessite authentification');
      
    } else if (productsResult.status === 400) {
      console.log('⚠️ Erreur validation (peut être normal)');
      console.log('✅ Route existe et traite les données');
      
      if (productsResult.data.error) {
        console.log(`📋 Erreur: ${productsResult.data.error}`);
      }
      
    } else {
      console.log(`❓ Status inattendu: ${productsResult.status}`);
    }
    
  } catch (error) {
    console.log('❌ Erreur envoi:', error.message);
  }
  
  // Test 3: Comparaison avec POST /vendor/publish
  console.log('\n📋 === TEST 3: POST /vendor/publish (original) ===');
  
  try {
    const publishOptions = {
      hostname: 'localhost',
      port: 3004,
      path: '/vendor/publish',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
        'Authorization': 'Bearer test-token'
      }
    };
    
    console.log('🚀 Test POST /vendor/publish...');
    const publishResult = await makeRequest(publishOptions, payloadString);
    
    console.log(`📊 Status: ${publishResult.status}`);
    
    if (publishResult.status === 201) {
      console.log('✅ POST /vendor/publish fonctionne aussi');
    } else if (publishResult.status === 401) {
      console.log('🔐 POST /vendor/publish nécessite authentification');
    } else {
      console.log(`📊 POST /vendor/publish status: ${publishResult.status}`);
    }
    
  } catch (error) {
    console.log('❌ Erreur test /vendor/publish:', error.message);
  }
  
  // Instructions finales
  console.log('\n📋 === RÉSUMÉ DES TESTS ===');
  console.log('🎯 Objectif: Vérifier que POST /vendor/products fonctionne');
  console.log('');
  console.log('✅ Résultats attendus:');
  console.log('   - POST /vendor/products: 401 (auth requise) ou 201 (succès)');
  console.log('   - POST /vendor/publish: 401 (auth requise) ou 201 (succès)');
  console.log('   - Les deux doivent avoir le même comportement');
  console.log('');
  console.log('❌ Problème si:');
  console.log('   - POST /vendor/products: 404 (route manquante)');
  console.log('   - Comportement différent entre les deux routes');
  console.log('');
  console.log('💡 Pour tester complètement:');
  console.log('   1. Redémarrez le backend: npm run start:dev');
  console.log('   2. Utilisez un token JWT valide');
  console.log('   3. Vérifiez les logs backend');
}

// Exécution du test
testEndpoints().catch(console.error); 