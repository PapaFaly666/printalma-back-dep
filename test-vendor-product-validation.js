const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Configuration de test
const testConfig = {
  baseProductId: 1,
  designId: 2, // Supposons qu'un design existe
  vendorPrice: 25000,
  vendorStock: 100,
  selectedColors: [{ id: 1, name: 'Black', colorCode: '#000000' }],
  selectedSizes: [{ id: 1, sizeName: 'M' }],
  productStructure: {
    adminProduct: {
      id: 1,
      name: 'T-shirt Basic',
      description: 'T-shirt en coton',
      price: 19000,
      images: { colorVariations: [] },
      sizes: [{ id: 1, sizeName: 'M' }]
    },
    designApplication: {
      positioning: 'CENTER',
      scale: 0.6
    }
  }
};

async function testProductValidation() {
  console.log('🧪 Test de validation des produits vendeur\n');

  // Test 1: Nom auto-généré (doit échouer)
  console.log('📝 Test 1: Nom auto-généré');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'Produit auto-généré pour positionnage design',
      vendorDescription: 'Description normale'
    }, {
      withCredentials: true
    });
    console.log('❌ ÉCHEC: Devrait rejeter le nom auto-généré');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ SUCCÈS: Nom auto-généré rejeté');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('❌ ERREUR inattendue:', error.response?.data || error.message);
    }
  }

  // Test 2: Nom trop court (doit échouer)
  console.log('\n📝 Test 2: Nom trop court');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'Ab',
      vendorDescription: 'Description normale'
    }, {
      withCredentials: true
    });
    console.log('❌ ÉCHEC: Devrait rejeter le nom trop court');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ SUCCÈS: Nom trop court rejeté');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('❌ ERREUR inattendue:', error.response?.data || error.message);
    }
  }

  // Test 3: Description auto-générée (doit échouer)
  console.log('\n📝 Test 3: Description auto-générée');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'T-shirt Dragon Mystique',
      vendorDescription: 'Produit auto-généré pour positionnage design'
    }, {
      withCredentials: true
    });
    console.log('❌ ÉCHEC: Devrait rejeter la description auto-générée');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ SUCCÈS: Description auto-générée rejetée');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('❌ ERREUR inattendue:', error.response?.data || error.message);
    }
  }

  // Test 4: Nom générique "Test" (doit échouer)
  console.log('\n📝 Test 4: Nom générique "Test"');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'Test',
      vendorDescription: 'Description normale'
    }, {
      withCredentials: true
    });
    console.log('❌ ÉCHEC: Devrait rejeter le nom "Test"');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ SUCCÈS: Nom "Test" rejeté');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('❌ ERREUR inattendue:', error.response?.data || error.message);
    }
  }

  // Test 5: Nom valide (doit réussir)
  console.log('\n📝 Test 5: Nom valide');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'T-shirt Dragon Mystique Premium',
      vendorDescription: 'T-shirt premium avec design dragon exclusif'
    }, {
      withCredentials: true
    });
    
    if (response.data.success) {
      console.log('✅ SUCCÈS: Produit créé avec nom valide');
      console.log(`   Produit ID: ${response.data.productId}`);
      console.log(`   Message: ${response.data.message}`);
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('déjà existant')) {
      console.log('✅ SUCCÈS: Validation passée (produit déjà existant)');
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log('❌ ERREUR:', error.response?.data || error.message);
    }
  }

  // Test 6: Description vide (doit réussir)
  console.log('\n📝 Test 6: Description vide');
  try {
    const response = await axios.post(`${API_BASE}/vendor/products`, {
      ...testConfig,
      vendorName: 'T-shirt Dragon Mystique Édition Limitée',
      vendorDescription: ''
    }, {
      withCredentials: true
    });
    
    if (response.data.success) {
      console.log('✅ SUCCÈS: Produit créé avec description vide');
    } else {
      console.log('❌ ÉCHEC: Réponse inattendue:', response.data);
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('déjà existant')) {
      console.log('✅ SUCCÈS: Validation passée (produit déjà existant)');
    } else {
      console.log('❌ ERREUR:', error.response?.data || error.message);
    }
  }

  console.log('\n🎯 Tests terminés');
}

// Exécuter les tests
testProductValidation().catch(console.error); 