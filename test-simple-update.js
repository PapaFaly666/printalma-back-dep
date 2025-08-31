const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3004';

async function testSimpleUpdate() {
  console.log('🧪 Test simple de modification des produits prêts');
  console.log('===============================================\n');

  try {
    // 1. D'abord, récupérer un produit prêt existant
    console.log('1. Récupération d\'un produit prêt existant...');
    
    const getResponse = await axios.get(`${BASE_URL}/products/ready`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    if (getResponse.data.products.length === 0) {
      console.log('❌ Aucun produit prêt trouvé. Créez d\'abord un produit prêt.');
      return;
    }

    const productId = getResponse.data.products[0].id;
    console.log(`✅ Produit prêt trouvé: ID ${productId}`);

    // 2. Modifier le produit
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
              url: getResponse.data.products[0].colorVariations[0]?.images[0]?.url || "https://res.cloudinary.com/example/image.jpg",
              view: "Front",
              naturalWidth: 800,
              naturalHeight: 600
            }
          ]
        }
      ]
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(updateData));

    const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${productId}`, formData, {
      headers: {
        ...formData.getHeaders(),
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

    // 4. Vérifier les modifications
    console.log('\n📋 Vérification des modifications:');
    console.log(`   - Nom: "${updateResponse.data.name}" (devrait être "Test Produit Prêt Modifié")`);
    console.log(`   - Prix: ${updateResponse.data.price} (devrait être 3000)`);
    console.log(`   - Stock: ${updateResponse.data.stock} (devrait être 150)`);
    console.log(`   - Statut: ${updateResponse.data.status} (devrait être "PUBLISHED")`);
    console.log(`   - Catégories: ${updateResponse.data.categories.length} (devrait être 2)`);
    console.log(`   - Tailles: ${updateResponse.data.sizes.length} (devrait être 4)`);
    console.log(`   - Variations: ${updateResponse.data.colorVariations.length} (devrait être 1)`);

    console.log('\n🎉 Test de modification simple terminé !');

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

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-simple-update.js\n');

// Décommentez la ligne suivante pour exécuter le test
// testSimpleUpdate();

module.exports = {
  testSimpleUpdate
}; 