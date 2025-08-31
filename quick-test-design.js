const fetch = require('node-fetch');

const quickTestDesign = async () => {
  console.log('🧪 === TEST RAPIDE DESIGN (SANS AUTH) ===');
  console.log('Ce test va échouer à l\'auth mais permettra de voir les logs du middleware');
  
  // Design de test minimal
  const testDesign = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==';
  
  const testPayload = {
    baseProductId: 1,
    vendorName: 'Test Design Debug',
    vendorDescription: 'Test pour voir les logs middleware',
    vendorPrice: 25000,
    basePriceAdmin: 15000,
    vendorStock: 10,
    
    // ✅ TEST 1: Design dans finalImagesBase64["design"]
    designUrl: 'blob:http://localhost:5173/test-blob-url',
    designFile: {
      name: 'test-design.png',
      size: 133,
      type: 'image/png'
    },
    finalImagesBase64: {
      'design': testDesign,  // ← Design original (CE QU'ON VEUT TESTER)
      'blanc': testDesign    // ← Mockup
    },
    
    finalImages: {
      colorImages: {
        'blanc': {
          colorInfo: { id: 1, name: 'blanc', colorCode: '#FFFFFF' },
          imageUrl: 'blob:http://localhost:5173/test-blanc',
          imageKey: 'blanc'
        }
      },
      statistics: {
        totalColorImages: 1,
        hasDefaultImage: false,
        availableColors: ['blanc'],
        totalImagesGenerated: 1
      }
    },
    selectedColors: [{ id: 1, name: 'blanc', colorCode: '#FFFFFF' }],
    selectedSizes: [{ id: 1, sizeName: 'M' }],
    previewView: {
      viewType: 'FRONT',
      url: 'https://example.com/preview',
      delimitations: []
    },
    publishedAt: new Date().toISOString()
  };
  
  console.log('📦 Payload envoyé:');
  console.log(`   - designUrl: ${testPayload.designUrl}`);
  console.log(`   - designFile: ${JSON.stringify(testPayload.designFile)}`);
  console.log(`   - finalImagesBase64 keys: ${Object.keys(testPayload.finalImagesBase64)}`);
  console.log(`   - finalImagesBase64["design"] présent: ${!!testPayload.finalImagesBase64.design}`);
  console.log(`   - Taille design: ${testPayload.finalImagesBase64.design.length} caractères`);
  
  try {
    console.log('\n🚀 Envoi de la requête...');
    const response = await fetch('http://localhost:3004/vendor/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'  // Token bidon pour déclencher le middleware
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    console.log(`\n📡 Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ PARFAIT! Status 401 = Middleware exécuté');
      console.log('🔍 Regardez les logs du backend pour voir:');
      console.log('   - 🔍 === MIDDLEWARE DEBUG DESIGN ===');
      console.log('   - 🎨 Design dans body: ...');
      console.log('   - 🖼️ FinalImagesBase64 dans body: ...');
      console.log('');
      console.log('Si vous voyez ces logs, le middleware fonctionne!');
    } else {
      console.log('📋 Réponse:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Vérifiez les logs du backend');
  console.log('2. Cherchez "MIDDLEWARE DEBUG DESIGN"');
  console.log('3. Vérifiez si finalImagesBase64["design"] est détecté');
  console.log('4. Si oui, le problème est ailleurs');
  console.log('5. Si non, le frontend n\'envoie pas le bon format');
};

quickTestDesign(); 