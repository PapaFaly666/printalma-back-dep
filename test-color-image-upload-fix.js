const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3004'; // Port du frontend
const PRODUCT_ID = 4; // ID du produit testé
const COLOR_ID = 1;   // ID de la couleur testée

// Test d'upload d'image de couleur
async function testColorImageUpload() {
  try {
    console.log('🧪 Test d\'upload direct d\'image de couleur...');
    console.log(`📡 URL: ${BASE_URL}/products/upload-color-image/${PRODUCT_ID}/${COLOR_ID}`);
    
    // Créer FormData
    const formData = new FormData();
    
    // Créer un fichier de test
    const testImagePath = './test-color-image.jpg';
    fs.writeFileSync(testImagePath, 'fake image data for testing');
    
    formData.append('image', fs.createReadStream(testImagePath));
    
    // Faire la requête
    const response = await fetch(`${BASE_URL}/products/upload-color-image/${PRODUCT_ID}/${COLOR_ID}`, {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Statut de la réponse:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload réussi!');
      console.log('📋 Résultat:', JSON.stringify(result, null, 2));
      
      if (result.image && result.image.url) {
        console.log('🖼️  Image disponible à:', result.image.url);
        console.log('🆔 ID de l\'image:', result.image.id);
      }
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error);
    }
    
    // Nettoyer le fichier de test
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
}

// Test avec différents produits et couleurs
async function testMultipleProducts() {
  console.log('\n🔍 Test avec différents produits et couleurs...');
  
  const testCases = [
    { productId: 4, colorId: 1, description: 'Produit 4, Couleur 1' },
    { productId: 1, colorId: 1, description: 'Produit 1, Couleur 1' },
    { productId: 2, colorId: 1, description: 'Produit 2, Couleur 1' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`   Product ID: ${testCase.productId}, Color ID: ${testCase.colorId}`);
    
    try {
      const formData = new FormData();
      formData.append('image', Buffer.from('fake image data'), {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });
      
      const response = await fetch(`${BASE_URL}/products/upload-color-image/${testCase.productId}/${testCase.colorId}`, {
        method: 'POST',
        body: formData
      });
      
      console.log(`   Statut: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Succès');
        console.log(`   🆔 Image ID: ${result.image?.id}`);
        console.log(`   🖼️  URL: ${result.image?.url}`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
  }
}

// Test de vérification des données
async function testDataVerification() {
  console.log('\n🔍 Test de vérification des données...');
  
  try {
    // Vérifier que le produit existe
    const productResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`);
    console.log(`📋 Produit ${PRODUCT_ID} existe:`, productResponse.ok);
    
    if (productResponse.ok) {
      const product = await productResponse.json();
      console.log('📋 Produit:', {
        id: product.id,
        name: product.name,
        colorVariations: product.colorVariations?.length || 0
      });
      
      // Vérifier les variations de couleur
      if (product.colorVariations) {
        const colorVar = product.colorVariations.find(cv => cv.id === COLOR_ID);
        if (colorVar) {
          console.log('✅ Variation de couleur trouvée:', {
            id: colorVar.id,
            name: colorVar.name,
            images: colorVar.images?.length || 0
          });
        } else {
          console.log('❌ Variation de couleur non trouvée');
        }
      }
    }
    
  } catch (error) {
    console.log(`💥 Erreur lors de la vérification: ${error.message}`);
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests d\'upload d\'images de couleur...\n');
  
  await testDataVerification();
  await testColorImageUpload();
  await testMultipleProducts();
  
  console.log('\n✨ Tests terminés!');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testColorImageUpload,
  testMultipleProducts,
  testDataVerification
}; 