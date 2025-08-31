const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

// Test structure ACTUELLE (qui échoue)
const testCurrentStructure = {
  baseProductId: 287,
  designUrl: 'blob:http://localhost:5174/test-design-url',
  finalImages: {
    colorImages: {
      'Blanc': {
        colorInfo: { id: 340, name: 'Blanc', colorCode: '#e0e0dc' },
        imageUrl: 'blob:http://localhost:5174/test-blanc',
        imageKey: '287_340'
      },
      'Blue': {
        colorInfo: { id: 341, name: 'Blue', colorCode: '#245d96' },
        imageUrl: 'blob:http://localhost:5174/test-blue',
        imageKey: '287_341'
      }
    },
    statistics: {
      totalColorImages: 2,
      hasDefaultImage: false,
      availableColors: ['Blanc', 'Blue'],
      totalImagesGenerated: 2
    }
  },
  vendorPrice: 15000,
  vendorName: 'Test Product Structure',
  vendorDescription: 'Test structure données',
  vendorStock: 50,
  basePriceAdmin: 12000,
  selectedSizes: [{ id: 1, sizeName: 'S' }],
  selectedColors: [
    { id: 340, name: 'Blanc', colorCode: '#e0e0dc' },
    { id: 341, name: 'Blue', colorCode: '#245d96' }
  ],
  publishedAt: new Date().toISOString(),
  // ❌ PROBLÈME: clés basées sur imageKey au lieu de nom couleur
  finalImagesBase64: {
    '287_340': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg==',
    '287_341': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg=='
  }
};

// Test structure CORRIGÉE (qui devrait fonctionner)
const testCorrectedStructure = {
  baseProductId: 287,
  designUrl: 'blob:http://localhost:5174/test-design-url',
  finalImages: {
    colorImages: {
      'Blanc': {
        colorInfo: { id: 340, name: 'Blanc', colorCode: '#e0e0dc' },
        imageUrl: 'blob:http://localhost:5174/test-blanc',
        imageKey: '287_340'
      },
      'Blue': {
        colorInfo: { id: 341, name: 'Blue', colorCode: '#245d96' },
        imageUrl: 'blob:http://localhost:5174/test-blue',
        imageKey: '287_341'
      }
    },
    statistics: {
      totalColorImages: 2,
      hasDefaultImage: false,
      availableColors: ['Blanc', 'Blue'],
      totalImagesGenerated: 2
    }
  },
  vendorPrice: 15000,
  vendorName: 'Test Product Structure Fixed',
  vendorDescription: 'Test structure données corrigée',
  vendorStock: 50,
  basePriceAdmin: 12000,
  selectedSizes: [{ id: 1, sizeName: 'S' }],
  selectedColors: [
    { id: 340, name: 'Blanc', colorCode: '#e0e0dc' },
    { id: 341, name: 'Blue', colorCode: '#245d96' }
  ],
  publishedAt: new Date().toISOString(),
  // ✅ CORRIGÉ: clés basées sur nom de couleur
  finalImagesBase64: {
    'Blanc': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg==',
    'Blue': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg=='
  }
};

function analyzeStructure(payload, name) {
  console.log(`\n🔍 === ANALYSE STRUCTURE: ${name} ===`);
  
  // Analyser colorImages
  const colorImages = payload.finalImages?.colorImages || {};
  const colorImageKeys = Object.keys(colorImages);
  console.log('🎨 Clés colorImages:', colorImageKeys);
  
  // Analyser finalImagesBase64
  const base64Images = payload.finalImagesBase64 || {};
  const base64Keys = Object.keys(base64Images);
  console.log('🖼️ Clés finalImagesBase64:', base64Keys);
  
  // Vérifier correspondance
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  const extraBase64 = base64Keys.filter(key => !colorImageKeys.includes(key));
  
  if (missingBase64.length > 0) {
    console.log('❌ Images base64 manquantes:', missingBase64);
  }
  
  if (extraBase64.length > 0) {
    console.log('⚠️ Clés base64 supplémentaires:', extraBase64);
  }
  
  if (missingBase64.length === 0 && extraBase64.length === 0) {
    console.log('✅ Correspondance parfaite des clés');
  }
  
  // Analyser structure interne
  colorImageKeys.forEach(colorName => {
    const imageData = colorImages[colorName];
    console.log(`📋 ${colorName}:`, {
      hasColorInfo: !!imageData.colorInfo,
      hasImageKey: !!imageData.imageKey,
      hasImageUrl: !!imageData.imageUrl,
      imageKey: imageData.imageKey
    });
  });
  
  return {
    isValid: missingBase64.length === 0,
    missingBase64,
    extraBase64,
    colorImageKeys,
    base64Keys
  };
}

async function testStructure(payload, name, token) {
  console.log(`\n🧪 === TEST: ${name} ===`);
  
  const analysis = analyzeStructure(payload, name);
  
  if (!analysis.isValid) {
    console.log('❌ Structure invalide, test sera probablement rejeté');
  } else {
    console.log('✅ Structure semble valide');
  }
  
  try {
    console.log('🚀 Envoi vers le backend...');
    
    const response = await axios.post(`${BASE_URL}/vendor/publish`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${token}`
      },
      timeout: 30000
    });
    
    console.log(`✅ Succès: ${response.status}`);
    console.log(`📦 Produit créé: ${response.data.productId}`);
    console.log(`🖼️ Images traitées: ${response.data.imagesProcessed}`);
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.response?.status || 'Network Error'}`);
    console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 Erreurs détaillées:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err}`);
      });
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testMapping() {
  console.log('🧪 === TEST MAPPING COULEURS ===\n');
  
  // Simuler le mapping frontend actuel (problématique)
  const capturedImages = {
    '287_340': 'blob:http://localhost:5174/image-blanc',
    '287_341': 'blob:http://localhost:5174/image-blue',
    '287_342': 'blob:http://localhost:5174/image-noir'
  };
  
  const selectedColors = [
    { id: 340, name: 'Blanc' },
    { id: 341, name: 'Blue' },
    { id: 342, name: 'Noir' }
  ];
  
  const productId = 287;
  
  console.log('📸 Images capturées (clés actuelles):', Object.keys(capturedImages));
  
  // Créer le mapping imageKey -> colorName
  const colorMappings = {};
  selectedColors.forEach(color => {
    const imageKey = `${productId}_${color.id}`;
    colorMappings[imageKey] = color.name;
  });
  
  console.log('🗺️ Mapping créé:', colorMappings);
  
  // Simuler la conversion corrigée
  const correctedBase64 = {};
  Object.keys(capturedImages).forEach(imageKey => {
    const colorName = colorMappings[imageKey];
    if (colorName) {
      correctedBase64[colorName] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN6LiLgAAAABJRU5ErkJggg==';
    }
  });
  
  console.log('✅ Structure corrigée:', Object.keys(correctedBase64));
  
  return correctedBase64;
}

async function main() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Veuillez fournir un token JWT:');
    console.log('   node test-vendor-publish-structure.js <VOTRE_TOKEN>');
    console.log('\n💡 Pour obtenir votre token:');
    console.log('   1. Connectez-vous sur votre frontend');
    console.log('   2. DevTools > Application > Cookies');
    console.log('   3. Copiez la valeur du cookie "auth_token"');
    return;
  }
  
  console.log('🧪 === TEST STRUCTURE DONNÉES VENDOR PUBLISH ===\n');
  
  // Test 1: Structure actuelle (qui échoue)
  const result1 = await testStructure(testCurrentStructure, 'STRUCTURE ACTUELLE (PROBLÉMATIQUE)', token);
  
  // Test 2: Structure corrigée
  const result2 = await testStructure(testCorrectedStructure, 'STRUCTURE CORRIGÉE', token);
  
  // Test 3: Démonstration du mapping
  await testMapping();
  
  console.log('\n📊 === RÉSUMÉ ===');
  console.log(`Structure actuelle: ${result1.success ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Structure corrigée: ${result2.success ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (!result1.success && result2.success) {
    console.log('\n💡 SOLUTION CONFIRMÉE:');
    console.log('   - Le problème vient du mapping des clés dans finalImagesBase64');
    console.log('   - Utilisez les noms de couleurs comme clés, pas les imageKeys');
    console.log('   - Suivez le guide FRONTEND_VENDOR_PUBLISH_DATA_STRUCTURE_FIX.md');
  }
}

// Exporter pour utilisation dans d'autres scripts
module.exports = {
  testCurrentStructure,
  testCorrectedStructure,
  analyzeStructure,
  testStructure
};

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
} 