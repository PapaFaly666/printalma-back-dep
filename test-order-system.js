const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';
let adminToken = '';
let orderId = null;

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour se connecter en tant qu'utilisateur
async function loginAsUser() {
  try {
    log('\n=== CONNEXION UTILISATEUR ===', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'vendeur@test.com', // Remplacez par un email d'utilisateur existant
      password: 'password123'
    });
    
    authToken = response.data.access_token || response.headers['set-cookie']?.[0]?.split(';')[0]?.split('=')[1];
    log('✓ Connexion utilisateur réussie', 'green');
    return true;
  } catch (error) {
    log(`✗ Erreur de connexion utilisateur: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Fonction pour se connecter en tant qu'admin
async function loginAsAdmin() {
  try {
    log('\n=== CONNEXION ADMIN ===', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com', // Remplacez par un email d'admin existant
      password: 'admin123'
    });
    
    adminToken = response.data.access_token || response.headers['set-cookie']?.[0]?.split(';')[0]?.split('=')[1];
    log('✓ Connexion admin réussie', 'green');
    return true;
  } catch (error) {
    log(`✗ Erreur de connexion admin: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test de création de commande
async function testCreateOrder() {
  try {
    log('\n=== TEST CRÉATION DE COMMANDE ===', 'blue');
    
    const orderData = {
      shippingAddress: "123 Rue de la Paix, 75001 Paris",
      phoneNumber: "+33123456789",
      notes: "Livraison en matinée de préférence",
      orderItems: [
        {
          productId: 1, // Assurez-vous qu'un produit avec cet ID existe
          quantity: 2,
          size: "M",
          color: "Bleu"
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      orderId = response.data.data.id;
      log(`✓ Commande créée avec succès - ID: ${orderId}`, 'green');
      log(`  Numéro de commande: ${response.data.data.orderNumber}`, 'yellow');
      log(`  Montant total: ${response.data.data.totalAmount}€`, 'yellow');
      return true;
    } else {
      log('✗ Échec de création de commande', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur création commande: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test de récupération des commandes utilisateur
async function testGetUserOrders() {
  try {
    log('\n=== TEST RÉCUPÉRATION COMMANDES UTILISATEUR ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log(`✓ Commandes récupérées: ${response.data.data.length} commande(s)`, 'green');
      response.data.data.forEach((order, index) => {
        log(`  ${index + 1}. ${order.orderNumber} - ${order.status} - ${order.totalAmount}€`, 'yellow');
      });
      return true;
    } else {
      log('✗ Échec récupération commandes', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur récupération commandes: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test de récupération d'une commande spécifique
async function testGetOrderById() {
  if (!orderId) {
    log('✗ Aucun ID de commande disponible pour le test', 'red');
    return false;
  }

  try {
    log('\n=== TEST RÉCUPÉRATION COMMANDE SPÉCIFIQUE ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const order = response.data.data;
      log(`✓ Commande récupérée: ${order.orderNumber}`, 'green');
      log(`  Statut: ${order.status}`, 'yellow');
      log(`  Articles: ${order.orderItems.length}`, 'yellow');
      return true;
    } else {
      log('✗ Échec récupération commande', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur récupération commande: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test de mise à jour du statut par l'admin
async function testUpdateOrderStatus() {
  if (!orderId) {
    log('✗ Aucun ID de commande disponible pour le test', 'red');
    return false;
  }

  try {
    log('\n=== TEST MISE À JOUR STATUT (ADMIN) ===', 'blue');
    
    const updateData = {
      status: 'CONFIRMED',
      notes: 'Commande validée et en cours de préparation'
    };

    const response = await axios.patch(`${BASE_URL}/orders/${orderId}/status`, updateData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log(`✓ Statut mis à jour: ${response.data.data.status}`, 'green');
      log(`  Validé par: ${response.data.data.validatorName}`, 'yellow');
      return true;
    } else {
      log('✗ Échec mise à jour statut', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur mise à jour statut: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test de récupération de toutes les commandes (admin)
async function testGetAllOrders() {
  try {
    log('\n=== TEST RÉCUPÉRATION TOUTES COMMANDES (ADMIN) ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/orders/admin/all?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.data.success) {
      const { orders, total, page, totalPages } = response.data.data;
      log(`✓ Commandes récupérées: ${orders.length}/${total}`, 'green');
      log(`  Page: ${page}/${totalPages}`, 'yellow');
      orders.forEach((order, index) => {
        log(`  ${index + 1}. ${order.orderNumber} - ${order.userEmail} - ${order.status}`, 'yellow');
      });
      return true;
    } else {
      log('✗ Échec récupération toutes commandes', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur récupération toutes commandes: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Test d'annulation de commande
async function testCancelOrder() {
  try {
    log('\n=== TEST CRÉATION COMMANDE POUR ANNULATION ===', 'blue');
    
    // Créer une nouvelle commande pour l'annuler
    const orderData = {
      shippingAddress: "456 Avenue des Tests, 75002 Paris",
      phoneNumber: "+33987654321",
      notes: "Commande de test pour annulation",
      orderItems: [
        {
          productId: 1,
          quantity: 1,
          size: "L"
        }
      ]
    };

    const createResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!createResponse.data.success) {
      log('✗ Échec création commande pour test annulation', 'red');
      return false;
    }

    const cancelOrderId = createResponse.data.data.id;
    log(`✓ Commande créée pour test annulation - ID: ${cancelOrderId}`, 'green');

    // Maintenant annuler la commande
    log('\n=== TEST ANNULATION COMMANDE ===', 'blue');
    
    const cancelResponse = await axios.delete(`${BASE_URL}/orders/${cancelOrderId}/cancel`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (cancelResponse.data.success) {
      log(`✓ Commande annulée: ${cancelResponse.data.data.status}`, 'green');
      return true;
    } else {
      log('✗ Échec annulation commande', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Erreur annulation commande: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// Fonction principale de test
async function runTests() {
  log('🚀 DÉBUT DES TESTS DU SYSTÈME DE COMMANDES', 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Tests utilisateur
  if (await loginAsUser()) {
    const userTests = [
      testCreateOrder,
      testGetUserOrders,
      testGetOrderById,
      testCancelOrder
    ];

    for (const test of userTests) {
      results.total++;
      if (await test()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }

  // Tests admin
  if (await loginAsAdmin()) {
    const adminTests = [
      testUpdateOrderStatus,
      testGetAllOrders
    ];

    for (const test of adminTests) {
      results.total++;
      if (await test()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }

  // Résultats finaux
  log('\n' + '='.repeat(50), 'blue');
  log('📊 RÉSULTATS DES TESTS', 'blue');
  log(`Total: ${results.total}`, 'yellow');
  log(`Réussis: ${results.passed}`, 'green');
  log(`Échoués: ${results.failed}`, 'red');
  log(`Taux de réussite: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'yellow');
  log('='.repeat(50), 'blue');

  if (results.failed === 0) {
    log('🎉 TOUS LES TESTS SONT PASSÉS !', 'green');
  } else {
    log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ', 'red');
  }
}

// Exécuter les tests
runTests().catch(error => {
  log(`Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
}); 