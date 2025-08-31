const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3004';
const PRODUCT_ID = 4;

// Fonctions utilitaires
const fetchProduct = async (productId) => {
  const response = await fetch(`${BASE_URL}/products/${productId}`);
  if (!response.ok) {
    throw new Error(`Produit ${productId} non trouvé`);
  }
  return await response.json();
};

const mapTimestampToColorId = (timestamp, colorVariations) => {
  if (!colorVariations || colorVariations.length === 0) {
    throw new Error('Aucune couleur disponible');
  }
  
  // Utiliser le timestamp pour déterminer de manière déterministe quelle couleur utiliser
  const index = Math.abs(timestamp % colorVariations.length);
  const selectedColor = colorVariations[index];
  
  console.log(`🔄 Mapping: timestamp ${timestamp} → index ${index} → couleur ${selectedColor.name} (ID: ${selectedColor.id})`);
  
  return selectedColor.id;
};

const uploadImageToColor = async (productId, colorId, imageFile) => {
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
  
  return await response.json();
};

// Test 1 : Upload avec timestamp
async function testTimestampUpload() {
  console.log('\n🧪 Test 1: Upload avec timestamp...');
  
  try {
    // Récupérer le produit
    const product = await fetchProduct(PRODUCT_ID);
    console.log('📋 Produit récupéré:', {
      id: product.id,
      name: product.name,
      colorVariations: product.colorVariations.map(cv => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode
      }))
    });
    
    // Simuler un timestamp
    const timestamp = Date.now();
    console.log('🕐 Timestamp généré:', timestamp);
    
    // Mapper le timestamp vers une couleur
    const colorId = mapTimestampToColorId(timestamp, product.colorVariations);
    
    // Créer un fichier de test
    const testImagePath = './test-timestamp-upload.jpg';
    fs.writeFileSync(testImagePath, 'fake image data for timestamp test');
    
    // Upload
    const result = await uploadImageToColor(PRODUCT_ID, colorId, fs.createReadStream(testImagePath));
    console.log('✅ Upload timestamp réussi:', result);
    
    // Nettoyer
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
  } catch (error) {
    console.error('❌ Erreur test timestamp:', error.message);
  }
}

// Test 2 : Upload avec différents timestamps
async function testMultipleTimestamps() {
  console.log('\n🧪 Test 2: Upload avec différents timestamps...');
  
  try {
    const product = await fetchProduct(PRODUCT_ID);
    const colorVariations = product.colorVariations;
    
    const timestamps = [
      Date.now(),
      Date.now() + 1000,
      Date.now() + 2000,
      Date.now() + 3000
    ];
    
    for (const timestamp of timestamps) {
      console.log(`\n📝 Test timestamp: ${timestamp}`);
      
      const colorId = mapTimestampToColorId(timestamp, colorVariations);
      console.log(`🎯 Couleur sélectionnée: ID ${colorId}`);
      
      // Créer un fichier de test unique
      const testImagePath = `./test-${timestamp}.jpg`;
      fs.writeFileSync(testImagePath, `fake image data for timestamp ${timestamp}`);
      
      try {
        const result = await uploadImageToColor(PRODUCT_ID, colorId, fs.createReadStream(testImagePath));
        console.log('✅ Upload réussi pour ce timestamp');
      } catch (error) {
        console.log('❌ Erreur upload pour ce timestamp:', error.message);
      }
      
      // Nettoyer
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test multiple timestamps:', error.message);
  }
}

// Test 3 : Test de détection de couleur
async function testColorDetection() {
  console.log('\n🧪 Test 3: Détection de couleur...');
  
  try {
    const product = await fetchProduct(PRODUCT_ID);
    
    // Simuler différents types de variations de couleur
    const testVariations = [
      { name: 'Blanc', colorCode: '#c7c7c7' },
      { name: 'Blue', colorCode: '#244a89' },
      { name: 'noiy', colorCode: '#000000' },
      Date.now(), // timestamp
      Date.now() + 1000, // autre timestamp
    ];
    
    for (const variation of testVariations) {
      console.log(`\n📝 Test variation:`, variation);
      
      let colorId = null;
      
      if (typeof variation === 'object' && variation.name) {
        // Chercher par nom ou code couleur
        const existingColor = product.colorVariations.find(cv => 
          cv.name.toLowerCase() === variation.name.toLowerCase() ||
          cv.colorCode === variation.colorCode
        );
        
        if (existingColor) {
          colorId = existingColor.id;
          console.log('✅ Couleur trouvée par nom/code:', existingColor);
        }
      } else if (typeof variation === 'number') {
        // Mapper le timestamp
        colorId = mapTimestampToColorId(variation, product.colorVariations);
      }
      
      if (colorId) {
        console.log(`🎯 ID de couleur final: ${colorId}`);
      } else {
        console.log('⚠️ Aucune couleur trouvée pour cette variation');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test détection:', error.message);
  }
}

// Test 4 : Test de fallback
async function testFallback() {
  console.log('\n🧪 Test 4: Test de fallback...');
  
  try {
    const product = await fetchProduct(PRODUCT_ID);
    
    // Simuler une variation inconnue
    const unknownVariation = { name: 'CouleurInconnue', colorCode: '#999999' };
    console.log('📝 Test variation inconnue:', unknownVariation);
    
    // Chercher par nom ou code couleur
    const existingColor = product.colorVariations.find(cv => 
      cv.name.toLowerCase() === unknownVariation.name.toLowerCase() ||
      cv.colorCode === unknownVariation.colorCode
    );
    
    if (existingColor) {
      console.log('✅ Couleur trouvée:', existingColor);
    } else {
      // Fallback : utiliser la première couleur disponible
      const fallbackColor = product.colorVariations[0];
      if (fallbackColor) {
        console.log('⚠️ Utilisation de la couleur par défaut:', fallbackColor);
      } else {
        console.log('❌ Aucune couleur disponible');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test fallback:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests de solution dynamique...\n');
  
  await testTimestampUpload();
  await testMultipleTimestamps();
  await testColorDetection();
  await testFallback();
  
  console.log('\n✨ Tous les tests terminés!');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTimestampUpload,
  testMultipleTimestamps,
  testColorDetection,
  testFallback,
  mapTimestampToColorId,
  uploadImageToColor
}; 