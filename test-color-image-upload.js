const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3000';
const PRODUCT_ID = 1; // Remplacer par un ID de produit existant
const COLOR_ID = 1;   // Remplacer par un ID de couleur existant

// Test d'upload d'image de couleur
async function testColorImageUpload() {
  try {
    console.log('🧪 Test d\'upload direct d\'image de couleur...');
    
    // Créer FormData
    const formData = new FormData();
    
    // Ajouter une image de test (remplacer par le chemin d'une vraie image)
    const imagePath = './test-design.jpg'; // ou './test-logo.png'
    
    if (!fs.existsSync(imagePath)) {
      console.log('⚠️  Image de test non trouvée, création d\'un fichier de test...');
      // Créer un fichier de test simple
      fs.writeFileSync(imagePath, 'fake image data');
    }
    
    formData.append('image', fs.createReadStream(imagePath));
    
    // Faire la requête
    const response = await fetch(`${BASE_URL}/products/upload-color-image/${PRODUCT_ID}/${COLOR_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacer par un vrai token
      },
      body: formData
    });
    
    console.log('📡 Statut de la réponse:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload réussi!');
      console.log('📋 Résultat:', JSON.stringify(result, null, 2));
      
      if (result.image && result.image.url) {
        console.log('🖼️  Image disponible à:', result.image.url);
      }
    } else {
      const error = await response.json();
      console.log('❌ Erreur:', error);
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error.message);
  }
}

// Test avec validation des paramètres
async function testWithValidation() {
  console.log('\n🔍 Test avec validation des paramètres...');
  
  const testCases = [
    { productId: 999, colorId: 1, description: 'Produit inexistant' },
    { productId: 1, colorId: 999, description: 'Couleur inexistante' },
    { productId: 1, colorId: 1, description: 'Paramètres valides' }
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
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        },
        body: formData
      });
      
      console.log(`   Statut: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Succès');
      } else {
        const error = await response.json();
        console.log(`   ❌ Erreur: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
  }
}

// Test de formats d'image
async function testImageFormats() {
  console.log('\n🖼️  Test des formats d\'image...');
  
  const formats = [
    { name: 'JPG', data: Buffer.from('fake jpg data'), filename: 'test.jpg', contentType: 'image/jpeg' },
    { name: 'PNG', data: Buffer.from('fake png data'), filename: 'test.png', contentType: 'image/png' },
    { name: 'WEBP', data: Buffer.from('fake webp data'), filename: 'test.webp', contentType: 'image/webp' },
    { name: 'GIF', data: Buffer.from('fake gif data'), filename: 'test.gif', contentType: 'image/gif' }
  ];
  
  for (const format of formats) {
    console.log(`\n📝 Test format: ${format.name}`);
    
    try {
      const formData = new FormData();
      formData.append('image', format.data, {
        filename: format.filename,
        contentType: format.contentType
      });
      
      const response = await fetch(`${BASE_URL}/products/upload-color-image/${PRODUCT_ID}/${COLOR_ID}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        },
        body: formData
      });
      
      console.log(`   Statut: ${response.status}`);
      
      if (response.ok) {
        console.log('   ✅ Format accepté');
      } else {
        const error = await response.json();
        console.log(`   ❌ Format rejeté: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests d\'upload d\'images de couleur...\n');
  
  await testColorImageUpload();
  await testWithValidation();
  await testImageFormats();
  
  console.log('\n✨ Tests terminés!');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testColorImageUpload,
  testWithValidation,
  testImageFormats
}; 