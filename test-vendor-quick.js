const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

async function testVendorEndpoint() {
  console.log('🚀 Test Rapide - Endpoint Vendor\n');
  
  // Payload minimal pour test
  const testPayload = {
    baseProductId: 1, // ID d'un produit qui existe probablement
    designUrl: 'blob:http://localhost:5173/test-design-url',
    designFile: {
      name: 'test-design.png',
      size: 245760,
      type: 'image/png'
    },
    finalImages: {
      colorImages: {
        'Rouge': {
          colorInfo: { id: 1, name: 'Rouge', colorCode: '#ff0000' },
          imageUrl: 'blob:http://localhost:5173/image-rouge-test',
          imageKey: '1_1'
        }
      },
      statistics: {
        totalColorImages: 1,
        hasDefaultImage: false,
        availableColors: ['Rouge'],
        totalImagesGenerated: 1
      }
    },
    vendorPrice: 15000,
    vendorName: 'Test Product',
    vendorDescription: 'Produit de test pour vérifier l\'endpoint',
    vendorStock: 50,
    basePriceAdmin: 12000,
    selectedSizes: [{ id: 1, sizeName: 'S' }],
    selectedColors: [{ id: 1, name: 'Rouge', colorCode: '#ff0000' }],
    previewView: {
      viewType: 'FRONT',
      url: 'https://example.com/preview.jpg',
      delimitations: []
    },
    publishedAt: new Date().toISOString(),
    finalImagesBase64: {
      'Rouge': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg=='
    }
  };

  console.log('📋 Test avec cookie auth_token (utilisateur ID 19)');
  console.log('💡 Si vous voulez tester avec votre propre token:');
  console.log('   node test-vendor-quick.js <VOTRE_TOKEN>');
  
  // Token d'exemple (vous devrez le remplacer par le vôtre)
  const sampleToken = process.argv[2];
  
  if (!sampleToken) {
    console.log('\n❌ Veuillez fournir un token JWT:');
    console.log('   1. Connectez-vous sur votre frontend');
    console.log('   2. Ouvrez DevTools > Application > Cookies');
    console.log('   3. Copiez la valeur du cookie "auth_token"');
    console.log('   4. Exécutez: node test-vendor-quick.js <VALEUR_COOKIE>');
    return;
  }
  
  try {
    console.log(`\n🔑 Test avec token: ${sampleToken.substring(0, 50)}...`);
    
    const response = await axios.post(`${BASE_URL}/vendor/publish`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${sampleToken}`
      },
      timeout: 30000 // 30 secondes
    });
    
    console.log(`✅ Publication réussie: ${response.status}`);
    console.log(`📦 Produit créé: ${response.data.productId}`);
    console.log(`🖼️ Images traitées: ${response.data.imagesProcessed}`);
    console.log('\n📊 Détails:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.response?.status || 'Network Error'}`);
    console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 Erreurs détaillées:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err}`);
      });
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Problème d\'authentification:');
      console.log('   - Vérifiez que le token n\'est pas expiré');
      console.log('   - Reconnectez-vous sur le frontend');
      console.log('   - Copiez le nouveau token');
    }
    
    if (error.response?.status === 403) {
      console.log('\n💡 Problème d\'autorisation:');
      console.log('   - Vérifiez que l\'utilisateur a le rôle VENDEUR');
      console.log('   - Vérifiez que le compte est actif');
    }
  }
}

// Exécuter le test
testVendorEndpoint().catch(console.error); 