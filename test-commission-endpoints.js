/**
 * Script de test pour les endpoints de commission
 * Utilisation: node test-commission-endpoints.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Données de test
const ADMIN_CREDENTIALS = {
  email: 'admin@printalma.com', // À adapter selon votre config
  password: 'admin123' // À adapter selon votre config
};

const TEST_VENDOR_ID = 1; // ID d'un vendeur de test
const TEST_COMMISSION_RATE = 35.5;

/**
 * Authentification admin
 */
async function loginAsAdmin() {
  try {
    console.log('🔐 Connexion admin...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Connexion admin réussie');
      return true;
    } else {
      console.log('❌ Erreur: Token non reçu');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Obtenir toutes les commissions
 */
async function testGetAllCommissions() {
  try {
    console.log('\n📋 Test: Obtenir toutes les commissions...');
    
    const response = await axios.get(`${BASE_URL}/admin/vendors/commissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Réponse:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Obtenir commission d'un vendeur spécifique
 */
async function testGetVendorCommission(vendorId) {
  try {
    console.log(`\n👤 Test: Obtenir commission vendeur ${vendorId}...`);
    
    const response = await axios.get(`${BASE_URL}/admin/vendors/${vendorId}/commission`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Réponse:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Mettre à jour commission
 */
async function testUpdateCommission(vendorId, commissionRate) {
  try {
    console.log(`\n💰 Test: Mise à jour commission vendeur ${vendorId} -> ${commissionRate}%...`);
    
    const response = await axios.put(
      `${BASE_URL}/admin/vendors/${vendorId}/commission`,
      { commissionRate },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Réponse:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Obtenir statistiques
 */
async function testGetStats() {
  try {
    console.log('\n📊 Test: Obtenir statistiques des commissions...');
    
    const response = await axios.get(`${BASE_URL}/admin/commission-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Réponse:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Obtenir historique
 */
async function testGetHistory(vendorId) {
  try {
    console.log(`\n📜 Test: Obtenir historique vendeur ${vendorId}...`);
    
    const response = await axios.get(`${BASE_URL}/admin/vendors/${vendorId}/commission/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Réponse:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test: Validation des erreurs
 */
async function testValidationErrors() {
  console.log('\n⚠️  Test: Validation des erreurs...');
  
  // Test taux invalide (> 100)
  try {
    await axios.put(
      `${BASE_URL}/admin/vendors/${TEST_VENDOR_ID}/commission`,
      { commissionRate: 150 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Test échoué: taux > 100% accepté');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation taux > 100%: OK');
    } else {
      console.log('❌ Erreur inattendue:', error.response?.data);
    }
  }
  
  // Test taux invalide (< 0)
  try {
    await axios.put(
      `${BASE_URL}/admin/vendors/${TEST_VENDOR_ID}/commission`,
      { commissionRate: -10 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Test échoué: taux < 0% accepté');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation taux < 0%: OK');
    } else {
      console.log('❌ Erreur inattendue:', error.response?.data);
    }
  }
  
  // Test vendeur inexistant
  try {
    await axios.put(
      `${BASE_URL}/admin/vendors/99999/commission`,
      { commissionRate: 40 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Test échoué: vendeur inexistant accepté');
  } catch (error) {
    if (error.response?.status === 404 || error.response?.data?.error === 'VENDOR_NOT_FOUND') {
      console.log('✅ Validation vendeur inexistant: OK');
    } else {
      console.log('❌ Erreur inattendue:', error.response?.data);
    }
  }
}

/**
 * Tests de performance simple
 */
async function testPerformance() {
  console.log('\n⚡ Test: Performance simple...');
  
  const start = Date.now();
  
  // Test 10 requêtes parallèles
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${BASE_URL}/admin/vendors/commissions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
    );
  }
  
  try {
    await Promise.all(promises);
    const duration = Date.now() - start;
    console.log(`✅ 10 requêtes parallèles en ${duration}ms (moy: ${duration/10}ms)`);
  } catch (error) {
    console.log('❌ Erreur performance:', error.message);
  }
}

/**
 * Fonction principale
 */
async function runTests() {
  console.log('🚀 Démarrage des tests des endpoints Commission');
  console.log('================================================\n');
  
  // Connexion admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('❌ Tests interrompus: impossible de se connecter en admin');
    return;
  }
  
  // Tests principaux
  await testGetAllCommissions();
  await testGetVendorCommission(TEST_VENDOR_ID);
  await testUpdateCommission(TEST_VENDOR_ID, TEST_COMMISSION_RATE);
  await testGetVendorCommission(TEST_VENDOR_ID); // Vérifier la mise à jour
  await testGetStats();
  await testGetHistory(TEST_VENDOR_ID);
  
  // Tests de validation
  await testValidationErrors();
  
  // Test de performance
  await testPerformance();
  
  console.log('\n================================================');
  console.log('✅ Tests terminés!');
  
  // Petit résumé des endpoints testés
  console.log('\n📋 Endpoints testés:');
  console.log('  • GET /admin/vendors/commissions');
  console.log('  • GET /admin/vendors/:id/commission');  
  console.log('  • PUT /admin/vendors/:id/commission');
  console.log('  • GET /admin/commission-stats');
  console.log('  • GET /admin/vendors/:id/commission/history');
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Erreur non gérée:', reason);
  process.exit(1);
});

// Lancement des tests
runTests().catch(error => {
  console.log('❌ Erreur fatale:', error.message);
  process.exit(1);
});