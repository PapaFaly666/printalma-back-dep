const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testFrontendGenre() {
  console.log('🧪 Test des endpoints genre pour le frontend\n');

  try {
    // Test 1: Récupérer les genres disponibles
    console.log('1️⃣ Test récupération des genres disponibles...');
    try {
      const genresResponse = await axios.get(`${BASE_URL}/mockups/genres`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Genres disponibles:', genresResponse.data);
    } catch (error) {
      console.log('❌ Erreur récupération genres:', error.response?.data || error.message);
    }

    // Test 2: Créer un mockup avec genre
    console.log('\n2️⃣ Test création mockup avec genre...');
    const mockupData = {
      name: 'T-shirt Test Frontend',
      description: 'Test pour le frontend avec genre',
      price: 5000,
      status: 'draft',
      isReadyProduct: false,
      genre: 'HOMME',
      categories: ['Test'],
      sizes: ['M'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 10,
                  y: 10,
                  width: 80,
                  height: 80,
                  name: 'Zone test'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/mockups`, mockupData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const createdMockup = createResponse.data;
      console.log('✅ Mockup créé:', {
        id: createdMockup.id,
        name: createdMockup.name,
        genre: createdMockup.genre,
        isReadyProduct: createdMockup.isReadyProduct
      });

      // Test 3: Récupérer le mockup par ID
      console.log('\n3️⃣ Test récupération mockup par ID...');
      const getResponse = await axios.get(`${BASE_URL}/mockups/${createdMockup.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Mockup récupéré:', {
        id: getResponse.data.id,
        name: getResponse.data.name,
        genre: getResponse.data.genre
      });

      // Test 4: Mettre à jour le genre
      console.log('\n4️⃣ Test mise à jour du genre...');
      const updateResponse = await axios.patch(`${BASE_URL}/mockups/${createdMockup.id}`, {
        genre: 'FEMME',
        name: 'T-shirt Test Frontend - Femme'
      }, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Mockup mis à jour:', {
        id: updateResponse.data.id,
        name: updateResponse.data.name,
        genre: updateResponse.data.genre
      });

      // Test 5: Récupérer par genre
      console.log('\n5️⃣ Test récupération par genre...');
      const genreResponse = await axios.get(`${BASE_URL}/mockups/by-genre/FEMME`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Mockups FEMME trouvés: ${genreResponse.data.length}`);

      // Test 6: Récupérer tous les mockups
      console.log('\n6️⃣ Test récupération tous les mockups...');
      const allResponse = await axios.get(`${BASE_URL}/mockups`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Tous les mockups: ${allResponse.data.length}`);

      // Test 7: Filtrage par genre
      console.log('\n7️⃣ Test filtrage par genre...');
      const filterResponse = await axios.get(`${BASE_URL}/mockups?genre=HOMME`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Mockups filtrés HOMME: ${filterResponse.data.length}`);

      // Nettoyer le mockup de test
      console.log('\n8️⃣ Nettoyage du mockup de test...');
      await axios.delete(`${BASE_URL}/mockups/${createdMockup.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Mockup de test supprimé');

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
  console.log('\n🧪 Test des erreurs de validation...\n');

  try {
    // Test 1: Genre invalide
    console.log('1️⃣ Test genre invalide...');
    const invalidGenreMockup = {
      name: 'Test Invalid Genre',
      description: 'Test avec genre invalide',
      price: 5000,
      isReadyProduct: false,
      genre: 'INVALID', // Genre invalide
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/mockups`, invalidGenreMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: Le genre invalide aurait dû être rejeté');
    } catch (error) {
      console.log('✅ Genre invalide correctement rejeté:', error.response?.status);
    }

    // Test 2: isReadyProduct = true (interdit pour les mockups)
    console.log('\n2️⃣ Test isReadyProduct = true (interdit)...');
    const invalidReadyProductMockup = {
      name: 'Test Ready Product',
      description: 'Test avec isReadyProduct = true',
      price: 5000,
      isReadyProduct: true, // Interdit pour les mockups
      genre: 'HOMME',
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/mockups`, invalidReadyProductMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: isReadyProduct = true aurait dû être rejeté');
    } catch (error) {
      console.log('✅ isReadyProduct = true correctement rejeté:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erreur tests de validation:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testFrontendGenre();
  await testValidationErrors();
}

runTests(); 

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testFrontendGenre() {
  console.log('🧪 Test des endpoints genre pour le frontend\n');

  try {
    // Test 1: Récupérer les genres disponibles
    console.log('1️⃣ Test récupération des genres disponibles...');
    try {
      const genresResponse = await axios.get(`${BASE_URL}/mockups/genres`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Genres disponibles:', genresResponse.data);
    } catch (error) {
      console.log('❌ Erreur récupération genres:', error.response?.data || error.message);
    }

    // Test 2: Créer un mockup avec genre
    console.log('\n2️⃣ Test création mockup avec genre...');
    const mockupData = {
      name: 'T-shirt Test Frontend',
      description: 'Test pour le frontend avec genre',
      price: 5000,
      status: 'draft',
      isReadyProduct: false,
      genre: 'HOMME',
      categories: ['Test'],
      sizes: ['M'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 10,
                  y: 10,
                  width: 80,
                  height: 80,
                  name: 'Zone test'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/mockups`, mockupData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const createdMockup = createResponse.data;
      console.log('✅ Mockup créé:', {
        id: createdMockup.id,
        name: createdMockup.name,
        genre: createdMockup.genre,
        isReadyProduct: createdMockup.isReadyProduct
      });

      // Test 3: Récupérer le mockup par ID
      console.log('\n3️⃣ Test récupération mockup par ID...');
      const getResponse = await axios.get(`${BASE_URL}/mockups/${createdMockup.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Mockup récupéré:', {
        id: getResponse.data.id,
        name: getResponse.data.name,
        genre: getResponse.data.genre
      });

      // Test 4: Mettre à jour le genre
      console.log('\n4️⃣ Test mise à jour du genre...');
      const updateResponse = await axios.patch(`${BASE_URL}/mockups/${createdMockup.id}`, {
        genre: 'FEMME',
        name: 'T-shirt Test Frontend - Femme'
      }, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Mockup mis à jour:', {
        id: updateResponse.data.id,
        name: updateResponse.data.name,
        genre: updateResponse.data.genre
      });

      // Test 5: Récupérer par genre
      console.log('\n5️⃣ Test récupération par genre...');
      const genreResponse = await axios.get(`${BASE_URL}/mockups/by-genre/FEMME`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Mockups FEMME trouvés: ${genreResponse.data.length}`);

      // Test 6: Récupérer tous les mockups
      console.log('\n6️⃣ Test récupération tous les mockups...');
      const allResponse = await axios.get(`${BASE_URL}/mockups`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Tous les mockups: ${allResponse.data.length}`);

      // Test 7: Filtrage par genre
      console.log('\n7️⃣ Test filtrage par genre...');
      const filterResponse = await axios.get(`${BASE_URL}/mockups?genre=HOMME`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log(`✅ Mockups filtrés HOMME: ${filterResponse.data.length}`);

      // Nettoyer le mockup de test
      console.log('\n8️⃣ Nettoyage du mockup de test...');
      await axios.delete(`${BASE_URL}/mockups/${createdMockup.id}`, {
        headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Mockup de test supprimé');

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
  console.log('\n🧪 Test des erreurs de validation...\n');

  try {
    // Test 1: Genre invalide
    console.log('1️⃣ Test genre invalide...');
    const invalidGenreMockup = {
      name: 'Test Invalid Genre',
      description: 'Test avec genre invalide',
      price: 5000,
      isReadyProduct: false,
      genre: 'INVALID', // Genre invalide
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/mockups`, invalidGenreMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: Le genre invalide aurait dû être rejeté');
    } catch (error) {
      console.log('✅ Genre invalide correctement rejeté:', error.response?.status);
    }

    // Test 2: isReadyProduct = true (interdit pour les mockups)
    console.log('\n2️⃣ Test isReadyProduct = true (interdit)...');
    const invalidReadyProductMockup = {
      name: 'Test Ready Product',
      description: 'Test avec isReadyProduct = true',
      price: 5000,
      isReadyProduct: true, // Interdit pour les mockups
      genre: 'HOMME',
      categories: ['Test'],
      colorVariations: []
    };

    try {
      await axios.post(`${BASE_URL}/mockups`, invalidReadyProductMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: isReadyProduct = true aurait dû être rejeté');
    } catch (error) {
      console.log('✅ isReadyProduct = true correctement rejeté:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erreur tests de validation:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testFrontendGenre();
  await testValidationErrors();
}

runTests(); 