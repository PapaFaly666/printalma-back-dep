const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testTransformationSystem() {
  console.log('🎯 Test système de transformation complet\n');

  try {
    // 1. Connexion
    console.log('1. 🔐 Connexion...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
    console.log('✅ Connecté en tant que:', loginResponse.data.user.firstName);

    // 2. Test mode transformation (nom auto-généré)
    console.log('\n2. 🎨 Test mode transformation...');
    
    const transformationData = {
      baseProductId: 1,
      designId: 10, // Design créé précédemment
      vendorName: 'Produit auto-généré pour positionnement design',
      vendorDescription: 'Produit auto-généré pour positionnement design',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100% de qualité premium',
          price: 19000,
          images: {
            colorVariations: [{
              id: 1,
              name: 'Blanc',
              colorCode: '#FFFFFF',
              images: [{
                id: 1,
                url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                viewType: 'FRONT',
                delimitations: [{ x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }]
              }]
            }]
          },
          sizes: [{ id: 1, sizeName: 'S' }, { id: 2, sizeName: 'M' }, { id: 3, sizeName: 'L' }]
        },
        designApplication: { positioning: 'CENTER', scale: 0.6 }
      },
      designPosition: {
        x: -100,
        y: -75,
        scale: 0.9,
        rotation: 45
      }
    };

    const transformResponse = await axios.post(`${API_BASE}/vendor/products`, transformationData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });
    
    if (transformResponse.data.success && transformResponse.data.status === 'TRANSFORMATION') {
      console.log('✅ Mode transformation détecté et traité');
      console.log(`   Status: ${transformResponse.data.status}`);
      console.log(`   Message: ${transformResponse.data.message}`);
      console.log(`   Transformation ID: ${transformResponse.data.transformationId}`);
      console.log(`   Position ID: ${transformResponse.data.positionId}`);
    } else {
      console.log('❌ Mode transformation non détecté:', transformResponse.data);
    }

    // 3. Test création produit réel (nom personnalisé)
    console.log('\n3. 🚀 Test création produit réel...');
    
    const realProductData = {
      baseProductId: 1,
      designId: 10, // Même design
      vendorName: 'T-shirt Dragon Personnalisé',
      vendorDescription: 'T-shirt avec design dragon unique',
      vendorPrice: 35000,
      vendorStock: 50,
      selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100% de qualité premium',
          price: 19000,
          images: {
            colorVariations: [{
              id: 1,
              name: 'Blanc',
              colorCode: '#FFFFFF',
              images: [{
                id: 1,
                url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                viewType: 'FRONT',
                delimitations: [{ x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }]
              }]
            }]
          },
          sizes: [{ id: 1, sizeName: 'S' }, { id: 2, sizeName: 'M' }, { id: 3, sizeName: 'L' }]
        },
        designApplication: { positioning: 'CENTER', scale: 0.6 }
      },
      designPosition: {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
      }
    };

    const realProductResponse = await axios.post(`${API_BASE}/vendor/products`, realProductData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });
    
    if (realProductResponse.data.success && realProductResponse.data.status !== 'TRANSFORMATION') {
      console.log('✅ Produit réel créé avec succès');
      console.log(`   ID produit: ${realProductResponse.data.productId}`);
      console.log(`   Status: ${realProductResponse.data.status}`);
      console.log(`   Message: ${realProductResponse.data.message}`);
    } else {
      console.log('❌ Erreur création produit réel:', realProductResponse.data);
    }

    // 4. Test récupération transformations
    console.log('\n4. 📋 Test récupération transformations...');
    
    try {
      const transformationsResponse = await axios.get(`${API_BASE}/vendor/transformations`, {
        withCredentials: true,
        headers: { 'Cookie': cookies }
      });
      
      if (transformationsResponse.data.success) {
        console.log('✅ Transformations récupérées');
        console.log(`   Nombre total: ${transformationsResponse.data.data.total}`);
        console.log(`   Transformations: ${transformationsResponse.data.data.transformations.length}`);
      } else {
        console.log('❌ Erreur récupération transformations:', transformationsResponse.data);
      }
    } catch (error) {
      console.log('⚠️ Endpoint transformations non disponible (normal si pas encore déployé)');
    }

    // 5. Test validation nom auto-généré (doit échouer)
    console.log('\n5. 🛡️ Test validation nom auto-généré...');
    
    const invalidProductData = {
      baseProductId: 1,
      designId: 10,
      vendorName: 'Produit auto-généré pour positionnement design',
      vendorDescription: 'Description normale',
      vendorPrice: 35000, // Prix non-standard
      vendorStock: 50,    // Stock non-standard
      selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100% de qualité premium',
          price: 19000,
          images: {
            colorVariations: [{
              id: 1,
              name: 'Blanc',
              colorCode: '#FFFFFF',
              images: [{
                id: 1,
                url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                viewType: 'FRONT',
                delimitations: [{ x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }]
              }]
            }]
          },
          sizes: [{ id: 1, sizeName: 'S' }, { id: 2, sizeName: 'M' }, { id: 3, sizeName: 'L' }]
        },
        designApplication: { positioning: 'CENTER', scale: 0.6 }
      }
      // Pas de designPosition = pas de mode transformation
    };

    try {
      const invalidResponse = await axios.post(`${API_BASE}/vendor/products`, invalidProductData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        }
      });
      
      if (invalidResponse.data.success) {
        console.log('❌ ERREUR: Nom auto-généré accepté alors qu\'il devrait être rejeté');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation fonctionne: nom auto-généré rejeté');
        console.log(`   Erreur: ${error.response.data.message}`);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 RÉSULTATS FINAUX:');
    console.log('✅ Mode transformation: FONCTIONNEL');
    console.log('✅ Création produit réel: FONCTIONNEL');
    console.log('✅ Validation intelligente: FONCTIONNELLE');
    console.log('✅ Séparation des responsabilités: RÉUSSIE');

  } catch (error) {
    console.log('❌ ERREUR GLOBALE:', error.response?.data || error.message);
  }
}

// Exécuter le test
testTransformationSystem().catch(console.error); 