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

async function testDesignTransforms() {
  console.log('🧪 Test des Design Transforms (correction upsert)\n');

  // Connexion d'abord
  const isLoggedIn = await loginAsVendor();
  if (!isLoggedIn) {
    console.log('❌ Impossible de se connecter, arrêt des tests');
    return;
  }

  const testTransformData = {
    vendorProductId: 11, // Utiliser un ID existant
    designUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736420184/vendor-designs/vendor_2_design_1736420184324.jpg',
    transforms: {
      '0': {
        x: -44,
        y: -68,
        scale: 0.44166666666666665,
        rotation: 0
      }
    },
    lastModified: Date.now()
  };

  console.log('📝 Test 1: Première sauvegarde (CREATE)');
  try {
    const response1 = await axios.post(`${API_BASE}/vendor/design-transforms/save`, testTransformData, axiosConfig);
    
    if (response1.data.success) {
      console.log('✅ SUCCÈS: Première sauvegarde réussie');
      console.log(`   Transform ID: ${response1.data.data.id}`);
      console.log(`   Message: ${response1.data.message}`);
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response1.data);
    }
  } catch (error) {
    console.log('❌ ERREUR première sauvegarde:', error.response?.data || error.message);
    return;
  }

  console.log('\n📝 Test 2: Seconde sauvegarde (UPDATE via upsert)');
  try {
    // Modifier légèrement les transforms
    const modifiedTransformData = {
      ...testTransformData,
      transforms: {
        '0': {
          x: -50,
          y: -70,
          scale: 0.5,
          rotation: 5
        }
      },
      lastModified: Date.now()
    };

    const response2 = await axios.post(`${API_BASE}/vendor/design-transforms/save`, modifiedTransformData, axiosConfig);
    
    if (response2.data.success) {
      console.log('✅ SUCCÈS: Seconde sauvegarde réussie (upsert)');
      console.log(`   Transform ID: ${response2.data.data.id}`);
      console.log(`   Message: ${response2.data.message}`);
      console.log('   ✅ Pas d\'erreur de contrainte unique!');
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response2.data);
    }
  } catch (error) {
    console.log('❌ ERREUR seconde sauvegarde:', error.response?.data || error.message);
    return;
  }

  console.log('\n📝 Test 3: Troisième sauvegarde (vérification persistance)');
  try {
    const finalTransformData = {
      ...testTransformData,
      transforms: {
        '0': {
          x: -60,
          y: -80,
          scale: 0.6,
          rotation: 10
        }
      },
      lastModified: Date.now()
    };

    const response3 = await axios.post(`${API_BASE}/vendor/design-transforms/save`, finalTransformData, axiosConfig);
    
    if (response3.data.success) {
      console.log('✅ SUCCÈS: Troisième sauvegarde réussie');
      console.log(`   Transform ID: ${response3.data.data.id}`);
      console.log('   ✅ Contrainte unique bien gérée!');
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response3.data);
    }
  } catch (error) {
    console.log('❌ ERREUR troisième sauvegarde:', error.response?.data || error.message);
    return;
  }

  console.log('\n📝 Test 4: Récupération des transforms');
  try {
    const response4 = await axios.get(`${API_BASE}/vendor/design-transforms/${testTransformData.vendorProductId}`, axiosConfig);
    
    if (response4.data.success) {
      console.log('✅ SUCCÈS: Récupération réussie');
      console.log(`   Transforms récupérés: ${JSON.stringify(response4.data.data.transforms, null, 2)}`);
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response4.data);
    }
  } catch (error) {
    console.log('❌ ERREUR récupération:', error.response?.data || error.message);
  }

  console.log('\n🎯 Tests terminés');
  console.log('✅ Si aucune erreur de contrainte unique n\'est apparue, le fix fonctionne!');
}

// Exécuter les tests
testDesignTransforms().catch(console.error); 