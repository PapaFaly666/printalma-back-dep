const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'multipart/form-data'
  }
};

async function testReadyProducts() {
  console.log('🧪 Test des produits prêts de l\'admin');
  console.log('=====================================\n');

  try {
    // 1. Test de création d'un produit prêt
    console.log('1. Test de création d\'un produit prêt...');
    
    const productData = {
      name: "T-Shirt Premium Prêt",
      description: "Un t-shirt premium prêt à l'emploi, sans délimitations",
      price: 2500,
      stock: 100,
      status: "draft",
      categories: ["T-shirts", "Prêt-à-porter"],
      sizes: ["S", "M", "L", "XL"],
      colorVariations: [
        {
          name: "Blanc",
          colorCode: "#FFFFFF",
          images: [
            {
              fileId: "front_white",
              view: "Front"
            },
            {
              fileId: "back_white", 
              view: "Back"
            }
          ]
        },
        {
          name: "Noir",
          colorCode: "#000000",
          images: [
            {
              fileId: "front_black",
              view: "Front"
            },
            {
              fileId: "back_black",
              view: "Back"
            }
          ]
        }
      ]
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter des images de test (remplacez par de vrais fichiers)
    // formData.append('file_front_white', fs.createReadStream('./test-images/front-white.jpg'));
    // formData.append('file_back_white', fs.createReadStream('./test-images/back-white.jpg'));
    // formData.append('file_front_black', fs.createReadStream('./test-images/front-black.jpg'));
    // formData.append('file_back_black', fs.createReadStream('./test-images/back-black.jpg'));

    const createResponse = await axios.post(`${BASE_URL}/products/ready`, formData, config);
    console.log('✅ Produit prêt créé avec succès:', createResponse.data);

    const productId = createResponse.data.id;

    // 2. Test de récupération de tous les produits prêts
    console.log('\n2. Test de récupération de tous les produits prêts...');
    const listResponse = await axios.get(`${BASE_URL}/products/ready`, {
      headers: { 'Authorization': config.headers.Authorization }
    });
    console.log('✅ Liste des produits prêts récupérée:', listResponse.data);

    // 3. Test de récupération d'un produit prêt spécifique
    console.log('\n3. Test de récupération d\'un produit prêt spécifique...');
    const getResponse = await axios.get(`${BASE_URL}/products/ready/${productId}`, {
      headers: { 'Authorization': config.headers.Authorization }
    });
    console.log('✅ Produit prêt récupéré:', getResponse.data);

    // 4. Test de mise à jour d'un produit prêt
    console.log('\n4. Test de mise à jour d\'un produit prêt...');
    const updateData = {
      name: "T-Shirt Premium Prêt - Mis à jour",
      description: "Description mise à jour",
      price: 3000,
      stock: 150,
      status: "published",
      categories: ["T-shirts", "Prêt-à-porter", "Premium"],
      sizes: ["XS", "S", "M", "L", "XL", "XXL"]
    };

    const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${productId}`, updateData, {
      headers: { 
        'Authorization': config.headers.Authorization,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Produit prêt mis à jour:', updateResponse.data);

    // 5. Test de suppression d'un produit prêt
    console.log('\n5. Test de suppression d\'un produit prêt...');
    const deleteResponse = await axios.delete(`${BASE_URL}/products/ready/${productId}`, {
      headers: { 'Authorization': config.headers.Authorization }
    });
    console.log('✅ Produit prêt supprimé avec succès');

    console.log('\n🎉 Tous les tests des produits prêts sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Assurez-vous d\'avoir un token admin valide dans la configuration');
    }
  }
}

// Fonction pour tester avec des filtres
async function testReadyProductsWithFilters() {
  console.log('\n🧪 Test des filtres pour les produits prêts');
  console.log('===========================================\n');

  try {
    // Test avec différents filtres
    const filters = [
      { status: 'published', limit: 10, offset: 0 },
      { status: 'draft', limit: 5, offset: 0 },
      { status: 'all', search: 'Premium', limit: 20, offset: 0 }
    ];

    for (const filter of filters) {
      console.log(`Test avec filtres: ${JSON.stringify(filter)}`);
      
      const queryParams = new URLSearchParams(filter).toString();
      const response = await axios.get(`${BASE_URL}/products/ready?${queryParams}`, {
        headers: { 'Authorization': config.headers.Authorization }
      });
      
      console.log(`✅ Résultats: ${response.data.products.length} produits trouvés`);
      console.log(`   Total: ${response.data.total}, HasMore: ${response.data.hasMore}\n`);
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests de filtres:', error.response?.data || error.message);
  }
}

// Fonction pour vérifier que les vendeurs ne peuvent pas accéder aux produits prêts
async function testVendorAccess() {
  console.log('\n🧪 Test d\'accès vendeur aux produits prêts (doit échouer)');
  console.log('===========================================================\n');

  try {
    // Simuler un token vendeur
    const vendorConfig = {
      headers: {
        'Authorization': 'Bearer VENDOR_TOKEN_HERE', // Token vendeur
        'Content-Type': 'application/json'
      }
    };

    // Test d'accès à la liste des produits prêts
    await axios.get(`${BASE_URL}/products/ready`, vendorConfig);
    console.log('❌ Erreur: Les vendeurs ne devraient pas pouvoir accéder aux produits prêts');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correct: Les vendeurs ne peuvent pas accéder aux produits prêts');
    } else {
      console.log('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
}

// Exécution des tests
async function runAllTests() {
  await testReadyProducts();
  await testReadyProductsWithFilters();
  await testVendorAccess();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3000');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Ajoutez des images de test dans le dossier test-images/');
console.log('4. Exécutez: node test-ready-products.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testReadyProducts,
  testReadyProductsWithFilters,
  testVendorAccess,
  runAllTests
}; 