const fetch = require('node-fetch');

const testDesignReception = async (token) => {
  console.log('🧪 === TEST RÉCEPTION DESIGN BACKEND ===');
  
  // Design de test minimal (1x1 pixel transparent)
  const testDesign = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==';
  
  // Test avec différentes structures
  const testCases = [
    {
      name: 'TEST 1: Design dans finalImagesBase64["design"]',
      payload: {
        baseProductId: 1,
        vendorName: 'Test Design Reception 1',
        vendorDescription: 'Test design dans finalImagesBase64',
        vendorPrice: 25000,
        basePriceAdmin: 15000,
        vendorStock: 10,
        designUrl: 'blob:http://localhost:5173/test-blob-url',
        designFile: {
          name: 'test-design.png',
          size: 133,
          type: 'image/png'
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
        finalImagesBase64: {
          'design': testDesign,  // ← Design original
          'blanc': testDesign    // ← Mockup avec design
        },
        selectedColors: [{ id: 1, name: 'blanc', colorCode: '#FFFFFF' }],
        selectedSizes: [{ id: 1, sizeName: 'M' }],
        previewView: {
          viewType: 'FRONT',
          url: 'https://example.com/preview',
          delimitations: []
        },
        publishedAt: new Date().toISOString()
      }
    },
    {
      name: 'TEST 2: Design dans designUrl (base64)',
      payload: {
        baseProductId: 1,
        vendorName: 'Test Design Reception 2',
        vendorDescription: 'Test design dans designUrl',
        vendorPrice: 25000,
        basePriceAdmin: 15000,
        vendorStock: 10,
        designUrl: testDesign,  // ← Design en base64 direct
        designFile: {
          name: 'test-design.png',
          size: 133,
          type: 'image/png'
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
        finalImagesBase64: {
          'blanc': testDesign    // ← Seulement les mockups
        },
        selectedColors: [{ id: 1, name: 'blanc', colorCode: '#FFFFFF' }],
        selectedSizes: [{ id: 1, sizeName: 'M' }],
        previewView: {
          viewType: 'FRONT',
          url: 'https://example.com/preview',
          delimitations: []
        },
        publishedAt: new Date().toISOString()
      }
    },
    {
      name: 'TEST 3: Blob URL (devrait échouer)',
      payload: {
        baseProductId: 1,
        vendorName: 'Test Design Reception 3',
        vendorDescription: 'Test avec blob URL',
        vendorPrice: 25000,
        basePriceAdmin: 15000,
        vendorStock: 10,
        designUrl: 'blob:http://localhost:5173/test-blob-url',  // ← Blob URL
        designFile: {
          name: 'test-design.png',
          size: 133,
          type: 'image/png'
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
        finalImagesBase64: {
          'blanc': testDesign    // ← Seulement les mockups
        },
        selectedColors: [{ id: 1, name: 'blanc', colorCode: '#FFFFFF' }],
        selectedSizes: [{ id: 1, sizeName: 'M' }],
        previewView: {
          viewType: 'FRONT',
          url: 'https://example.com/preview',
          delimitations: []
        },
        publishedAt: new Date().toISOString()
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log('📦 Structure envoyée:');
    console.log(`   - designUrl: ${testCase.payload.designUrl.substring(0, 50)}...`);
    console.log(`   - designFile: ${JSON.stringify(testCase.payload.designFile)}`);
    console.log(`   - finalImagesBase64 keys: ${Object.keys(testCase.payload.finalImagesBase64)}`);
    
    try {
      const response = await fetch('http://localhost:3004/vendor/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`
        },
        credentials: 'include',
        body: JSON.stringify(testCase.payload)
      });
      
      const result = await response.json();
      
      console.log(`📡 Status: ${response.status}`);
      
      if (response.status === 201) {
        console.log('✅ SUCCÈS!');
        console.log(`   - Produit créé: ID ${result.productId}`);
        console.log(`   - Images traitées: ${result.imagesProcessed}`);
        console.log(`   - Message: ${result.message}`);
      } else if (response.status === 400) {
        console.log('❌ ERREUR VALIDATION:');
        console.log(`   - Message: ${result.message}`);
        if (result.errors) {
          result.errors.forEach(error => console.log(`   - ${error}`));
        }
      } else if (response.status === 413) {
        console.log('❌ PAYLOAD TROP VOLUMINEUX');
        console.log('   → Augmenter les limites express.json()');
      } else {
        console.log('❌ ERREUR AUTRE:');
        console.log(`   - ${JSON.stringify(result, null, 2)}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur réseau:', error.message);
    }
    
    console.log('---');
  }
  
  console.log('\n📋 RÉSUMÉ DES TESTS:');
  console.log('1. Si TEST 1 réussit → Le backend récupère le design depuis finalImagesBase64["design"]');
  console.log('2. Si TEST 2 réussit → Le backend récupère le design depuis designUrl (base64)');
  console.log('3. TEST 3 devrait montrer les logs d\'avertissement pour blob URL');
  console.log('');
  console.log('💡 POUR LE FRONTEND:');
  console.log('   - Convertir les blob URLs en base64');
  console.log('   - Placer le design original dans finalImagesBase64["design"]');
  console.log('   - Ou envoyer designUrl en base64 direct');
};

// Usage: node test-backend-design-reception.js <TOKEN>
const token = process.argv[2];
if (token) {
  testDesignReception(token);
} else {
  console.log('Usage: node test-backend-design-reception.js <TOKEN>');
  console.log('');
  console.log('Pour obtenir un token:');
  console.log('1. Se connecter sur http://localhost:3004/api/auth/login');
  console.log('2. Copier le token depuis la réponse ou les cookies');
} 