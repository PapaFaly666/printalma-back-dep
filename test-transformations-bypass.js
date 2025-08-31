const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Variable globale pour stocker les cookies
let authCookies = '';

async function loginAsVendor() {
  console.log('🔐 Connexion en tant que vendeur...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // ✅ Vérifier si la réponse contient un utilisateur
    if (response.data.user && response.data.user.id) {
      console.log('✅ Connexion réussie');
      console.log(`   Utilisateur: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      
      // ✅ EXTRAIRE LES COOKIES POUR LES REQUÊTES SUIVANTES
      if (response.headers['set-cookie']) {
        authCookies = response.headers['set-cookie'].join('; ');
        console.log('   Cookies d\'authentification extraits ✓');
      }
      
      return true;
    } else {
      console.log('❌ Échec de connexion: Structure de réponse inattendue');
      console.log('   Réponse reçue:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Configuration axios avec cookies d'authentification
function getAuthenticatedConfig() {
  return {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authCookies
    }
  };
}

async function testTransformationsWithBypass() {
  console.log('🧪 Test transformations avec bypass validation\n');

  // Connexion d'abord
  const isLoggedIn = await loginAsVendor();
  if (!isLoggedIn) {
    console.log('❌ Impossible de se connecter, arrêt des tests');
    return;
  }

  console.log('\n📝 Test 1: Création produit avec nom auto-généré (bypass activé)');
  
  const productData = {
    baseProductId: 1,
    designId: 8, // ✅ ID du design créé
    vendorName: 'Produit auto-généré pour positionnage design',
    vendorDescription: 'Produit auto-généré pour positionnage design',
    vendorPrice: 25000,
    vendorStock: 100,
    selectedColors: [
      { id: 1, name: 'Blanc', colorCode: '#FFFFFF' }
    ],
    selectedSizes: [
      { id: 1, sizeName: 'M' }
    ],
    productStructure: {
      adminProduct: {
        id: 1,
        name: 'T-shirt Basique',
        description: 'T-shirt en coton 100% de qualité premium',
        price: 19000,
        images: {
          colorVariations: [
            {
              id: 1,
              name: 'Blanc',
              colorCode: '#FFFFFF',
              images: [
                {
                  id: 1,
                  url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                  viewType: 'FRONT',
                  delimitations: [
                    { x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }
                  ]
                }
              ]
            }
          ]
        },
        sizes: [
          { id: 1, sizeName: 'S' },
          { id: 2, sizeName: 'M' },
          { id: 3, sizeName: 'L' }
        ]
      },
      designApplication: {
        positioning: 'CENTER',
        scale: 0.6
      }
    },
    designPosition: {
      x: -44,
      y: -68,
      scale: 0.44,
      rotation: 15
    },
    // ✅ FLAG BYPASS VALIDATION
    bypassValidation: true
  };

  try {
    console.log('   Envoi de la requête avec bypass validation...');
    const response = await axios.post(`${API_BASE}/vendor/products`, productData, getAuthenticatedConfig());
    
    if (response.data.success) {
      console.log('✅ SUCCÈS: Produit créé avec bypass validation');
      console.log(`   ID: ${response.data.productId}`);
      console.log(`   Nom: ${response.data.message}`);
      console.log(`   Status: ${response.data.status}`);
      
      // Sauvegarder l'ID pour les tests suivants
      global.testProductId = response.data.productId;
      
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
    }
  } catch (error) {
    console.log('❌ ERREUR création produit:', error.response?.data || error.message);
    console.log('   Status:', error.response?.status);
    
    // Si erreur 400, afficher plus de détails
    if (error.response?.status === 400) {
      console.log('   Détails de l\'erreur:', error.response.data);
      console.log('   ⚠️ Le bypass validation ne semble pas fonctionner');
    }
    return;
  }

  console.log('\n📝 Test 2: Sauvegarde transforms sur le produit créé');
  
  if (global.testProductId) {
    try {
      const transformData = {
        productId: global.testProductId,
        designUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736420184/vendor-designs/vendor_2_design_1736420184324.jpg',
        transforms: {
          '0': {
            x: -100,
            y: -120,
            scale: 0.8,
            rotation: 45
          }
        },
        lastModified: Date.now()
      };

      const response = await axios.post(`${API_BASE}/vendor/design-transforms/save`, transformData, getAuthenticatedConfig());
      
      if (response.data.success) {
        console.log('✅ SUCCÈS: Transform sauvegardé');
        console.log(`   Transform ID: ${response.data.data.id}`);
        console.log('   ✅ Position extraite et sauvegardée automatiquement!');
      } else {
        console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
      }
    } catch (error) {
      console.log('❌ ERREUR sauvegarde transform:', error.response?.data || error.message);
    }
  }

  console.log('\n📝 Test 3: Récupération des transforms sauvegardés');
  
  if (global.testProductId) {
    try {
      const response = await axios.get(`${API_BASE}/vendor/design-transforms/load/${global.testProductId}`, getAuthenticatedConfig());
      
      if (response.data.success) {
        console.log('✅ SUCCÈS: Transforms récupérés');
        console.log(`   Dernière modification: ${response.data.data.lastModified}`);
        console.log(`   Transforms: ${JSON.stringify(response.data.data.transforms)}`);
      } else {
        console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
      }
    } catch (error) {
      console.log('❌ ERREUR récupération transforms:', error.response?.data || error.message);
    }
  }

  console.log('\n📝 Test 4: Positionnement optimal automatique');
  
  if (global.testProductId) {
    try {
      const response = await axios.get(`${API_BASE}/vendor/design-transforms/positioning/${global.testProductId}`, getAuthenticatedConfig());
      
      if (response.data.success) {
        console.log('✅ SUCCÈS: Positionnement optimal récupéré');
        console.log(`   Type produit: ${response.data.data.productType}`);
        console.log(`   Position: ${JSON.stringify(response.data.data.positioning)}`);
        console.log(`   Presets disponibles: ${Object.keys(response.data.data.presets).join(', ')}`);
      } else {
        console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
      }
    } catch (error) {
      console.log('❌ ERREUR positionnement optimal:', error.response?.data || error.message);
    }
  }

  console.log('\n🎯 Tests terminés');
  console.log('✅ Tous les tests de transformation devraient maintenant fonctionner avec le bypass!');
  console.log('💡 Pour la production, n\'utilisez pas le flag bypassValidation');
}

// Exécuter les tests
testTransformationsWithBypass().catch(console.error); 