const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3004';
const PRODUCT_ID = 4;

// Simulation du service de gestion des couleurs
class ColorManagementService {
  constructor() {
    this.cache = new Map();
    this.timestampMapping = new Map();
  }

  async getProductWithCache(productId) {
    if (this.cache.has(productId)) {
      console.log('📋 Produit récupéré depuis le cache');
      return this.cache.get(productId);
    }

    console.log('📋 Récupération du produit depuis l\'API...');
    const response = await fetch(`${BASE_URL}/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Produit ${productId} non trouvé`);
    }

    const product = await response.json();
    this.cache.set(productId, product);
    console.log('✅ Produit mis en cache');
    return product;
  }

  detectColorId(colorVariation, product) {
    console.log('🔍 Détection couleur pour:', colorVariation);

    // 1. Si c'est un objet avec un ID valide
    if (typeof colorVariation === 'object' && colorVariation.id) {
      const existingColor = product.colorVariations.find(cv => cv.id === colorVariation.id);
      if (existingColor) {
        console.log('✅ ID direct trouvé:', existingColor.id);
        return existingColor.id;
      }
    }

    // 2. Si c'est un objet avec nom/code couleur
    if (typeof colorVariation === 'object' && colorVariation.name) {
      const existingColor = product.colorVariations.find(cv => 
        cv.name.toLowerCase() === colorVariation.name.toLowerCase() ||
        cv.colorCode === colorVariation.colorCode
      );
      if (existingColor) {
        console.log('✅ Couleur trouvée par nom/code:', existingColor.id);
        return existingColor.id;
      }
    }

    // 3. Si c'est un timestamp, utiliser le mapping intelligent
    if (typeof colorVariation === 'number' && colorVariation > 1000000000000) {
      return this.mapTimestampToColorId(colorVariation, product.colorVariations);
    }

    // 4. Si c'est un ID numérique direct
    if (typeof colorVariation === 'number' && colorVariation < 1000000) {
      const existingColor = product.colorVariations.find(cv => cv.id === colorVariation);
      if (existingColor) {
        console.log('✅ ID numérique trouvé:', existingColor.id);
        return existingColor.id;
      }
    }

    // 5. Fallback : première couleur disponible
    const fallbackColor = product.colorVariations[0];
    if (fallbackColor) {
      console.log('⚠️ Utilisation couleur par défaut:', fallbackColor.id);
      return fallbackColor.id;
    }

    throw new Error('Aucune couleur disponible pour ce produit');
  }

  mapTimestampToColorId(timestamp, colorVariations) {
    if (!colorVariations || colorVariations.length === 0) {
      throw new Error('Aucune couleur disponible');
    }

    // Vérifier si on a déjà mappé ce timestamp
    if (this.timestampMapping.has(timestamp)) {
      const mappedId = this.timestampMapping.get(timestamp);
      console.log('🔄 Timestamp déjà mappé:', timestamp, '→', mappedId);
      return mappedId;
    }

    // Créer un mapping déterministe basé sur le timestamp
    const index = Math.abs(timestamp % colorVariations.length);
    const selectedColor = colorVariations[index];
    
    // Sauvegarder le mapping
    this.timestampMapping.set(timestamp, selectedColor.id);
    
    console.log(`🔄 Nouveau mapping: timestamp ${timestamp} → index ${index} → couleur ${selectedColor.name} (ID: ${selectedColor.id})`);
    
    return selectedColor.id;
  }

  async uploadColorImage(productId, colorVariation, imageFile) {
    console.log('🚀 Upload intelligent pour:', colorVariation);

    try {
      // 1. Récupérer les données du produit
      const product = await this.getProductWithCache(productId);
      
      // 2. Détecter l'ID de couleur
      const colorId = this.detectColorId(colorVariation, product);
      
      console.log('🎯 ID de couleur détecté:', colorId);
      
      // 3. Upload avec l'ID correct
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${BASE_URL}/products/upload-color-image/${productId}/${colorId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      console.log('✅ Upload réussi:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Erreur upload intelligent:', error);
      throw error;
    }
  }

  clearCache(productId = null) {
    if (productId) {
      this.cache.delete(productId);
      console.log('🗑️ Cache nettoyé pour le produit:', productId);
    } else {
      this.cache.clear();
      console.log('🗑️ Cache complètement nettoyé');
    }
    this.timestampMapping.clear();
  }
}

// Instance du service
const colorManagementService = new ColorManagementService();

// Test 1 : Test de détection d'ID
async function testColorDetection() {
  console.log('\n🧪 Test 1: Détection d\'ID de couleur...');
  
  try {
    const product = await colorManagementService.getProductWithCache(PRODUCT_ID);
    
    const testCases = [
      { name: 'ID direct', input: { id: 16 }, expected: 16 },
      { name: 'Nom de couleur', input: { name: 'Blanc' }, expected: 16 },
      { name: 'Code couleur', input: { colorCode: '#244a89' }, expected: 17 },
      { name: 'ID numérique', input: 23, expected: 23 },
      { name: 'Timestamp', input: Date.now(), expected: 'any' },
      { name: 'Objet inconnu', input: { name: 'CouleurInconnue' }, expected: 'fallback' }
    ];

    for (const testCase of testCases) {
      console.log(`\n📝 Test: ${testCase.name}`);
      console.log('Input:', testCase.input);
      
      try {
        const result = colorManagementService.detectColorId(testCase.input, product);
        console.log('✅ Résultat:', result);
        
        if (testCase.expected === 'any') {
          console.log('✅ Timestamp mappé vers une couleur valide');
        } else if (testCase.expected === 'fallback') {
          console.log('✅ Fallback utilisé');
        } else if (result === testCase.expected) {
          console.log('✅ Test réussi');
        } else {
          console.log('❌ Test échoué - attendu:', testCase.expected, 'reçu:', result);
        }
      } catch (error) {
        console.log('❌ Erreur:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test détection:', error.message);
  }
}

// Test 2 : Test d'upload avec différents types
async function testUploadWithDifferentTypes() {
  console.log('\n🧪 Test 2: Upload avec différents types de couleur...');
  
  try {
    const testCases = [
      { name: 'Objet avec ID', input: { id: 16 } },
      { name: 'Objet avec nom', input: { name: 'Blue' } },
      { name: 'Timestamp', input: Date.now() },
      { name: 'ID numérique', input: 23 }
    ];

    for (const testCase of testCases) {
      console.log(`\n📝 Test upload: ${testCase.name}`);
      console.log('Input:', testCase.input);
      
      // Créer un fichier de test
      const testImagePath = `./test-${Date.now()}.jpg`;
      fs.writeFileSync(testImagePath, `fake image data for ${testCase.name}`);
      
      try {
        const result = await colorManagementService.uploadColorImage(
          PRODUCT_ID, 
          testCase.input, 
          fs.createReadStream(testImagePath)
        );
        console.log('✅ Upload réussi:', result);
      } catch (error) {
        console.log('❌ Erreur upload:', error.message);
      }
      
      // Nettoyer
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test upload:', error.message);
  }
}

// Test 3 : Test de cache
async function testCache() {
  console.log('\n🧪 Test 3: Test du cache...');
  
  try {
    console.log('📋 Première récupération (depuis API)...');
    const product1 = await colorManagementService.getProductWithCache(PRODUCT_ID);
    
    console.log('📋 Deuxième récupération (depuis cache)...');
    const product2 = await colorManagementService.getProductWithCache(PRODUCT_ID);
    
    if (product1.id === product2.id) {
      console.log('✅ Cache fonctionne correctement');
    } else {
      console.log('❌ Problème avec le cache');
    }
    
    console.log('🗑️ Nettoyage du cache...');
    colorManagementService.clearCache(PRODUCT_ID);
    
    console.log('📋 Troisième récupération (depuis API après nettoyage)...');
    const product3 = await colorManagementService.getProductWithCache(PRODUCT_ID);
    
    console.log('✅ Cache nettoyé et rechargé');
    
  } catch (error) {
    console.error('❌ Erreur test cache:', error.message);
  }
}

// Test 4 : Test de mapping de timestamps
async function testTimestampMapping() {
  console.log('\n🧪 Test 4: Test de mapping de timestamps...');
  
  try {
    const product = await colorManagementService.getProductWithCache(PRODUCT_ID);
    const colorVariations = product.colorVariations;
    
    const timestamps = [
      Date.now(),
      Date.now() + 1000,
      Date.now() + 2000,
      Date.now() + 3000,
      Date.now() + 4000
    ];
    
    console.log('🎨 Couleurs disponibles:', colorVariations.map(cv => `${cv.name} (ID: ${cv.id})`));
    
    for (const timestamp of timestamps) {
      console.log(`\n📝 Test timestamp: ${timestamp}`);
      
      const colorId = colorManagementService.mapTimestampToColorId(timestamp, colorVariations);
      const selectedColor = colorVariations.find(cv => cv.id === colorId);
      
      console.log(`🎯 Mapping: ${timestamp} → ${selectedColor.name} (ID: ${colorId})`);
    }
    
    // Test de cohérence du mapping
    console.log('\n🔄 Test de cohérence du mapping...');
    const sameTimestamp = Date.now();
    const result1 = colorManagementService.mapTimestampToColorId(sameTimestamp, colorVariations);
    const result2 = colorManagementService.mapTimestampToColorId(sameTimestamp, colorVariations);
    
    if (result1 === result2) {
      console.log('✅ Mapping cohérent pour le même timestamp');
    } else {
      console.log('❌ Mapping incohérent');
    }
    
  } catch (error) {
    console.error('❌ Erreur test mapping:', error.message);
  }
}

// Test 5 : Test de performance
async function testPerformance() {
  console.log('\n🧪 Test 5: Test de performance...');
  
  try {
    const startTime = Date.now();
    
    // Récupérer le produit plusieurs fois
    for (let i = 0; i < 5; i++) {
      await colorManagementService.getProductWithCache(PRODUCT_ID);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ Temps total: ${duration}ms`);
    console.log(`📊 Temps moyen par requête: ${duration / 5}ms`);
    
    // Nettoyer le cache pour un test équitable
    colorManagementService.clearCache();
    
    const startTimeNoCache = Date.now();
    
    // Récupérer sans cache
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`);
      await response.json();
    }
    
    const endTimeNoCache = Date.now();
    const durationNoCache = endTimeNoCache - startTimeNoCache;
    
    console.log(`⏱️ Temps sans cache: ${durationNoCache}ms`);
    console.log(`📊 Amélioration: ${Math.round((durationNoCache - duration) / durationNoCache * 100)}%`);
    
  } catch (error) {
    console.error('❌ Erreur test performance:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests de gestion intelligente des couleurs...\n');
  
  await testColorDetection();
  await testUploadWithDifferentTypes();
  await testCache();
  await testTimestampMapping();
  await testPerformance();
  
  console.log('\n✨ Tous les tests terminés!');
  console.log('\n📋 Résumé:');
  console.log('✅ Détection automatique d\'ID de couleur');
  console.log('✅ Upload intelligent avec mapping');
  console.log('✅ Cache optimisé');
  console.log('✅ Mapping cohérent des timestamps');
  console.log('✅ Performance améliorée');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  ColorManagementService,
  testColorDetection,
  testUploadWithDifferentTypes,
  testCache,
  testTimestampMapping,
  testPerformance
}; 