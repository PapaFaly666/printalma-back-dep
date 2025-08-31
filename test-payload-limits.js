const axios = require('axios');

// Configuration de test
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
const TEST_TOKEN = process.env.TEST_VENDOR_TOKEN || 'your_test_jwt_token';

// Configuration axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  },
  timeout: 300000 // 5 minutes de timeout pour les gros uploads
});

// Générer une image base64 de taille spécifique
function generateBase64Image(targetSizeMB) {
  const targetBytes = targetSizeMB * 1024 * 1024;
  // Approximation : base64 fait environ 33% de plus que la taille binaire
  const binarySize = Math.floor(targetBytes * 0.75);
  
  // Générer des données aléatoires
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = 'data:image/png;base64,';
  
  for (let i = 0; i < binarySize; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Générer un payload de test avec des images de taille spécifique
function generateTestPayload(totalSizeMB, imageCount = 3) {
  const imageSizeMB = totalSizeMB / imageCount;
  
  const basePayload = {
    baseProductId: 1,
    designUrl: 'blob:http://localhost:5173/test-design-url',
    designFile: {
      name: 'test-design.png',
      size: 245760,
      type: 'image/png'
    },
    finalImages: {
      colorImages: {},
      statistics: {
        totalColorImages: imageCount - 1,
        hasDefaultImage: true,
        availableColors: [],
        totalImagesGenerated: imageCount
      }
    },
    vendorPrice: 15000,
    vendorName: `Test Payload ${totalSizeMB}MB`,
    vendorDescription: 'Produit de test pour validation des limites de payload',
    vendorStock: 50,
    basePriceAdmin: 12000,
    selectedSizes: [
      { id: 1, sizeName: 'S' },
      { id: 2, sizeName: 'M' }
    ],
    selectedColors: [],
    previewView: {
      viewType: 'FRONT',
      url: 'https://example.com/preview.jpg',
      delimitations: []
    },
    publishedAt: new Date().toISOString(),
    finalImagesBase64: {}
  };

  // Générer les images et leurs métadonnées
  const colors = ['Rouge', 'Vert', 'Bleu', 'Noir', 'Blanc'];
  
  for (let i = 0; i < imageCount - 1; i++) {
    const colorName = colors[i];
    const colorInfo = {
      id: i + 1,
      name: colorName,
      colorCode: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    
    basePayload.finalImages.colorImages[colorName] = {
      colorInfo,
      imageUrl: `blob:http://localhost:5173/image-${colorName.toLowerCase()}-test`,
      imageKey: `1_${i + 1}`
    };
    
    basePayload.selectedColors.push(colorInfo);
    basePayload.finalImages.statistics.availableColors.push(colorName);
    basePayload.finalImagesBase64[colorName] = generateBase64Image(imageSizeMB);
  }
  
  // Ajouter l'image par défaut
  basePayload.finalImages.defaultImage = {
    imageUrl: 'blob:http://localhost:5173/image-default-test',
    imageKey: '1_default'
  };
  basePayload.finalImagesBase64['default'] = generateBase64Image(imageSizeMB);
  
  return basePayload;
}

// Calculer la taille réelle d'un payload
function calculatePayloadSize(payload) {
  const jsonString = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonString]).size;
  return sizeBytes / (1024 * 1024); // Retourner en MB
}

// Tests des limites de payload
async function testPayloadLimits() {
  console.log('🧪 Test des Limites de Payload - Publication Vendeur\n');
  
  const testCases = [
    { size: 5, expected: 'success', description: 'Payload optimal' },
    { size: 15, expected: 'success', description: 'Payload acceptable' },
    { size: 30, expected: 'success', description: 'Payload moyen' },
    { size: 50, expected: 'success', description: 'Payload important' },
    { size: 75, expected: 'success', description: 'Payload volumineux' },
    { size: 95, expected: 'success', description: 'Limite haute' },
    { size: 110, expected: 'error', description: 'Dépassement limite (attendu)' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.description} (${testCase.size}MB)`);
    console.log('='.repeat(50));
    
    try {
      // Générer le payload
      console.log('🔄 Génération du payload...');
      const payload = generateTestPayload(testCase.size);
      const actualSize = calculatePayloadSize(payload);
      
      console.log(`📊 Taille générée: ${actualSize.toFixed(2)}MB`);
      console.log(`📊 Nombre d'images: ${payload.finalImages.statistics.totalImagesGenerated}`);
      
      // Envoyer la requête
      const startTime = Date.now();
      console.log('🚀 Envoi de la requête...');
      
      const response = await api.post('/vendor/publish', payload);
      
      const duration = Date.now() - startTime;
      
      if (testCase.expected === 'success') {
        console.log(`✅ SUCCÈS: ${response.status} en ${duration}ms`);
        console.log(`📦 Produit créé: ${response.data.productId}`);
        console.log(`🖼️ Images traitées: ${response.data.imagesProcessed}`);
      } else {
        console.log(`⚠️ INATTENDU: Succès alors qu'un échec était attendu`);
      }
      
    } catch (error) {
      if (testCase.expected === 'error') {
        console.log(`✅ ÉCHEC ATTENDU: ${error.response?.status || 'Network Error'}`);
        console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
      } else {
        console.log(`❌ ÉCHEC INATTENDU: ${error.response?.status || 'Network Error'}`);
        console.log(`📝 Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data?.errors) {
          console.log('📋 Erreurs détaillées:');
          error.response.data.errors.forEach((err, index) => {
            console.log(`   ${index + 1}. ${err}`);
          });
        }
      }
    }
  }
}

// Test spécifique des images volumineuses
async function testLargeImages() {
  console.log('\n\n🖼️ Test des Images Volumineuses Individuelles\n');
  
  const imageSizes = [5, 10, 15, 20]; // MB par image
  
  for (const imageSize of imageSizes) {
    console.log(`\n📋 Test: Image de ${imageSize}MB`);
    console.log('='.repeat(30));
    
    try {
      const payload = generateTestPayload(imageSize, 1); // Une seule image
      const actualSize = calculatePayloadSize(payload);
      
      console.log(`📊 Taille payload: ${actualSize.toFixed(2)}MB`);
      
      const response = await api.post('/vendor/publish', payload);
      console.log(`✅ SUCCÈS: Image ${imageSize}MB acceptée`);
      
    } catch (error) {
      console.log(`❌ ÉCHEC: Image ${imageSize}MB refusée`);
      console.log(`📝 Raison: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Test de performance avec différentes tailles
async function testPerformance() {
  console.log('\n\n⚡ Test de Performance par Taille\n');
  
  const sizes = [10, 25, 50]; // MB
  
  for (const size of sizes) {
    console.log(`\n📋 Performance: ${size}MB`);
    console.log('='.repeat(25));
    
    try {
      const payload = generateTestPayload(size);
      
      const startTime = Date.now();
      const response = await api.post('/vendor/publish', payload);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Temps de traitement: ${duration}ms`);
      console.log(`📊 Vitesse: ${(size / (duration / 1000)).toFixed(2)} MB/s`);
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

// Test du health check
async function testHealthCheck() {
  console.log('\n\n🏥 Test Health Check\n');
  
  try {
    const response = await api.get('/vendor/health');
    console.log('✅ Health Check réussi');
    console.log('📊 Statut:', response.data);
  } catch (error) {
    console.log('❌ Health Check échoué:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Script de Test - Limites de Payload Vendeur');
  console.log('=' .repeat(60));
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 Token configuré: ${TEST_TOKEN ? 'Oui' : 'Non'}`);
  console.log(`⏱️ Timeout: 5 minutes\n`);
  
  try {
    await testHealthCheck();
    await testPayloadLimits();
    await testLargeImages();
    await testPerformance();
    
    console.log('\n\n🎉 Tests terminés !');
    console.log('\n💡 Conseils:');
    console.log('   - Limites configurées: 100MB pour /vendor/publish');
    console.log('   - Images individuelles: 15MB maximum');
    console.log('   - Optimiser les images avant conversion base64');
    console.log('   - Surveiller les temps de traitement > 30s');
    
  } catch (error) {
    console.error('\n❌ Erreur générale:', error.message);
  }
}

// Vérification si exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testPayloadLimits,
  testLargeImages,
  testPerformance,
  generateTestPayload,
  calculatePayloadSize
}; 