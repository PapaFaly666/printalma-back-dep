const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';

async function testImagesUpdate() {
  console.log('🧪 Test de gestion des images pour modification');
  console.log('===============================================\n');

  try {
    // 1. Récupérer un produit prêt existant
    console.log('1. Récupération d\'un produit prêt existant...');
    
    const getResponse = await axios.get(`${BASE_URL}/products/ready`, {
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      }
    });

    if (getResponse.data.products.length === 0) {
      console.log('❌ Aucun produit prêt trouvé.');
      return;
    }

    const product = getResponse.data.products[0];
    const productId = product.id;
    console.log(`✅ Produit prêt trouvé: ID ${productId}`);

    // 2. Préparer les données de test avec différents types d'images
    console.log('\n2. Préparation des données de test...');
    
    const existingImage = product.colorVariations[0]?.images[0];
    console.log('📋 Image existante trouvée:', existingImage);

    const updateData = {
      name: "Test Images Update",
      description: "Test de gestion des images",
      price: 3000,
      stock: 150,
      status: "published",
      categories: ["T-shirts"],
      sizes: ["S", "M", "L"],
      isReadyProduct: true,
      colorVariations: [
        {
          name: "Test Images",
          colorCode: "#FF00FF",
          images: [
            // Image existante avec ID
            {
              id: existingImage?.id || 67,
              view: "Front"
            },
            // Image existante avec URL (si disponible)
            ...(existingImage?.url ? [{
              url: existingImage.url,
              view: "Back",
              naturalWidth: existingImage.naturalWidth,
              naturalHeight: existingImage.naturalHeight
            }] : [])
          ]
        }
      ]
    };

    console.log('📤 Données à envoyer:', JSON.stringify(updateData, null, 2));

    const formData = new FormData();
    formData.append('productData', JSON.stringify(updateData));

    // 3. Modifier le produit
    console.log('\n3. Modification du produit avec images...');
    
    const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${productId}`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      }
    });

    console.log('✅ Produit modifié:', updateResponse.data);
    console.log('✅ isReadyProduct:', updateResponse.data.isReadyProduct);

    // 4. Vérifier les images
    console.log('\n4. Vérification des images...');
    
    if (updateResponse.data.colorVariations && updateResponse.data.colorVariations.length > 0) {
      const colorVar = updateResponse.data.colorVariations[0];
      console.log(`🎨 Variation de couleur: ${colorVar.name}`);
      console.log(`🖼️ Nombre d'images: ${colorVar.images.length}`);
      
      colorVar.images.forEach((img, index) => {
        console.log(`   Image ${index + 1}:`);
        console.log(`     - ID: ${img.id}`);
        console.log(`     - URL: ${img.url}`);
        console.log(`     - View: ${img.view}`);
        console.log(`     - Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
      });
    } else {
      console.log('⚠️ Aucune variation de couleur trouvée');
    }

    // 5. Test avec nouvelle image
    console.log('\n5. Test avec nouvelle image...');
    
    const testImagePath = './test-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      const testImageBuffer = Buffer.from('fake image data');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const updateDataWithNewImage = {
      ...updateData,
      name: "Test avec Nouvelle Image",
      colorVariations: [
        {
          name: "Test Mix",
          colorCode: "#00FF00",
          images: [
            // Image existante
            {
              id: existingImage?.id || 67,
              view: "Front"
            },
            // Nouvelle image
            {
              fileId: "new_img_1",
              view: "Back"
            }
          ]
        }
      ]
    };

    const formDataWithImage = new FormData();
    formDataWithImage.append('productData', JSON.stringify(updateDataWithNewImage));
    formDataWithImage.append('file_new_img_1', fs.createReadStream(testImagePath));

    const updateWithImageResponse = await axios.patch(`${BASE_URL}/products/ready/${productId}`, formDataWithImage, {
      headers: {
        ...formDataWithImage.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      }
    });

    console.log('✅ Produit modifié avec nouvelle image:', updateWithImageResponse.data.name);
    
    if (updateWithImageResponse.data.colorVariations && updateWithImageResponse.data.colorVariations.length > 0) {
      const colorVar = updateWithImageResponse.data.colorVariations[0];
      console.log(`🖼️ Images après ajout: ${colorVar.images.length}`);
      colorVar.images.forEach((img, index) => {
        console.log(`   Image ${index + 1}: ${img.url ? 'URL' : 'ID'} - ${img.view}`);
      });
    }

    console.log('\n🎉 Test de gestion des images terminé !');

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

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-images-update.js\n');

// Décommentez la ligne suivante pour exécuter le test
// testImagesUpdate();

module.exports = {
  testImagesUpdate
}; 