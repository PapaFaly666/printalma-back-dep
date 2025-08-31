const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testReadyProductGenre() {
  console.log('🧪 Test du champ genre avec les produits prêts\n');

  try {
    // Test 1: Créer un produit prêt avec genre
    console.log('1️⃣ Test création produit prêt avec genre...');
    const productData = {
      name: 'T-shirt Homme Premium',
      description: 'T-shirt premium pour homme en coton bio',
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: 'HOMME', // ← NOUVEAU CHAMP
      categories: ['Vêtements > T-shirts'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              fileId: 'test-file-1',
              view: 'Front'
            }
          ]
        }
      ]
    };

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, productData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const createdProduct = response.data;
      console.log('✅ Produit prêt créé:', {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre,
        isReadyProduct: createdProduct.isReadyProduct
      });

      // Test 2: Récupérer le produit prêt par ID
      console.log('\n2️⃣ Test récupération produit prêt par ID...');
      const getResponse = await axios.get(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit prêt récupéré:', {
        id: getResponse.data.id,
        name: getResponse.data.name,
        genre: getResponse.data.genre,
        isReadyProduct: getResponse.data.isReadyProduct
      });

      // Test 3: Mettre à jour le genre
      console.log('\n3️⃣ Test mise à jour du genre...');
      const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        genre: 'FEMME',
        name: 'T-shirt Femme Premium'
      }, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Produit prêt mis à jour:', {
        id: updateResponse.data.id,
        name: updateResponse.data.name,
        genre: updateResponse.data.genre
      });

      // Test 4: Récupérer tous les produits prêts
      console.log('\n4️⃣ Test récupération tous les produits prêts...');
      const allResponse = await axios.get(`${BASE_URL}/products/ready`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Tous les produits prêts: ${allResponse.data.products.length}`);

      // Vérifier que le produit créé a le bon genre
      const ourProduct = allResponse.data.products.find(p => p.id === createdProduct.id);
      if (ourProduct) {
        console.log('✅ Produit trouvé dans la liste:', {
          id: ourProduct.id,
          name: ourProduct.name,
          genre: ourProduct.genre
        });
      }

      // Test 5: Nettoyer le produit de test
      console.log('\n5️⃣ Nettoyage du produit de test...');
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit de test supprimé');

    } catch (error) {
      console.log('❌ Erreur création/mise à jour:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test des erreurs de validation
async function testValidationErrors() {
  console.log('\n🧪 Test des erreurs de validation pour produits prêts...\n');

  try {
    // Test 1: Genre invalide
    console.log('1️⃣ Test genre invalide...');
    const invalidGenreProduct = {
      name: 'Test Invalid Genre',
      description: 'Test avec genre invalide',
      price: 5000,
      isReadyProduct: true,
      genre: 'INVALID', // Genre invalide
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/products/ready`, invalidGenreProduct, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: Le genre invalide aurait dû être rejeté');
    } catch (error) {
      console.log('✅ Genre invalide correctement rejeté:', error.response?.status);
    }

    // Test 2: isReadyProduct = false (devrait être accepté pour les produits prêts)
    console.log('\n2️⃣ Test isReadyProduct = false...');
    const falseReadyProduct = {
      name: 'Test Ready Product False',
      description: 'Test avec isReadyProduct = false',
      price: 5000,
      isReadyProduct: false, // Devrait être accepté
      genre: 'HOMME',
      categories: ['Test'],
      colorVariations: []
    };

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, falseReadyProduct, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ isReadyProduct = false accepté:', response.data.isReadyProduct);
      
      // Nettoyer
      await axios.delete(`${BASE_URL}/products/ready/${response.data.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
    } catch (error) {
      console.log('❌ isReadyProduct = false rejeté:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erreur tests de validation:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testReadyProductGenre();
  await testValidationErrors();
}

runTests(); 

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testReadyProductGenre() {
  console.log('🧪 Test du champ genre avec les produits prêts\n');

  try {
    // Test 1: Créer un produit prêt avec genre
    console.log('1️⃣ Test création produit prêt avec genre...');
    const productData = {
      name: 'T-shirt Homme Premium',
      description: 'T-shirt premium pour homme en coton bio',
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: 'HOMME', // ← NOUVEAU CHAMP
      categories: ['Vêtements > T-shirts'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              fileId: 'test-file-1',
              view: 'Front'
            }
          ]
        }
      ]
    };

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, productData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const createdProduct = response.data;
      console.log('✅ Produit prêt créé:', {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre,
        isReadyProduct: createdProduct.isReadyProduct
      });

      // Test 2: Récupérer le produit prêt par ID
      console.log('\n2️⃣ Test récupération produit prêt par ID...');
      const getResponse = await axios.get(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit prêt récupéré:', {
        id: getResponse.data.id,
        name: getResponse.data.name,
        genre: getResponse.data.genre,
        isReadyProduct: getResponse.data.isReadyProduct
      });

      // Test 3: Mettre à jour le genre
      console.log('\n3️⃣ Test mise à jour du genre...');
      const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        genre: 'FEMME',
        name: 'T-shirt Femme Premium'
      }, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Produit prêt mis à jour:', {
        id: updateResponse.data.id,
        name: updateResponse.data.name,
        genre: updateResponse.data.genre
      });

      // Test 4: Récupérer tous les produits prêts
      console.log('\n4️⃣ Test récupération tous les produits prêts...');
      const allResponse = await axios.get(`${BASE_URL}/products/ready`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Tous les produits prêts: ${allResponse.data.products.length}`);

      // Vérifier que le produit créé a le bon genre
      const ourProduct = allResponse.data.products.find(p => p.id === createdProduct.id);
      if (ourProduct) {
        console.log('✅ Produit trouvé dans la liste:', {
          id: ourProduct.id,
          name: ourProduct.name,
          genre: ourProduct.genre
        });
      }

      // Test 5: Nettoyer le produit de test
      console.log('\n5️⃣ Nettoyage du produit de test...');
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit de test supprimé');

    } catch (error) {
      console.log('❌ Erreur création/mise à jour:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test des erreurs de validation
async function testValidationErrors() {
  console.log('\n🧪 Test des erreurs de validation pour produits prêts...\n');

  try {
    // Test 1: Genre invalide
    console.log('1️⃣ Test genre invalide...');
    const invalidGenreProduct = {
      name: 'Test Invalid Genre',
      description: 'Test avec genre invalide',
      price: 5000,
      isReadyProduct: true,
      genre: 'INVALID', // Genre invalide
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/products/ready`, invalidGenreProduct, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: Le genre invalide aurait dû être rejeté');
    } catch (error) {
      console.log('✅ Genre invalide correctement rejeté:', error.response?.status);
    }

    // Test 2: isReadyProduct = false (devrait être accepté pour les produits prêts)
    console.log('\n2️⃣ Test isReadyProduct = false...');
    const falseReadyProduct = {
      name: 'Test Ready Product False',
      description: 'Test avec isReadyProduct = false',
      price: 5000,
      isReadyProduct: false, // Devrait être accepté
      genre: 'HOMME',
      categories: ['Test'],
      colorVariations: []
    };

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, falseReadyProduct, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ isReadyProduct = false accepté:', response.data.isReadyProduct);
      
      // Nettoyer
      await axios.delete(`${BASE_URL}/products/ready/${response.data.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
    } catch (error) {
      console.log('❌ isReadyProduct = false rejeté:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erreur tests de validation:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testReadyProductGenre();
  await testValidationErrors();
}

runTests(); 