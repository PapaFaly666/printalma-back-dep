const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testGenreBackend() {
  console.log('🧪 Test du champ genre avec le backend\n');

  try {
    // Test 1: Créer un produit prêt avec genre HOMME
    console.log('1️⃣ Test création produit prêt avec genre HOMME...');
    
    const productData = {
      name: 'Test Genre HOMME Backend',
      description: 'Test du genre HOMME avec le backend',
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: 'HOMME', // ← TEST AVEC HOMME
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

    // Créer un fichier temporaire pour le test
    const tempFile = 'temp-test-image.jpg';
    fs.writeFileSync(tempFile, 'fake image data');

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    formData.append('file_test-file-1', fs.createReadStream(tempFile));

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, formData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...formData.getHeaders()
        }
      });

      const createdProduct = response.data;
      console.log('✅ Produit prêt créé:', {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre,
        isReadyProduct: createdProduct.isReadyProduct
      });

      // Vérifier que le genre est correct
      if (createdProduct.genre === 'HOMME') {
        console.log('✅ SUCCÈS: Le genre HOMME a été correctement sauvegardé');
      } else {
        console.log('❌ ÉCHEC: Le genre n\'est pas HOMME, il est:', createdProduct.genre);
      }

      // Test 2: Récupérer le produit et vérifier le genre
      console.log('\n2️⃣ Test récupération produit prêt...');
      const getResponse = await axios.get(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      
      const retrievedProduct = getResponse.data;
      console.log('✅ Produit prêt récupéré:', {
        id: retrievedProduct.id,
        name: retrievedProduct.name,
        genre: retrievedProduct.genre,
        isReadyProduct: retrievedProduct.isReadyProduct
      });

      // Vérifier que le genre est toujours correct
      if (retrievedProduct.genre === 'HOMME') {
        console.log('✅ SUCCÈS: Le genre HOMME est correctement récupéré');
      } else {
        console.log('❌ ÉCHEC: Le genre récupéré n\'est pas HOMME, il est:', retrievedProduct.genre);
      }

      // Test 3: Mettre à jour le genre vers FEMME
      console.log('\n3️⃣ Test mise à jour du genre vers FEMME...');
      
      const updateData = {
        name: 'Test Genre FEMME Backend',
        genre: 'FEMME',
        price: 13000
      };

      const updateFormData = new FormData();
      updateFormData.append('productData', JSON.stringify(updateData));

      const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${createdProduct.id}`, updateFormData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...updateFormData.getHeaders()
        }
      });

      const updatedProduct = updateResponse.data;
      console.log('✅ Produit prêt mis à jour:', {
        id: updatedProduct.id,
        name: updatedProduct.name,
        genre: updatedProduct.genre
      });

      // Vérifier que le genre a été mis à jour
      if (updatedProduct.genre === 'FEMME') {
        console.log('✅ SUCCÈS: Le genre a été correctement mis à jour vers FEMME');
      } else {
        console.log('❌ ÉCHEC: Le genre n\'a pas été mis à jour vers FEMME, il est:', updatedProduct.genre);
      }

      // Test 4: Nettoyer le produit de test
      console.log('\n4️⃣ Nettoyage du produit de test...');
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit de test supprimé');

      // Nettoyer le fichier temporaire
      fs.unlinkSync(tempFile);

    } catch (error) {
      console.log('❌ Erreur création/mise à jour:', error.response?.data || error.message);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test avec différents genres
async function testAllGenres() {
  console.log('\n🧪 Test avec tous les genres...\n');

  const genres = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];
  
  for (const genre of genres) {
    console.log(`\n--- Test avec genre: ${genre} ---`);
    
    const productData = {
      name: `Test Genre ${genre} Backend`,
      description: `Test du genre ${genre} avec le backend`,
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: genre,
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

    // Créer un fichier temporaire pour le test
    const tempFile = `temp-test-image-${genre}.jpg`;
    fs.writeFileSync(tempFile, 'fake image data');

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    formData.append('file_test-file-1', fs.createReadStream(tempFile));

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, formData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...formData.getHeaders()
        }
      });

      const createdProduct = response.data;
      console.log(`✅ Produit créé avec genre ${genre}:`, {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre
      });

      // Vérifier que le genre est correct
      if (createdProduct.genre === genre) {
        console.log(`✅ SUCCÈS: Le genre ${genre} a été correctement sauvegardé`);
      } else {
        console.log(`❌ ÉCHEC: Le genre n'est pas ${genre}, il est:`, createdProduct.genre);
      }

      // Nettoyer
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      fs.unlinkSync(tempFile);

    } catch (error) {
      console.log(`❌ Erreur avec genre ${genre}:`, error.response?.data || error.message);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

// Exécuter les tests
async function runTests() {
  await testGenreBackend();
  await testAllGenres();
}

runTests(); 
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testGenreBackend() {
  console.log('🧪 Test du champ genre avec le backend\n');

  try {
    // Test 1: Créer un produit prêt avec genre HOMME
    console.log('1️⃣ Test création produit prêt avec genre HOMME...');
    
    const productData = {
      name: 'Test Genre HOMME Backend',
      description: 'Test du genre HOMME avec le backend',
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: 'HOMME', // ← TEST AVEC HOMME
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

    // Créer un fichier temporaire pour le test
    const tempFile = 'temp-test-image.jpg';
    fs.writeFileSync(tempFile, 'fake image data');

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    formData.append('file_test-file-1', fs.createReadStream(tempFile));

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, formData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...formData.getHeaders()
        }
      });

      const createdProduct = response.data;
      console.log('✅ Produit prêt créé:', {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre,
        isReadyProduct: createdProduct.isReadyProduct
      });

      // Vérifier que le genre est correct
      if (createdProduct.genre === 'HOMME') {
        console.log('✅ SUCCÈS: Le genre HOMME a été correctement sauvegardé');
      } else {
        console.log('❌ ÉCHEC: Le genre n\'est pas HOMME, il est:', createdProduct.genre);
      }

      // Test 2: Récupérer le produit et vérifier le genre
      console.log('\n2️⃣ Test récupération produit prêt...');
      const getResponse = await axios.get(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      
      const retrievedProduct = getResponse.data;
      console.log('✅ Produit prêt récupéré:', {
        id: retrievedProduct.id,
        name: retrievedProduct.name,
        genre: retrievedProduct.genre,
        isReadyProduct: retrievedProduct.isReadyProduct
      });

      // Vérifier que le genre est toujours correct
      if (retrievedProduct.genre === 'HOMME') {
        console.log('✅ SUCCÈS: Le genre HOMME est correctement récupéré');
      } else {
        console.log('❌ ÉCHEC: Le genre récupéré n\'est pas HOMME, il est:', retrievedProduct.genre);
      }

      // Test 3: Mettre à jour le genre vers FEMME
      console.log('\n3️⃣ Test mise à jour du genre vers FEMME...');
      
      const updateData = {
        name: 'Test Genre FEMME Backend',
        genre: 'FEMME',
        price: 13000
      };

      const updateFormData = new FormData();
      updateFormData.append('productData', JSON.stringify(updateData));

      const updateResponse = await axios.patch(`${BASE_URL}/products/ready/${createdProduct.id}`, updateFormData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...updateFormData.getHeaders()
        }
      });

      const updatedProduct = updateResponse.data;
      console.log('✅ Produit prêt mis à jour:', {
        id: updatedProduct.id,
        name: updatedProduct.name,
        genre: updatedProduct.genre
      });

      // Vérifier que le genre a été mis à jour
      if (updatedProduct.genre === 'FEMME') {
        console.log('✅ SUCCÈS: Le genre a été correctement mis à jour vers FEMME');
      } else {
        console.log('❌ ÉCHEC: Le genre n\'a pas été mis à jour vers FEMME, il est:', updatedProduct.genre);
      }

      // Test 4: Nettoyer le produit de test
      console.log('\n4️⃣ Nettoyage du produit de test...');
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Produit de test supprimé');

      // Nettoyer le fichier temporaire
      fs.unlinkSync(tempFile);

    } catch (error) {
      console.log('❌ Erreur création/mise à jour:', error.response?.data || error.message);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test avec différents genres
async function testAllGenres() {
  console.log('\n🧪 Test avec tous les genres...\n');

  const genres = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];
  
  for (const genre of genres) {
    console.log(`\n--- Test avec genre: ${genre} ---`);
    
    const productData = {
      name: `Test Genre ${genre} Backend`,
      description: `Test du genre ${genre} avec le backend`,
      price: 12000,
      stock: 50,
      status: 'published',
      isReadyProduct: true,
      genre: genre,
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

    // Créer un fichier temporaire pour le test
    const tempFile = `temp-test-image-${genre}.jpg`;
    fs.writeFileSync(tempFile, 'fake image data');

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    formData.append('file_test-file-1', fs.createReadStream(tempFile));

    try {
      const response = await axios.post(`${BASE_URL}/products/ready`, formData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          ...formData.getHeaders()
        }
      });

      const createdProduct = response.data;
      console.log(`✅ Produit créé avec genre ${genre}:`, {
        id: createdProduct.id,
        name: createdProduct.name,
        genre: createdProduct.genre
      });

      // Vérifier que le genre est correct
      if (createdProduct.genre === genre) {
        console.log(`✅ SUCCÈS: Le genre ${genre} a été correctement sauvegardé`);
      } else {
        console.log(`❌ ÉCHEC: Le genre n'est pas ${genre}, il est:`, createdProduct.genre);
      }

      // Nettoyer
      await axios.delete(`${BASE_URL}/products/ready/${createdProduct.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      fs.unlinkSync(tempFile);

    } catch (error) {
      console.log(`❌ Erreur avec genre ${genre}:`, error.response?.data || error.message);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

// Exécuter les tests
async function runTests() {
  await testGenreBackend();
  await testAllGenres();
}

runTests(); 