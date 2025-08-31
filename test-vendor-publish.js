const axios = require('axios');
const fs = require('fs');

// Configuration de test
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_VENDOR_TOKEN || 'your_test_jwt_token';

// Données de test
const testData = {
  baseProductId: 1,
  designUrl: 'blob:http://localhost:5173/test-design-url',
  designFile: {
    name: 'test-design.png',
    size: 245760,
    type: 'image/png'
  },
  finalImages: {
    colorImages: {
      'Rouge': {
        colorInfo: {
          id: 1,
          name: 'Rouge',
          colorCode: '#ff0000'
        },
        imageUrl: 'blob:http://localhost:5173/image-rouge-test',
        imageKey: '1_1'
      },
      'Vert': {
        colorInfo: {
          id: 2,
          name: 'Vert',
          colorCode: '#00ff00'
        },
        imageUrl: 'blob:http://localhost:5173/image-vert-test',
        imageKey: '1_2'
      }
    },
    defaultImage: {
      imageUrl: 'blob:http://localhost:5173/image-default-test',
      imageKey: '1_default'
    },
    statistics: {
      totalColorImages: 2,
      hasDefaultImage: true,
      availableColors: ['Rouge', 'Vert'],
      totalImagesGenerated: 3
    }
  },
  vendorPrice: 15000,
  vendorName: 'T-shirt Test Design',
  vendorDescription: 'Produit de test pour validation du système',
  vendorStock: 50,
  basePriceAdmin: 12000,
  selectedSizes: [
    { id: 1, sizeName: 'S' },
    { id: 2, sizeName: 'M' },
    { id: 3, sizeName: 'L' }
  ],
  selectedColors: [
    { id: 1, name: 'Rouge', colorCode: '#ff0000' },
    { id: 2, name: 'Vert', colorCode: '#00ff00' }
  ],
  previewView: {
    viewType: 'FRONT',
    url: 'https://example.com/preview.jpg',
    delimitations: [
      {
        x: 150,
        y: 200,
        width: 100,
        height: 100,
        coordinateType: 'PIXEL'
      }
    ]
  },
  publishedAt: new Date().toISOString(),
  // Images en base64 simulées (version courte pour le test)
  finalImagesBase64: {
    'Rouge': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN',
    'Vert': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN',
    'default': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN'
  }
};

// Configuration axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

// Tests
async function runTests() {
  console.log('🚀 Début des tests du système de publication vendeur\n');

  try {
    // Test 1: Health check
    console.log('📋 Test 1: Health check du service vendeur');
    try {
      const healthResponse = await api.get('/vendor/health');
      console.log('✅ Health check réussi:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check échoué:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Publication vendeur
    console.log('📋 Test 2: Publication d\'un produit vendeur');
    try {
      console.log('📊 Données envoyées:', {
        baseProductId: testData.baseProductId,
        vendorPrice: testData.vendorPrice,
        totalImages: testData.finalImages.statistics.totalImagesGenerated,
        imagesBase64: Object.keys(testData.finalImagesBase64).length
      });

      const publishResponse = await api.post('/vendor/publish', testData);
      console.log('✅ Publication réussie:', publishResponse.data);
      
      // Stocker l'ID pour les tests suivants
      const productId = publishResponse.data.productId;
      console.log(`📝 Produit créé avec ID: ${productId}`);

    } catch (error) {
      console.log('❌ Publication échouée:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        console.log('📋 Erreurs de validation:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`   ${index + 1}. ${err}`);
        });
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Récupération des produits vendeur
    console.log('📋 Test 3: Récupération des produits vendeur');
    try {
      const productsResponse = await api.get('/vendor/products?limit=5&offset=0');
      console.log('✅ Récupération réussie:', {
        success: productsResponse.data.success,
        totalProduits: productsResponse.data.pagination?.total || 0,
        produitsRetournés: productsResponse.data.products?.length || 0
      });

      if (productsResponse.data.products?.length > 0) {
        console.log('📊 Premier produit:', {
          id: productsResponse.data.products[0].id,
          price: productsResponse.data.products[0].price,
          status: productsResponse.data.products[0].status
        });
      }

    } catch (error) {
      console.log('❌ Récupération échouée:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Statistiques vendeur
    console.log('📋 Test 4: Statistiques vendeur');
    try {
      const statsResponse = await api.get('/vendor/stats');
      console.log('✅ Statistiques récupérées:', statsResponse.data.stats);

    } catch (error) {
      console.log('❌ Récupération statistiques échouée:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Validation des erreurs
    console.log('📋 Test 5: Validation des erreurs (prix invalide)');
    try {
      const invalidData = {
        ...testData,
        vendorPrice: 5000, // Prix inférieur au minimum
        basePriceAdmin: 12000
      };

      await api.post('/vendor/publish', invalidData);
      console.log('❌ Erreur: La validation aurait dû échouer');

    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation correcte - Erreur 400 attendue');
        console.log('📋 Erreurs:', error.response.data.errors || [error.response.data.message]);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.log('❌ Erreur générale des tests:', error.message);
  }

  console.log('\n🎉 Tests terminés\n');
}

// Fonction utilitaire pour tester la conversion base64
function testBase64Conversion() {
  console.log('🔧 Test de conversion base64');
  
  const testBlob = testData.finalImagesBase64['Rouge'];
  console.log('📊 Taille base64:', testBlob.length, 'caractères');
  
  try {
    const base64Data = testBlob.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('✅ Conversion buffer réussie:', buffer.length, 'bytes');
  } catch (error) {
    console.log('❌ Erreur conversion:', error.message);
  }
}

// Fonction pour afficher les informations de configuration
function displayConfig() {
  console.log('⚙️ Configuration de test:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Token configuré: ${TEST_TOKEN ? 'Oui' : 'Non'}`);
  console.log(`   Produit de base ID: ${testData.baseProductId}`);
  console.log(`   Images de test: ${Object.keys(testData.finalImagesBase64).length}`);
  console.log('');
}

// Point d'entrée principal
async function main() {
  console.log('🧪 Script de Test - Publication Vendeur\n');
  
  displayConfig();
  testBase64Conversion();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  await runTests();
  
  console.log('📚 Pour utiliser ce script:');
  console.log('   1. Configurez les variables d\'environnement:');
  console.log('      export API_BASE_URL="http://localhost:3000"');
  console.log('      export TEST_VENDOR_TOKEN="your_jwt_token"');
  console.log('   2. Assurez-vous qu\'un produit de base existe avec ID 1');
  console.log('   3. Lancez: node test-vendor-publish.js');
  console.log('');
  console.log('💡 Modifiez les données de test selon vos besoins dans le fichier');
}

// Vérification si exécuté directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  testData,
  testBase64Conversion
}; 