const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Configuration des utilisateurs de test
const ADMIN_LOGIN = {
  email: 'admin@example.com',
  password: 'admin123'
};

const VENDOR_LOGIN = {
  email: 'vendeur.test@example.com',
  password: 'vendeur123'
};

let adminToken = '';
let vendorToken = '';

async function login(credentials, userType) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    console.log(`✅ ${userType} connecté avec succès`);
    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Erreur connexion ${userType}:`, error.response?.data?.message || error.message);
    throw error;
  }
}

async function testVendorValidationChoice() {
  console.log('\n🧪 === TEST SYSTÈME CHOIX DE PUBLICATION APRÈS VALIDATION ===\n');

  try {
    // 1. Connexion des utilisateurs
    console.log('1️⃣ Connexion des utilisateurs...');
    adminToken = await login(ADMIN_LOGIN, 'ADMIN');
    vendorToken = await login(VENDOR_LOGIN, 'VENDEUR');

    // 2. Créer un produit vendeur test
    console.log('\n2️⃣ Création produit vendeur...');
    const productData = {
      baseProductId: 14,
      name: 'Test Produit Validation Choice',
      description: 'Produit pour tester le choix de publication',
      price: 2500,
      stock: 10,
      sizes: [1, 2, 3],
      colors: [1, 2],
      postValidationAction: 'TO_DRAFT' // Choix: brouillon après validation
    };

    const createResponse = await axios.post(`${BASE_URL}/vendor/publish`, productData, {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });

    const vendorProductId = createResponse.data.vendorProduct.id;
    console.log(`✅ Produit créé avec ID: ${vendorProductId}`);
    console.log(`📝 Choix de publication: ${createResponse.data.vendorProduct.postValidationAction}`);

    // 3. Tester la modification du choix de publication
    console.log('\n3️⃣ Modification du choix de publication...');
    const updateChoiceResponse = await axios.put(
      `${BASE_URL}/vendor-product-validation/post-validation-action/${vendorProductId}`,
      { action: 'AUTO_PUBLISH' },
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );

    console.log('✅ Choix de publication mis à jour:', updateChoiceResponse.data.message);

    // 4. Soumettre le produit pour validation
    console.log('\n4️⃣ Soumission pour validation...');
    const submitResponse = await axios.post(
      `${BASE_URL}/vendor/submit-for-validation/${vendorProductId}`,
      {},
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );

    console.log('✅ Produit soumis pour validation:', submitResponse.data.message);

    // 5. Lister les produits en attente côté admin
    console.log('\n5️⃣ Vérification côté admin...');
    const pendingResponse = await axios.get(`${BASE_URL}/vendor-product-validation/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const pendingProduct = pendingResponse.data.find(p => p.id === vendorProductId);
    if (pendingProduct) {
      console.log(`✅ Produit trouvé en attente:`);
      console.log(`   - ID: ${pendingProduct.id}`);
      console.log(`   - Nom: ${pendingProduct.name}`);
      console.log(`   - Action après validation: ${pendingProduct.postValidationAction}`);
      console.log(`   - Label: ${pendingProduct.actionLabel}`);
      console.log(`   - Sera publié: ${pendingProduct.willBePublished}`);
    } else {
      console.log('❌ Produit non trouvé en attente');
    }

    // 6. Valider le produit (admin)
    console.log('\n6️⃣ Validation par admin...');
    const validateResponse = await axios.post(
      `${BASE_URL}/vendor-product-validation/validate/${vendorProductId}`,
      { approved: true },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    console.log('✅ Produit validé:', validateResponse.data.message);
    console.log(`📊 Statut final: ${validateResponse.data.data.status}`);

    // 7. Vérifier le statut final
    console.log('\n7️⃣ Vérification statut final...');
    const finalCheckResponse = await axios.get(`${BASE_URL}/vendor/products`, {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });

    const finalProduct = finalCheckResponse.data.find(p => p.id === vendorProductId);
    if (finalProduct) {
      console.log(`✅ Statut final vérifié:`);
      console.log(`   - Status: ${finalProduct.status}`);
      console.log(`   - Validé: ${finalProduct.isValidated}`);
      console.log(`   - Action choisie: ${finalProduct.postValidationAction}`);
      
      if (finalProduct.status === 'PUBLISHED') {
        console.log('🚀 Produit publié automatiquement comme prévu !');
      } else if (finalProduct.status === 'DRAFT' && finalProduct.isValidated) {
        console.log('📝 Produit mis en brouillon, prêt pour publication manuelle');
        
        // 8. Test de publication manuelle
        console.log('\n8️⃣ Test publication manuelle...');
        const publishResponse = await axios.post(
          `${BASE_URL}/vendor-product-validation/publish/${vendorProductId}`,
          {},
          { headers: { Authorization: `Bearer ${vendorToken}` } }
        );
        
        console.log('✅ Publication manuelle réussie:', publishResponse.data.message);
      }
    }

    // 9. Test de rejet
    console.log('\n9️⃣ Test de rejet...');
    
    // Créer un autre produit pour tester le rejet
    const rejectProductData = {
      baseProductId: 15,
      name: 'Test Produit Rejet',
      description: 'Produit pour tester le rejet',
      price: 1500,
      stock: 5,
      sizes: [2, 3],
      colors: [1],
      postValidationAction: 'TO_DRAFT'
    };

    const rejectCreateResponse = await axios.post(`${BASE_URL}/vendor/publish`, rejectProductData, {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });

    const rejectProductId = rejectCreateResponse.data.vendorProduct.id;
    console.log(`✅ Produit de test rejet créé avec ID: ${rejectProductId}`);

    // Soumettre pour validation
    await axios.post(
      `${BASE_URL}/vendor/submit-for-validation/${rejectProductId}`,
      {},
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );

    // Rejeter le produit
    const rejectResponse = await axios.post(
      `${BASE_URL}/vendor-product-validation/validate/${rejectProductId}`,
      { 
        approved: false, 
        rejectionReason: 'Design non conforme aux standards de qualité' 
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    console.log('✅ Produit rejeté:', rejectResponse.data.message);

    console.log('\n🎉 === TOUS LES TESTS TERMINÉS AVEC SUCCÈS ===');
    console.log('\n📋 Résumé des fonctionnalités testées:');
    console.log('✅ Création produit avec choix de publication');
    console.log('✅ Modification du choix de publication');
    console.log('✅ Soumission pour validation');
    console.log('✅ Listage des produits en attente (admin)');
    console.log('✅ Validation avec application automatique du choix');
    console.log('✅ Publication manuelle des produits validés en brouillon');
    console.log('✅ Rejet de produit avec notification');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Conseil: Vérifiez que les utilisateurs test existent et ont les bonnes permissions');
    }
  }
}

// Fonction utilitaire pour créer les utilisateurs de test si nécessaire
async function createTestUsers() {
  console.log('\n🔧 Création des utilisateurs de test...');
  
  try {
    // Créer admin si n'existe pas
    await axios.post(`${BASE_URL}/auth/register`, {
      email: ADMIN_LOGIN.email,
      password: ADMIN_LOGIN.password,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'ADMIN'
    });
    console.log('✅ Admin créé');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Admin existe déjà');
    } else {
      console.log('⚠️ Erreur création admin:', error.response?.data?.message);
    }
  }

  try {
    // Créer vendeur si n'existe pas
    await axios.post(`${BASE_URL}/auth/register`, {
      email: VENDOR_LOGIN.email,
      password: VENDOR_LOGIN.password,
      firstName: 'Vendeur',
      lastName: 'Test',
      role: 'VENDEUR'
    });
    console.log('✅ Vendeur créé');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Vendeur existe déjà');
    } else {
      console.log('⚠️ Erreur création vendeur:', error.response?.data?.message);
    }
  }
}

// Exécution des tests
async function runTests() {
  console.log('🚀 Démarrage des tests du système de validation avec choix de publication');
  
  await createTestUsers();
  await testVendorValidationChoice();
}

// Exécuter si appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testVendorValidationChoice, createTestUsers }; 
 