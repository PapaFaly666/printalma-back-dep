/**
 * 🧪 TEST - Isolation des positions de design par produit
 * 
 * Ce script teste le système d'isolation des positions pour s'assurer
 * qu'un design utilisé dans plusieurs produits conserve ses positions
 * indépendamment.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Configuration de test
const TEST_CONFIG = {
  vendor: {
    email: 'test@example.com',
    password: 'password123'
  },
  design: {
    name: 'Test Design Isolation',
    imageUrl: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-design.png'
  },
  products: [
    { id: 1, name: 'T-Shirt' },
    { id: 2, name: 'Mug' }
  ],
  positions: [
    { x: 120, y: 80, scale: 0.8, rotation: 0 },
    { x: 30, y: 220, scale: 1.2, rotation: 45 }
  ]
};

let authToken = null;
let vendorId = null;
let designId = null;
let vendorProductIds = [];

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

async function login() {
  console.log('🔐 Connexion vendeur...');
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.vendor.email,
      password: TEST_CONFIG.vendor.password
    });
    
    authToken = response.token;
    vendorId = response.user.id;
    
    console.log(`✅ Connexion réussie: vendorId=${vendorId}`);
  } catch (error) {
    console.log('⚠️ Connexion échouée, tentative de création du vendeur...');
    
    // Créer le vendeur si il n'existe pas
    await makeRequest('POST', '/api/auth/register', {
      email: TEST_CONFIG.vendor.email,
      password: TEST_CONFIG.vendor.password,
      name: 'Test Vendor',
      role: 'VENDOR'
    });
    
    // Retry login
    const response = await makeRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.vendor.email,
      password: TEST_CONFIG.vendor.password
    });
    
    authToken = response.token;
    vendorId = response.user.id;
    
    console.log(`✅ Vendeur créé et connecté: vendorId=${vendorId}`);
  }
}

async function createDesign() {
  console.log('🎨 Création du design de test...');
  
  try {
    const response = await makeRequest('POST', '/api/designs', {
      name: TEST_CONFIG.design.name,
      imageUrl: TEST_CONFIG.design.imageUrl,
      category: 'LOGO',
      isPublic: false
    });
    
    designId = response.id;
    console.log(`✅ Design créé: designId=${designId}`);
  } catch (error) {
    console.log('⚠️ Erreur création design, recherche design existant...');
    
    // Chercher design existant
    const designs = await makeRequest('GET', '/api/designs/my-designs');
    const existingDesign = designs.find(d => d.name === TEST_CONFIG.design.name);
    
    if (existingDesign) {
      designId = existingDesign.id;
      console.log(`✅ Design existant trouvé: designId=${designId}`);
    } else {
      throw error;
    }
  }
}

async function createVendorProducts() {
  console.log('📦 Création des produits vendeur...');
  
  for (let i = 0; i < TEST_CONFIG.products.length; i++) {
    const product = TEST_CONFIG.products[i];
    
    try {
      const response = await makeRequest('POST', '/api/vendor-products', {
        baseProductId: product.id,
        name: `Test ${product.name}`,
        description: 'Produit de test pour isolation positions',
        price: 25.99,
        stock: 100,
        sizes: ['S', 'M', 'L'],
        colors: ['red', 'blue']
      });
      
      vendorProductIds.push(response.id);
      console.log(`✅ Produit créé: ${product.name} → vendorProductId=${response.id}`);
    } catch (error) {
      console.log(`⚠️ Erreur création produit ${product.name}:`, error.response?.data || error.message);
    }
  }
}

async function testPositionIsolation() {
  console.log('\n🧪 TEST: Isolation des positions');
  console.log('='.repeat(50));
  
  const [productId1, productId2] = vendorProductIds;
  const [position1, position2] = TEST_CONFIG.positions;
  
  // 1. Sauvegarder position pour produit 1
  console.log(`\n1️⃣ Sauvegarde position pour Produit ${productId1}`);
  console.log(`   Position: x=${position1.x}, y=${position1.y}, scale=${position1.scale}`);
  
  await makeRequest('PUT', `/api/vendor-products/${productId1}/designs/${designId}/position/direct`, position1);
  console.log('✅ Position sauvegardée pour Produit 1');
  
  // 2. Sauvegarder position pour produit 2
  console.log(`\n2️⃣ Sauvegarde position pour Produit ${productId2}`);
  console.log(`   Position: x=${position2.x}, y=${position2.y}, scale=${position2.scale}`);
  
  await makeRequest('PUT', `/api/vendor-products/${productId2}/designs/${designId}/position/direct`, position2);
  console.log('✅ Position sauvegardée pour Produit 2');
  
  // 3. Vérifier isolation - récupérer position produit 1
  console.log(`\n3️⃣ Vérification isolation - Produit ${productId1}`);
  
  const retrievedPosition1 = await makeRequest('GET', `/api/vendor-products/${productId1}/designs/${designId}/position/direct`);
  const pos1 = retrievedPosition1.data.position;
  
  console.log(`   Position récupérée: x=${pos1.x}, y=${pos1.y}, scale=${pos1.scale}`);
  
  // 4. Vérifier isolation - récupérer position produit 2
  console.log(`\n4️⃣ Vérification isolation - Produit ${productId2}`);
  
  const retrievedPosition2 = await makeRequest('GET', `/api/vendor-products/${productId2}/designs/${designId}/position/direct`);
  const pos2 = retrievedPosition2.data.position;
  
  console.log(`   Position récupérée: x=${pos2.x}, y=${pos2.y}, scale=${pos2.scale}`);
  
  // 5. Vérification des résultats
  console.log('\n🔍 RÉSULTATS DU TEST:');
  console.log('='.repeat(30));
  
  const pos1Match = pos1.x === position1.x && pos1.y === position1.y && pos1.scale === position1.scale;
  const pos2Match = pos2.x === position2.x && pos2.y === position2.y && pos2.scale === position2.scale;
  
  console.log(`Produit 1 - Position préservée: ${pos1Match ? '✅ OUI' : '❌ NON'}`);
  console.log(`Produit 2 - Position préservée: ${pos2Match ? '✅ OUI' : '❌ NON'}`);
  
  if (pos1Match && pos2Match) {
    console.log('\n🎉 TEST RÉUSSI: Isolation des positions fonctionne parfaitement !');
    console.log('   Chaque produit conserve sa position indépendamment.');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ: Problème d\'isolation des positions');
    console.log('   Positions attendues vs récupérées:');
    console.log(`   Produit 1: attendu=${JSON.stringify(position1)}, reçu=${JSON.stringify(pos1)}`);
    console.log(`   Produit 2: attendu=${JSON.stringify(position2)}, reçu=${JSON.stringify(pos2)}`);
  }
  
  return pos1Match && pos2Match;
}

async function testWorkflowIntegration() {
  console.log('\n🔄 TEST: Intégration avec workflow existant');
  console.log('='.repeat(50));
  
  const [productId1] = vendorProductIds;
  const testPosition = { x: 200, y: 150, scale: 1.5, rotation: 30 };
  
  // 1. Sauvegarder via l'API transforms (workflow existant)
  console.log('\n1️⃣ Sauvegarde via API transforms (workflow existant)');
  
  const transformData = {
    productId: productId1,
    designUrl: TEST_CONFIG.design.imageUrl,
    transforms: {
      positioning: testPosition,
      otherData: 'test'
    },
    lastModified: new Date().toISOString()
  };
  
  await makeRequest('POST', '/api/vendor/design-transforms/save', transformData);
  console.log('✅ Sauvegarde via transforms réussie');
  
  // 2. Vérifier que la position est bien isolée
  console.log('\n2️⃣ Vérification via API position directe');
  
  const retrievedPosition = await makeRequest('GET', `/api/vendor-products/${productId1}/designs/${designId}/position/direct`);
  const pos = retrievedPosition.data.position;
  
  console.log(`   Position récupérée: x=${pos.x}, y=${pos.y}, scale=${pos.scale}`);
  
  // 3. Vérifier correspondance
  const match = pos.x === testPosition.x && pos.y === testPosition.y && pos.scale === testPosition.scale;
  
  console.log(`\n🔍 RÉSULTAT: Intégration workflow ${match ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE'}`);
  
  if (match) {
    console.log('   L\'API transforms sauvegarde correctement dans ProductDesignPosition');
  } else {
    console.log(`   Attendu: ${JSON.stringify(testPosition)}`);
    console.log(`   Reçu: ${JSON.stringify(pos)}`);
  }
  
  return match;
}

async function cleanup() {
  console.log('\n🧹 Nettoyage...');
  
  // Supprimer les positions de test
  for (const productId of vendorProductIds) {
    try {
      await makeRequest('DELETE', `/api/vendor-products/${productId}/designs/${designId}/position`);
      console.log(`✅ Position supprimée pour produit ${productId}`);
    } catch (error) {
      console.log(`⚠️ Erreur suppression position produit ${productId}:`, error.response?.data || error.message);
    }
  }
  
  console.log('✅ Nettoyage terminé');
}

async function runTests() {
  console.log('🚀 DÉMARRAGE DES TESTS - Isolation des positions de design');
  console.log('='.repeat(60));
  
  try {
    await login();
    await createDesign();
    await createVendorProducts();
    
    const isolationTest = await testPositionIsolation();
    const workflowTest = await testWorkflowIntegration();
    
    await cleanup();
    
    console.log('\n📊 RÉSUMÉ FINAL:');
    console.log('='.repeat(30));
    console.log(`Isolation des positions: ${isolationTest ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
    console.log(`Intégration workflow: ${workflowTest ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
    
    if (isolationTest && workflowTest) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
      console.log('   Le système d\'isolation des positions fonctionne parfaitement.');
      console.log('   Vous pouvez maintenant utiliser le frontend en toute confiance.');
    } else {
      console.log('\n❌ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('   Vérifiez la configuration du backend avant d\'utiliser le frontend.');
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR CRITIQUE LORS DES TESTS:', error.message);
    console.error('   Vérifiez que le serveur backend est démarré sur le port 3000');
  }
}

// Lancer les tests
runTests(); 
 
 
 
 