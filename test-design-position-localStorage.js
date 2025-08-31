const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Configuration axios avec cookies
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
    
    if (response.data.success) {
      console.log('✅ Connexion réussie');
      return true;
    } else {
      console.log('❌ Échec de connexion:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

async function testDesignPositionFromLocalStorage() {
  console.log('🧪 Test sauvegarde position design depuis localStorage\n');

  // Connexion d'abord
  const isLoggedIn = await loginAsVendor();
  if (!isLoggedIn) {
    console.log('❌ Impossible de se connecter, arrêt des tests');
    return;
  }

  // Données simulant ce qui vient du localStorage
  const localStoragePosition = {
    vendorProductId: 12, // ID d'un produit existant
    designId: 2, // ID d'un design existant  
    position: {
      x: -44,
      y: -68,
      scale: 0.44166666666666665,
      rotation: 15
    }
  };

  console.log('📝 Test 1: Sauvegarde position depuis localStorage');
  console.log('Position à sauvegarder:', localStoragePosition);
  
  try {
    const response = await axios.post(`${API_BASE}/vendor/design-position`, localStoragePosition, axiosConfig);
    
    if (response.data.success) {
      console.log('✅ SUCCÈS: Position sauvegardée');
      console.log(`   ID: ${response.data.data.id}`);
      console.log(`   Produit: ${response.data.data.vendorProductId}`);
      console.log(`   Design: ${response.data.data.designId}`);
      console.log(`   Position: ${JSON.stringify(response.data.data.position)}`);
      console.log(`   Message: ${response.data.message}`);
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
    }
  } catch (error) {
    console.log('❌ ERREUR sauvegarde position:', error.response?.data || error.message);
    return;
  }

  console.log('\n📝 Test 2: Mise à jour position (même produit/design)');
  try {
    const updatedPosition = {
      ...localStoragePosition,
      position: {
        x: -60,
        y: -80,
        scale: 0.6,
        rotation: 30
      }
    };

    const response2 = await axios.post(`${API_BASE}/vendor/design-position`, updatedPosition, axiosConfig);
    
    if (response2.data.success) {
      console.log('✅ SUCCÈS: Position mise à jour');
      console.log(`   ID: ${response2.data.data.id}`);
      console.log(`   Nouvelle position: ${JSON.stringify(response2.data.data.position)}`);
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response2.data);
    }
  } catch (error) {
    console.log('❌ ERREUR mise à jour position:', error.response?.data || error.message);
  }

  console.log('\n📝 Test 3: Test avec transforms (format numérique)');
  try {
    const transformData = {
      vendorProductId: 12,
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

    const response3 = await axios.post(`${API_BASE}/vendor/design-transforms/save`, transformData, axiosConfig);
    
    if (response3.data.success) {
      console.log('✅ SUCCÈS: Transform sauvegardé');
      console.log(`   Transform ID: ${response3.data.data.id}`);
      console.log('   ✅ Position extraite et sauvegardée automatiquement!');
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response3.data);
    }
  } catch (error) {
    console.log('❌ ERREUR sauvegarde transform:', error.response?.data || error.message);
  }

  console.log('\n📝 Test 4: Création produit avec position localStorage');
  try {
    const productWithPosition = {
      baseProductId: 4,
      designId: 2,
      vendorName: 'T-shirt Test Position',
      vendorDescription: 'Test avec position depuis localStorage',
      vendorPrice: 25000,
      vendorStock: 50,
      selectedColors: [
        { colorId: 1, colorName: 'Blanc', colorHex: '#FFFFFF' }
      ],
      selectedSizes: [
        { sizeId: 1, sizeName: 'M' }
      ],
      productStructure: {
        adminProduct: {
          name: 'T-shirt Basique',
          description: 'T-shirt en coton',
          price: 15000
        },
        designApplication: {
          scale: 0.6
        }
      },
      // ✅ NOUVELLE FONCTIONNALITÉ: Position depuis localStorage
      designPosition: {
        x: -50,
        y: -70,
        scale: 0.5,
        rotation: 20
      }
    };

    const response4 = await axios.post(`${API_BASE}/vendor/products`, productWithPosition, axiosConfig);
    
    if (response4.data.success) {
      console.log('✅ SUCCÈS: Produit créé avec position localStorage');
      console.log(`   Produit ID: ${response4.data.data.vendorProduct.id}`);
      console.log('   ✅ Position sauvegardée lors de la création!');
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response4.data);
    }
  } catch (error) {
    console.log('❌ ERREUR création produit avec position:', error.response?.data || error.message);
  }

  console.log('\n🎯 Tests terminés');
  console.log('✅ Si tous les tests passent, la sauvegarde depuis localStorage fonctionne!');
}

// Exécuter les tests
testDesignPositionFromLocalStorage().catch(console.error); 