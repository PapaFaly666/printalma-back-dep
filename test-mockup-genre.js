const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testMockupGenre() {
  console.log('🧪 Test de l\'implémentation du champ genre dans les mockups\n');

  try {
    // Test 1: Créer un mockup pour homme
    console.log('1️⃣ Test création mockup pour homme...');
    const hommeMockup = {
      name: 'T-shirt Homme Classic',
      description: 'T-shirt basique pour homme en coton',
      price: 5000,
      status: 'draft',
      isReadyProduct: false,
      genre: 'HOMME',
      categories: ['T-shirts', 'Homme'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [
        {
          name: 'Noir',
          colorCode: '#000000',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 10,
                  y: 10,
                  width: 80,
                  height: 80,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response1 = await axios.post(`${BASE_URL}/mockups`, hommeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup homme créé:', {
        id: response1.data.id,
        name: response1.data.name,
        genre: response1.data.genre,
        isReadyProduct: response1.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup homme:', error.response?.data || error.message);
    }

    // Test 2: Créer un mockup pour femme
    console.log('\n2️⃣ Test création mockup pour femme...');
    const femmeMockup = {
      name: 'T-shirt Femme Élégant',
      description: 'T-shirt élégant pour femme',
      price: 6000,
      status: 'published',
      isReadyProduct: false,
      genre: 'FEMME',
      categories: ['T-shirts', 'Femme'],
      sizes: ['XS', 'S', 'M', 'L'],
      colorVariations: [
        {
          name: 'Rose',
          colorCode: '#FF69B4',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 15,
                  y: 15,
                  width: 70,
                  height: 70,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response2 = await axios.post(`${BASE_URL}/mockups`, femmeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup femme créé:', {
        id: response2.data.id,
        name: response2.data.name,
        genre: response2.data.genre,
        isReadyProduct: response2.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup femme:', error.response?.data || error.message);
    }

    // Test 3: Créer un mockup unisexe (valeur par défaut)
    console.log('\n3️⃣ Test création mockup unisexe (valeur par défaut)...');
    const unisexeMockup = {
      name: 'T-shirt Unisexe Basic',
      description: 'T-shirt basique pour tous',
      price: 4500,
      status: 'draft',
      isReadyProduct: false,
      // genre non spécifié = 'unisexe' par défaut
      categories: ['T-shirts', 'Unisexe'],
      sizes: ['S', 'M', 'L'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 20,
                  y: 20,
                  width: 60,
                  height: 60,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response3 = await axios.post(`${BASE_URL}/mockups`, unisexeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup unisexe créé:', {
        id: response3.data.id,
        name: response3.data.name,
        genre: response3.data.genre,
        isReadyProduct: response3.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup unisexe:', error.response?.data || error.message);
    }

    // Test 4: Récupérer les genres disponibles
    console.log('\n4️⃣ Test récupération des genres disponibles...');
    try {
      const genresResponse = await axios.get(`${BASE_URL}/mockups/genres`);
      console.log('✅ Genres disponibles:', genresResponse.data);
    } catch (error) {
      console.log('❌ Erreur récupération genres:', error.response?.data || error.message);
    }

    // Test 5: Récupérer les mockups par genre
    console.log('\n5️⃣ Test récupération mockups par genre...');
    try {
      const hommeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/HOMME`);
      console.log('✅ Mockups homme:', hommeResponse.data.length, 'trouvés');

      const femmeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/FEMME`);
      console.log('✅ Mockups femme:', femmeResponse.data.length, 'trouvés');

      const unisexeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/UNISEXE`);
      console.log('✅ Mockups unisexe:', unisexeResponse.data.length, 'trouvés');
    } catch (error) {
      console.log('❌ Erreur récupération par genre:', error.response?.data || error.message);
    }

    // Test 6: Récupérer tous les mockups avec filtre
    console.log('\n6️⃣ Test récupération tous les mockups avec filtre...');
    try {
      const allMockupsResponse = await axios.get(`${BASE_URL}/mockups`);
      console.log('✅ Tous les mockups:', allMockupsResponse.data.length, 'trouvés');

      const hommeFilterResponse = await axios.get(`${BASE_URL}/mockups?genre=HOMME`);
      console.log('✅ Mockups filtrés (homme):', hommeFilterResponse.data.length, 'trouvés');
    } catch (error) {
      console.log('❌ Erreur récupération tous les mockups:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test de validation des erreurs
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
      genre: 'invalid', // Genre invalide
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
      genre: 'homme',
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
  await testMockupGenre();
  await testValidationErrors();
}

runTests(); 

// Configuration
const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here'; // À remplacer par un vrai token admin

async function testMockupGenre() {
  console.log('🧪 Test de l\'implémentation du champ genre dans les mockups\n');

  try {
    // Test 1: Créer un mockup pour homme
    console.log('1️⃣ Test création mockup pour homme...');
    const hommeMockup = {
      name: 'T-shirt Homme Classic',
      description: 'T-shirt basique pour homme en coton',
      price: 5000,
      status: 'draft',
      isReadyProduct: false,
      genre: 'HOMME',
      categories: ['T-shirts', 'Homme'],
      sizes: ['S', 'M', 'L', 'XL'],
      colorVariations: [
        {
          name: 'Noir',
          colorCode: '#000000',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 10,
                  y: 10,
                  width: 80,
                  height: 80,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response1 = await axios.post(`${BASE_URL}/mockups`, hommeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup homme créé:', {
        id: response1.data.id,
        name: response1.data.name,
        genre: response1.data.genre,
        isReadyProduct: response1.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup homme:', error.response?.data || error.message);
    }

    // Test 2: Créer un mockup pour femme
    console.log('\n2️⃣ Test création mockup pour femme...');
    const femmeMockup = {
      name: 'T-shirt Femme Élégant',
      description: 'T-shirt élégant pour femme',
      price: 6000,
      status: 'published',
      isReadyProduct: false,
      genre: 'FEMME',
      categories: ['T-shirts', 'Femme'],
      sizes: ['XS', 'S', 'M', 'L'],
      colorVariations: [
        {
          name: 'Rose',
          colorCode: '#FF69B4',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 15,
                  y: 15,
                  width: 70,
                  height: 70,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response2 = await axios.post(`${BASE_URL}/mockups`, femmeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup femme créé:', {
        id: response2.data.id,
        name: response2.data.name,
        genre: response2.data.genre,
        isReadyProduct: response2.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup femme:', error.response?.data || error.message);
    }

    // Test 3: Créer un mockup unisexe (valeur par défaut)
    console.log('\n3️⃣ Test création mockup unisexe (valeur par défaut)...');
    const unisexeMockup = {
      name: 'T-shirt Unisexe Basic',
      description: 'T-shirt basique pour tous',
      price: 4500,
      status: 'draft',
      isReadyProduct: false,
      // genre non spécifié = 'unisexe' par défaut
      categories: ['T-shirts', 'Unisexe'],
      sizes: ['S', 'M', 'L'],
      colorVariations: [
        {
          name: 'Blanc',
          colorCode: '#FFFFFF',
          images: [
            {
              view: 'Front',
              delimitations: [
                {
                  x: 20,
                  y: 20,
                  width: 60,
                  height: 60,
                  name: 'Zone principale'
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      const response3 = await axios.post(`${BASE_URL}/mockups`, unisexeMockup, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Mockup unisexe créé:', {
        id: response3.data.id,
        name: response3.data.name,
        genre: response3.data.genre,
        isReadyProduct: response3.data.isReadyProduct
      });
    } catch (error) {
      console.log('❌ Erreur création mockup unisexe:', error.response?.data || error.message);
    }

    // Test 4: Récupérer les genres disponibles
    console.log('\n4️⃣ Test récupération des genres disponibles...');
    try {
      const genresResponse = await axios.get(`${BASE_URL}/mockups/genres`);
      console.log('✅ Genres disponibles:', genresResponse.data);
    } catch (error) {
      console.log('❌ Erreur récupération genres:', error.response?.data || error.message);
    }

    // Test 5: Récupérer les mockups par genre
    console.log('\n5️⃣ Test récupération mockups par genre...');
    try {
      const hommeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/HOMME`);
      console.log('✅ Mockups homme:', hommeResponse.data.length, 'trouvés');

      const femmeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/FEMME`);
      console.log('✅ Mockups femme:', femmeResponse.data.length, 'trouvés');

      const unisexeResponse = await axios.get(`${BASE_URL}/mockups/by-genre/UNISEXE`);
      console.log('✅ Mockups unisexe:', unisexeResponse.data.length, 'trouvés');
    } catch (error) {
      console.log('❌ Erreur récupération par genre:', error.response?.data || error.message);
    }

    // Test 6: Récupérer tous les mockups avec filtre
    console.log('\n6️⃣ Test récupération tous les mockups avec filtre...');
    try {
      const allMockupsResponse = await axios.get(`${BASE_URL}/mockups`);
      console.log('✅ Tous les mockups:', allMockupsResponse.data.length, 'trouvés');

      const hommeFilterResponse = await axios.get(`${BASE_URL}/mockups?genre=HOMME`);
      console.log('✅ Mockups filtrés (homme):', hommeFilterResponse.data.length, 'trouvés');
    } catch (error) {
      console.log('❌ Erreur récupération tous les mockups:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test de validation des erreurs
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
      genre: 'invalid', // Genre invalide
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
      genre: 'homme',
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
  await testMockupGenre();
  await testValidationErrors();
}

runTests(); 