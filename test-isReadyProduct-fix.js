const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testIsReadyProductFix() {
  console.log('🧪 Test de la correction isReadyProduct');
  console.log('=====================================\n');

  try {
    // 1. Test de création d'un produit prêt avec isReadyProduct = true
    console.log('1. Test création produit prêt avec isReadyProduct = true...');
    
    const readyProductData = {
      name: "Test Produit Prêt",
      description: "Produit prêt à l'emploi sans délimitations",
      price: 2500,
      stock: 100,
      status: "draft",
      categories: ["T-shirts"],
      sizes: ["S", "M", "L"],
      isReadyProduct: true, // ✅ CRUCIAL
      colorVariations: [
        {
          name: "Rouge",
          colorCode: "#FF0000",
          images: [
            {
              fileId: "img_123",
              view: "Front"
            }
          ]
        }
      ]
    };

    // Créer un fichier de test temporaire
    const testImagePath = './test-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      // Créer un fichier image de test simple
      const testImageBuffer = Buffer.from('fake image data');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const formData = new FormData();
    formData.append('productData', JSON.stringify(readyProductData));
    formData.append('file_img_123', fs.createReadStream(testImagePath));

    const createResponse = await axios.post(`${BASE_URL}/products/ready`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    console.log('✅ Produit prêt créé:', createResponse.data);
    console.log('✅ isReadyProduct dans la réponse:', createResponse.data.isReadyProduct);

    // 2. Vérifier que le produit a bien isReadyProduct = true
    if (createResponse.data.isReadyProduct === true) {
      console.log('✅ SUCCÈS: isReadyProduct = true dans la réponse');
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ true dans la réponse');
    }

    // 3. Récupérer le produit pour vérifier en base
    const productId = createResponse.data.id;
    const getResponse = await axios.get(`${BASE_URL}/products/ready/${productId}`, config);
    
    console.log('✅ Produit récupéré:', getResponse.data);
    console.log('✅ isReadyProduct en base:', getResponse.data.isReadyProduct);

    if (getResponse.data.isReadyProduct === true) {
      console.log('✅ SUCCÈS: isReadyProduct = true en base de données');
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ true en base de données');
    }

    console.log('\n🎉 Test de correction isReadyProduct terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré.');
      console.log('   - Lancez: npm run start:dev');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Problème d\'authentification.');
      console.log('   - Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Erreur 400 - Vérifiez les logs du serveur.');
      console.log('   - Regardez les logs de débogage dans la console du serveur');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Créer un produit prêt avec isReadyProduct = true:');
  console.log(`   curl -X POST ${BASE_URL}/products/ready \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -F "productData={\\"name\\":\\"Test Produit\\",\\"description\\":\\"Test\\",\\"price\\":2500,\\"stock\\":100,\\"status\\":\\"draft\\",\\"categories\\":[\\"T-shirts\\"],\\"sizes\\":[\\"S\\",\\"M\\",\\"L\\"],\\"isReadyProduct\\":true,\\"colorVariations\\":[{\\"name\\":\\"Rouge\\",\\"colorCode\\":\\"#FF0000\\",\\"images\\":[{\\"fileId\\":\\"img_123\\",\\"view\\":\\"Front\\"}]}]}" \\');
  console.log('     -F "file_img_123=@test-image.jpg"');
  console.log('');
  
  console.log('2. Récupérer un produit prêt:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready/1 \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('');
  
  console.log('3. Lister tous les produits prêts:');
  console.log(`   curl -X GET ${BASE_URL}/products/ready \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
}

function showExpectedResults() {
  console.log('\n📋 Résultats attendus');
  console.log('=====================\n');

  console.log('✅ Après correction, quand on crée un produit prêt:');
  console.log('   - isReadyProduct doit être true dans la requête');
  console.log('   - isReadyProduct doit être true dans la réponse');
  console.log('   - isReadyProduct doit être true en base de données');
  console.log('');
  
  console.log('✅ Logs de débogage attendus dans la console du serveur:');
  console.log('   🔍 createReadyProduct - isReadyProduct from DTO: true');
  console.log('   ✅ Produit prêt détecté - isReadyProduct = true');
  console.log('   💾 Produit créé avec isReadyProduct: true');
  console.log('');
  
  console.log('✅ Réponse API attendue:');
  console.log('   {');
  console.log('     "id": 123,');
  console.log('     "name": "Test Produit Prêt",');
  console.log('     "description": "Produit prêt à l\'emploi",');
  console.log('     "price": 2500,');
  console.log('     "stock": 100,');
  console.log('     "status": "DRAFT",');
  console.log('     "isReadyProduct": true, // ← DOIT ÊTRE TRUE');
  console.log('     "categories": [...],');
  console.log('     "sizes": [...],');
  console.log('     "colorVariations": [...]');
  console.log('   }');
}

function showTroubleshooting() {
  console.log('\n🛠️ Dépannage');
  console.log('=============\n');

  console.log('Si isReadyProduct reste false:');
  console.log('1. Vérifiez les logs de débogage dans la console du serveur');
  console.log('2. Vérifiez que le frontend envoie isReadyProduct: true');
  console.log('3. Vérifiez que le DTO contient la propriété isReadyProduct');
  console.log('4. Vérifiez que la base de données a la colonne isReadyProduct');
  console.log('');
  
  console.log('Si vous avez des erreurs TypeScript:');
  console.log('1. Régénérer Prisma: npx prisma generate');
  console.log('2. Redémarrer le serveur: npm run start:dev');
  console.log('');
  
  console.log('Si le serveur ne démarre pas:');
  console.log('1. Vérifiez les erreurs de compilation');
  console.log('2. Corrigez les erreurs TypeScript une par une');
}

// Exécution des tests
async function runAllTests() {
  await testIsReadyProductFix();
  testWithCurl();
  showExpectedResults();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-isReadyProduct-fix.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testIsReadyProductFix,
  testWithCurl,
  runAllTests
}; 