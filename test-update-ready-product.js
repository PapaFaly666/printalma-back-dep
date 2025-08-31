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

async function testUpdateReadyProduct() {
  console.log('🧪 Test de modification des produits prêts');
  console.log('==========================================\n');

  try {
    // 1. D'abord, créer un produit prêt pour le tester
    console.log('1. Création d\'un produit prêt pour le test...');
    
    const createData = {
      name: "Test Produit Prêt Original",
      description: "Produit prêt à l'emploi pour test de modification",
      price: 2500,
      stock: 100,
      status: "draft",
      categories: ["T-shirts"],
      sizes: ["S", "M", "L"],
      isReadyProduct: true,
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
      const testImageBuffer = Buffer.from('fake image data');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const createFormData = new FormData();
    createFormData.append('productData', JSON.stringify(createData));
    createFormData.append('file_img_123', fs.createReadStream(testImagePath));

    const createResponse = await axios.post(`${BASE_URL}/products/ready`, createFormData, {
      headers: {
        ...createFormData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    console.log('✅ Produit prêt créé:', createResponse.data.id);
    const productId = createResponse.data.id;

    // 2. Maintenant, modifier le produit
    console.log('\n2. Modification du produit prêt...');
    
    const updateData = {
      name: "Test Produit Prêt Modifié",
      description: "Description mise à jour via l'API",
      price: 3000,
      stock: 150,
      status: "published",
      categories: ["T-shirts", "Vêtements éco-responsables"],
      sizes: ["S", "M", "L", "XL"],
      isReadyProduct: true, // ✅ CRUCIAL - doit rester true
      colorVariations: [
        {
          name: "Rouge Modifié",
          colorCode: "#FF4444",
          images: [
            {
              url: createResponse.data.colorVariations[0].images[0].url, // Garder l'image existante
              view: "Front",
              naturalWidth: 800,
              naturalHeight: 600
            }
          ]
        },
        {
          name: "Bleu",
          colorCode: "#0000FF",
          images: [
            {
              fileId: "img_new_1", // Nouvelle image
              view: "Front"
            }
          ]
        }
      ]
    };

    const updateFormData = new FormData();
    updateFormData.append('productData', JSON.stringify(updateData));
    updateFormData.append('file_img_new_1', fs.createReadStream(testImagePath));

    const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${productId}`, updateFormData, {
      headers: {
        ...updateFormData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    console.log('✅ Produit prêt modifié:', updateResponse.data);
    console.log('✅ isReadyProduct dans la réponse:', updateResponse.data.isReadyProduct);

    // 3. Vérifier que le produit a bien isReadyProduct = true
    if (updateResponse.data.isReadyProduct === true) {
      console.log('✅ SUCCÈS: isReadyProduct = true dans la réponse');
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ true dans la réponse');
    }

    // 4. Récupérer le produit pour vérifier en base
    const getResponse = await axios.get(`${BASE_URL}/products/ready/${productId}`, config);
    
    console.log('✅ Produit récupéré après modification:', getResponse.data);
    console.log('✅ isReadyProduct en base:', getResponse.data.isReadyProduct);

    if (getResponse.data.isReadyProduct === true) {
      console.log('✅ SUCCÈS: isReadyProduct = true en base de données');
    } else {
      console.log('❌ ÉCHEC: isReadyProduct ≠ true en base de données');
    }

    // 5. Vérifier les modifications
    console.log('\n📋 Vérification des modifications:');
    console.log(`   - Nom: "${getResponse.data.name}" (devrait être "Test Produit Prêt Modifié")`);
    console.log(`   - Prix: ${getResponse.data.price} (devrait être 3000)`);
    console.log(`   - Stock: ${getResponse.data.stock} (devrait être 150)`);
    console.log(`   - Statut: ${getResponse.data.status} (devrait être "PUBLISHED")`);
    console.log(`   - Catégories: ${getResponse.data.categories.length} (devrait être 2)`);
    console.log(`   - Tailles: ${getResponse.data.sizes.length} (devrait être 4)`);
    console.log(`   - Variations: ${getResponse.data.colorVariations.length} (devrait être 2)`);

    console.log('\n🎉 Test de modification des produits prêts terminé !');

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
    } else if (error.response?.status === 404) {
      console.log('\n💡 Produit non trouvé.');
      console.log('   - Vérifiez que le produit existe');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Modifier un produit prêt:');
  console.log(`   curl -X PATCH ${BASE_URL}/products/ready/1 \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -F "productData={\\"name\\":\\"Test Modifié\\",\\"description\\":\\"Description mise à jour\\",\\"price\\":3000,\\"stock\\":150,\\"status\\":\\"published\\",\\"categories\\":[\\"T-shirts\\",\\"Vêtements éco-responsables\\"],\\"sizes\\":[\\"S\\",\\"M\\",\\"L\\",\\"XL\\"],\\"isReadyProduct\\":true,\\"colorVariations\\":[{\\"name\\":\\"Rouge Modifié\\",\\"colorCode\\":\\"#FF4444\\",\\"images\\":[{\\"url\\":\\"https://res.cloudinary.com/example/image.jpg\\",\\"view\\":\\"Front\\"}]}]}" \\');
  console.log('     -F "file_img_new_1=@test-image.jpg"');
  console.log('');
  
  console.log('2. Récupérer un produit prêt modifié:');
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

  console.log('✅ Après modification, le produit doit avoir:');
  console.log('   - isReadyProduct = true (préservé)');
  console.log('   - Nom mis à jour');
  console.log('   - Prix mis à jour');
  console.log('   - Stock mis à jour');
  console.log('   - Statut mis à jour');
  console.log('   - Catégories mises à jour');
  console.log('   - Tailles mises à jour');
  console.log('   - Variations de couleur mises à jour');
  console.log('');
  
  console.log('✅ Logs de débogage attendus dans la console du serveur:');
  console.log('   🔍 updateReadyProduct - isReadyProduct from DTO: true');
  console.log('   ✅ Produit prêt détecté - isReadyProduct = true');
  console.log('   💾 Produit modifié avec isReadyProduct: true');
  console.log('');
  
  console.log('✅ Réponse API attendue:');
  console.log('   {');
  console.log('     "id": 123,');
  console.log('     "name": "Test Produit Prêt Modifié",');
  console.log('     "description": "Description mise à jour",');
  console.log('     "price": 3000,');
  console.log('     "stock": 150,');
  console.log('     "status": "PUBLISHED",');
  console.log('     "isReadyProduct": true, // ← DOIT RESTER TRUE');
  console.log('     "categories": [...],');
  console.log('     "sizes": [...],');
  console.log('     "colorVariations": [...]');
  console.log('   }');
}

function showTroubleshooting() {
  console.log('\n🛠️ Dépannage');
  console.log('=============\n');

  console.log('Si isReadyProduct change à false:');
  console.log('1. Vérifiez les logs de débogage dans la console du serveur');
  console.log('2. Vérifiez que le frontend envoie isReadyProduct: true');
  console.log('3. Vérifiez que le DTO contient la propriété isReadyProduct');
  console.log('4. Vérifiez que la base de données a la colonne isReadyProduct');
  console.log('');
  
  console.log('Si les images ne se mettent pas à jour:');
  console.log('1. Vérifiez que les fichiers sont correctement uploadés');
  console.log('2. Vérifiez que les fileId correspondent aux fichiers');
  console.log('3. Vérifiez les logs d\'upload Cloudinary');
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
  await testUpdateReadyProduct();
  testWithCurl();
  showExpectedResults();
  showTroubleshooting();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-update-ready-product.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testUpdateReadyProduct,
  testWithCurl,
  runAllTests
}; 