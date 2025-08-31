const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

function analyzePayloadStructure(payload) {
  console.log('🔍 Analyse de la Structure du Payload\n');
  
  const analysis = {
    hasRequiredFields: {
      baseProductId: payload.hasOwnProperty('baseProductId'),
      finalImages: payload.hasOwnProperty('finalImages'),
      finalImagesBase64: payload.hasOwnProperty('finalImagesBase64'),
      selectedColors: payload.hasOwnProperty('selectedColors'),
      selectedSizes: payload.hasOwnProperty('selectedSizes'),
      vendorPrice: payload.hasOwnProperty('vendorPrice'),
      basePriceAdmin: payload.hasOwnProperty('basePriceAdmin')
    },
    finalImagesStructure: {},
    finalImagesBase64Structure: {},
    issuesFound: []
  };

  // Analyser finalImages
  if (payload.finalImages) {
    analysis.finalImagesStructure = {
      hasColorImages: payload.finalImages.hasOwnProperty('colorImages'),
      hasStatistics: payload.finalImages.hasOwnProperty('statistics'),
      hasDefaultImage: payload.finalImages.hasOwnProperty('defaultImage'),
      colorImagesType: typeof payload.finalImages.colorImages,
      colorImagesKeys: payload.finalImages.colorImages ? Object.keys(payload.finalImages.colorImages) : [],
      statisticsContent: payload.finalImages.statistics || null
    };

    // Vérifier chaque image de couleur
    if (payload.finalImages.colorImages && typeof payload.finalImages.colorImages === 'object') {
      for (const [colorName, imageData] of Object.entries(payload.finalImages.colorImages)) {
        if (!imageData || typeof imageData !== 'object') {
          analysis.issuesFound.push(`Image ${colorName}: données invalides`);
        } else {
          if (!imageData.colorInfo) analysis.issuesFound.push(`Image ${colorName}: colorInfo manquant`);
          if (!imageData.imageKey) analysis.issuesFound.push(`Image ${colorName}: imageKey manquant`);
          if (!imageData.imageUrl) analysis.issuesFound.push(`Image ${colorName}: imageUrl manquant`);
        }
      }
    } else {
      analysis.issuesFound.push('finalImages.colorImages est invalide ou manquant');
    }
  } else {
    analysis.issuesFound.push('finalImages est manquant');
  }

  // Analyser finalImagesBase64
  if (payload.finalImagesBase64) {
    analysis.finalImagesBase64Structure = {
      type: typeof payload.finalImagesBase64,
      keys: Object.keys(payload.finalImagesBase64),
      imageSizes: {}
    };

    for (const [colorName, base64] of Object.entries(payload.finalImagesBase64)) {
      if (typeof base64 === 'string' && base64.startsWith('data:image/')) {
        const sizeBytes = (base64.length * 3) / 4;
        const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
        analysis.finalImagesBase64Structure.imageSizes[colorName] = `${sizeMB}MB`;
      } else {
        analysis.issuesFound.push(`Image base64 ${colorName}: format invalide`);
      }
    }
  } else {
    analysis.issuesFound.push('finalImagesBase64 est manquant');
  }

  // Analyser les arrays
  if (!Array.isArray(payload.selectedColors)) {
    analysis.issuesFound.push('selectedColors n\'est pas un array');
  }
  if (!Array.isArray(payload.selectedSizes)) {
    analysis.issuesFound.push('selectedSizes n\'est pas un array');
  }

  // Afficher l'analyse
  console.log('📋 Champs Requis:');
  for (const [field, present] of Object.entries(analysis.hasRequiredFields)) {
    console.log(`   ${present ? '✅' : '❌'} ${field}: ${present ? 'Présent' : 'Manquant'}`);
  }

  console.log('\n📋 Structure finalImages:');
  for (const [key, value] of Object.entries(analysis.finalImagesStructure)) {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
  }

  console.log('\n📋 Structure finalImagesBase64:');
  for (const [key, value] of Object.entries(analysis.finalImagesBase64Structure)) {
    console.log(`   ${key}: ${JSON.stringify(value)}`);
  }

  if (analysis.issuesFound.length > 0) {
    console.log('\n❌ Problèmes Détectés:');
    analysis.issuesFound.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ Aucun problème structurel détecté');
  }

  return analysis;
}

async function testWithToken(token) {
  console.log('🧪 Test avec Token Utilisateur\n');
  
  // Payload exemple basé sur votre structure frontend
  const testPayload = {
    baseProductId: 286,
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
          imageKey: '286_1'
        },
        'Vert': {
          colorInfo: { id: 2, name: 'Vert', colorCode: '#00ff00' },
          imageUrl: 'blob:http://localhost:5173/image-vert-test',
          imageKey: '286_2'
        }
      },
      statistics: {
        totalColorImages: 2,
        hasDefaultImage: false,
        availableColors: ['Rouge', 'Vert'],
        totalImagesGenerated: 2
      }
    },
    vendorPrice: 15000,
    vendorName: 'Test Product Debug',
    vendorDescription: 'Produit de test pour debug structure',
    vendorStock: 50,
    basePriceAdmin: 12000,
    selectedSizes: [{ id: 1, sizeName: 'S' }],
    selectedColors: [
      { id: 1, name: 'Rouge', colorCode: '#ff0000' },
      { id: 2, name: 'Vert', colorCode: '#00ff00' }
    ],
    previewView: {
      viewType: 'FRONT',
      url: 'https://example.com/preview.jpg',
      delimitations: []
    },
    publishedAt: new Date().toISOString(),
    finalImagesBase64: {
      'Rouge': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg==',
      'Vert': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg=='
    }
  };

  // Analyser la structure
  analyzePayloadStructure(testPayload);

  console.log('\n🚀 Test de publication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/vendor/publish`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${token}`
      },
      timeout: 30000
    });
    
    console.log(`✅ Publication réussie: ${response.status}`);
    console.log(`📦 Produit créé: ${response.data.productId}`);
    console.log(`🖼️ Images traitées: ${response.data.imagesProcessed}`);
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.response?.status || 'Network Error'}`);
    console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 Erreurs détaillées:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err}`);
      });
    }
  }
}

// Fonction principale
async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Veuillez fournir un token JWT:');
    console.log('   node debug-payload-structure.js <VOTRE_TOKEN>');
    console.log('\n💡 Pour obtenir votre token:');
    console.log('   1. Connectez-vous sur votre frontend');
    console.log('   2. DevTools > Application > Cookies');
    console.log('   3. Copiez la valeur du cookie "auth_token"');
    return;
  }
  
  await testWithToken(token);
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzePayloadStructure }; 