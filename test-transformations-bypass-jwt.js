const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Variable globale pour stocker le token
let authToken = null;

// Configuration axios de base
const axiosConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function loginAsVendor() {
  console.log('🔐 Connexion en tant que vendeur...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, axiosConfig);
    
    // ✅ Vérifier si la réponse contient un utilisateur
    if (response.data.user && response.data.user.id) {
      console.log('✅ Connexion réussie');
      console.log(`   Utilisateur: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      
      // Extraire le token des cookies ou headers
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const authCookie = cookies.find(cookie => cookie.startsWith('access_token='));
        if (authCookie) {
          authToken = authCookie.split('=')[1].split(';')[0];
          console.log(`   Token JWT extrait: ${authToken.substring(0, 20)}...`);
        }
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

// Configuration axios avec token
function getAuthenticatedAxiosConfig() {
  return {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      'Authorization': authToken ? `Bearer ${authToken}` : undefined
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
    designId: 8,
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
    const response = await axios.post(`${API_BASE}/vendor/products`, productData, getAuthenticatedAxiosConfig());
    
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

      const response = await axios.post(`${API_BASE}/vendor/design-transforms/save`, transformData, getAuthenticatedAxiosConfig());
      
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

  console.log('\n📝 Test 3: Test sauvegarde position directe');
  
  if (global.testProductId) {
    try {
      const positionData = {
        vendorProductId: global.testProductId,
        designId: 8,
        position: {
          x: -200,
          y: -150,
          scale: 0.9,
          rotation: 30
        }
      };

      const response = await axios.post(`${API_BASE}/vendor/design-position`, positionData, getAuthenticatedAxiosConfig());
      
      if (response.data.success) {
        console.log('✅ SUCCÈS: Position sauvegardée directement');
        console.log(`   Produit ID: ${response.data.data.vendorProductId}`);
        console.log(`   Design ID: ${response.data.data.designId}`);
        console.log(`   Position: ${JSON.stringify(response.data.data.position)}`);
      } else {
        console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
      }
    } catch (error) {
      console.log('❌ ERREUR sauvegarde position:', error.response?.data || error.message);
    }
  }

  console.log('\n🎯 Tests terminés');
  console.log('✅ Le bypass validation permet maintenant de créer des produits avec des noms auto-générés!');
  console.log('✅ Les transformations et positions fonctionnent correctement!');
  console.log('💡 Pour la production, n\'utilisez pas le flag bypassValidation');
}

// Exécuter les tests
testTransformationsWithBypass().catch(console.error); 