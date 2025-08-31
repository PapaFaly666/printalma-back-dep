const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Variables globales
let adminToken = null;
let vendorToken = null;
let adminId = null;
let vendorId = null;
let designId = null;
let productId = null;

/**
 * 🔐 Connexion Admin
 */
async function loginAdmin() {
  try {
    console.log('🔐 Connexion Admin...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@printalma.com',
      password: 'Admin123!'
    });

    if (response.data.success) {
      adminToken = response.data.data.token;
      adminId = response.data.data.user.id;
      console.log(`✅ Admin connecté: ${response.data.data.user.email} (ID: ${adminId})`);
      return true;
    } else {
      console.log('❌ Erreur connexion admin:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur connexion admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 🔐 Connexion Vendeur
 */
async function loginVendor() {
  try {
    console.log('🔐 Connexion Vendeur...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'Vendeur123!'
    });

    if (response.data.success) {
      vendorToken = response.data.data.token;
      vendorId = response.data.data.user.id;
      console.log(`✅ Vendeur connecté: ${response.data.data.user.email} (ID: ${vendorId})`);
      return true;
    } else {
      console.log('❌ Erreur connexion vendeur:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur connexion vendeur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 🎨 Créer un design test
 */
async function createTestDesign() {
  try {
    console.log('🎨 Création d\'un design test...');

    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');

    // Créer un fichier image factice
    const testImagePath = path.join(__dirname, 'test-design-image.png');
    if (!fs.existsSync(testImagePath)) {
      // Créer un fichier PNG minimal
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath));
    form.append('name', 'Design Test Cascade V2');
    form.append('description', 'Design pour tester la cascade validation V2');
    form.append('price', '2500');
    form.append('category', 'logo');
    form.append('tags', 'test,cascade,validation');

    const response = await axios.post(`${API_URL}/designs`, form, {
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        ...form.getHeaders()
      }
    });

    if (response.data.success) {
      designId = response.data.data.id;
      console.log(`✅ Design créé: ${response.data.data.name} (ID: ${designId})`);
      console.log(`   URL: ${response.data.data.imageUrl}`);
      return response.data.data;
    } else {
      console.log('❌ Erreur création design:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur création design:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 📦 Créer un produit vendeur avec le design
 */
async function createVendorProduct(design) {
  try {
    console.log('📦 Création d\'un produit vendeur...');

    const productData = {
      baseProductId: 1, // ID du produit de base (supposé exister)
      name: 'T-Shirt Test Cascade V2',
      description: 'Produit pour tester la cascade validation V2',
      price: 3500,
      stock: 10,
      sizes: [1, 2, 3], // IDs des tailles
      colors: [1, 2], // IDs des couleurs
      designCloudinaryUrl: design.imageUrl,
      designId: design.id, // 🆕 Nouvelle liaison directe
      postValidationAction: 'AUTO_PUBLISH', // Test auto-publication
      vendorName: 'T-Shirt Test Cascade V2',
      vendorDescription: 'Produit pour tester la cascade validation V2',
      vendorStock: 10
    };

    const response = await axios.post(`${API_URL}/vendor/products`, productData, {
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      productId = response.data.data.id;
      console.log(`✅ Produit créé: ${response.data.data.name} (ID: ${productId})`);
      console.log(`   Status: ${response.data.data.status}`);
      console.log(`   isValidated: ${response.data.data.isValidated}`);
      console.log(`   postValidationAction: ${response.data.data.postValidationAction}`);
      return response.data.data;
    } else {
      console.log('❌ Erreur création produit:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur création produit:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 🔗 Vérifier les liens design-produit
 */
async function checkDesignProductLinks() {
  try {
    console.log('🔗 Vérification des liens design-produit...');

    // Statistiques des liens
    const statsResponse = await axios.get(`${API_URL}/designs/admin/links/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log(`📊 Statistiques des liens:`);
      console.log(`   - Total liens: ${stats.totalLinks}`);
      console.log(`   - Designs uniques: ${stats.uniqueDesigns}`);
      console.log(`   - Produits uniques: ${stats.uniqueProducts}`);
      console.log(`   - Produits avec designId: ${stats.productsWithDesignId}`);
      console.log(`   - Produits avec URL seulement: ${stats.productsWithUrlOnly}`);
    }

    // Produits liés au design
    const productsResponse = await axios.get(`${API_URL}/designs/${designId}/products`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (productsResponse.data.success) {
      const products = productsResponse.data.data.products;
      console.log(`🔗 Produits liés au design ${designId}: ${products.length}`);
      products.forEach(product => {
        console.log(`   - Produit ${product.id}: ${product.name} (${product.status})`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur vérification liens:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 🔧 Migrer les liens si nécessaire
 */
async function migrateLinksIfNeeded() {
  try {
    console.log('🔧 Migration des liens si nécessaire...');

    const response = await axios.post(`${API_URL}/designs/admin/links/migrate`, {}, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.data.success) {
      console.log(`✅ Migration terminée: ${response.data.message}`);
      console.log(`   - Créés: ${response.data.data.created}`);
      console.log(`   - Erreurs: ${response.data.data.errors}`);
      return true;
    } else {
      console.log('❌ Erreur migration:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur migration:', error.response?.data || error.message);
    return false;
  }
}

/**
 * ✅ Validation du design par l'admin
 */
async function validateDesign() {
  try {
    console.log('✅ Validation du design par l\'admin...');

    const response = await axios.put(`${API_URL}/designs/admin/${designId}/validate`, {
      action: 'VALIDATE'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (response.data.success) {
      console.log(`✅ Design validé avec succès: ${response.data.data.name}`);
      console.log(`   isValidated: ${response.data.data.isValidated}`);
      console.log(`   validatedAt: ${response.data.data.validatedAt}`);
      return true;
    } else {
      console.log('❌ Erreur validation design:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur validation design:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 🔍 Vérifier l'état du produit après cascade
 */
async function checkProductAfterCascade() {
  try {
    console.log('🔍 Vérification de l\'état du produit après cascade...');

    // Attendre un peu pour la cascade
    await new Promise(resolve => setTimeout(resolve, 2000));

    const response = await axios.get(`${API_URL}/vendor/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });

    if (response.data.success) {
      const product = response.data.data;
      console.log(`📦 État du produit après cascade:`);
      console.log(`   - ID: ${product.id}`);
      console.log(`   - Nom: ${product.name}`);
      console.log(`   - Status: ${product.status}`);
      console.log(`   - isValidated: ${product.isValidated}`);
      console.log(`   - validatedAt: ${product.validatedAt}`);
      console.log(`   - postValidationAction: ${product.postValidationAction}`);

      // Vérifier que la cascade a fonctionné
      if (product.isValidated && product.status === 'PUBLISHED') {
        console.log('🎉 CASCADE VALIDATION V2 RÉUSSIE !');
        console.log('   ✅ isValidated = true');
        console.log('   ✅ status = PUBLISHED (auto-publication)');
        return true;
      } else {
        console.log('❌ CASCADE VALIDATION V2 ÉCHOUÉE !');
        console.log(`   ❌ isValidated = ${product.isValidated} (attendu: true)`);
        console.log(`   ❌ status = ${product.status} (attendu: PUBLISHED)`);
        return false;
      }
    } else {
      console.log('❌ Erreur récupération produit:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur vérification produit:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 🧪 Test principal
 */
async function runTest() {
  console.log('🧪 === TEST CASCADE VALIDATION V2 ===');
  console.log('');

  try {
    // 1. Connexions
    const adminConnected = await loginAdmin();
    const vendorConnected = await loginVendor();

    if (!adminConnected || !vendorConnected) {
      console.log('❌ Impossible de se connecter');
      return;
    }

    console.log('');

    // 2. Créer un design
    const design = await createTestDesign();
    if (!design) {
      console.log('❌ Impossible de créer le design');
      return;
    }

    console.log('');

    // 3. Créer un produit avec le design
    const product = await createVendorProduct(design);
    if (!product) {
      console.log('❌ Impossible de créer le produit');
      return;
    }

    console.log('');

    // 4. Vérifier les liens
    await checkDesignProductLinks();

    console.log('');

    // 5. Migrer les liens si nécessaire
    await migrateLinksIfNeeded();

    console.log('');

    // 6. Vérifier à nouveau les liens
    await checkDesignProductLinks();

    console.log('');

    // 7. Valider le design (déclenche la cascade)
    const validated = await validateDesign();
    if (!validated) {
      console.log('❌ Impossible de valider le design');
      return;
    }

    console.log('');

    // 8. Vérifier l'état du produit après cascade
    const cascadeSuccess = await checkProductAfterCascade();

    console.log('');
    console.log('🎯 === RÉSUMÉ DU TEST ===');
    if (cascadeSuccess) {
      console.log('🎉 TEST RÉUSSI : Le système cascade validation V2 fonctionne !');
      console.log('✅ La liaison design-produit est opérationnelle');
      console.log('✅ La validation admin déclenche bien la cascade');
      console.log('✅ Le produit est automatiquement publié');
    } else {
      console.log('❌ TEST ÉCHOUÉ : Le système cascade validation V2 ne fonctionne pas');
      console.log('❌ Vérifiez les logs du backend pour plus de détails');
    }

  } catch (error) {
    console.error('❌ Erreur globale du test:', error);
  }
}

// Lancer le test
runTest(); 