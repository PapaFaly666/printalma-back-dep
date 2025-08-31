/**
 * Script de test pour les statistiques des commandes
 * 
 * UTILISATION:
 * node test-statistics.js
 */

const API_BASE_URL = 'http://localhost:3000';

// Configuration de test
const TEST_CONFIG = {
  adminEmail: 'admin@test.com',
  adminPassword: 'admin123',
  userEmail: 'user@test.com',
  userPassword: 'user123'
};

// Fonction utilitaire pour les appels API
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result.message || 'Erreur inconnue'}`);
    }

    return result;
  } catch (error) {
    console.error(`❌ Erreur API ${endpoint}:`, error.message);
    throw error;
  }
}

// Fonction de connexion
async function login(email, password) {
  console.log(`🔐 Connexion avec ${email}...`);
  
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  console.log(`✅ Connexion réussie pour ${email}`);
  return result.data.access_token;
}

// Fonction pour créer des commandes de test
async function createTestOrders(token, count = 5) {
  console.log(`📦 Création de ${count} commandes de test...`);
  
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const orderData = {
        shippingAddress: `${100 + i} Rue de Test, 75001 Paris`,
        phoneNumber: `+3312345678${i}`,
        notes: `Commande de test #${i + 1}`,
        orderItems: [
          {
            productId: 1,
            quantity: Math.floor(Math.random() * 3) + 1,
            size: ['S', 'M', 'L'][Math.floor(Math.random() * 3)],
            color: ['Rouge', 'Bleu', 'Vert'][Math.floor(Math.random() * 3)]
          }
        ]
      };

      const result = await apiCall('/orders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderData)
      });

      orders.push(result.data);
      console.log(`✅ Commande ${i + 1} créée: #${result.data.orderNumber}`);
      
      // Petite pause entre les créations
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ Erreur création commande ${i + 1}:`, error.message);
    }
  }
  
  return orders;
}

// Fonction pour mettre à jour les statuts des commandes
async function updateOrderStatuses(adminToken, orders) {
  console.log(`🔄 Mise à jour des statuts des commandes...`);
  
  const statuses = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  
  for (let i = 0; i < orders.length; i++) {
    try {
      const order = orders[i];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      await apiCall(`/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ 
          status: newStatus,
          notes: `Statut mis à jour automatiquement vers ${newStatus}`
        })
      });

      console.log(`✅ Commande #${order.orderNumber} -> ${newStatus}`);
      
      // Petite pause entre les mises à jour
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`❌ Erreur mise à jour commande ${i + 1}:`, error.message);
    }
  }
}

// Fonction pour récupérer et afficher les statistiques
async function getAndDisplayStatistics(adminToken) {
  console.log(`📊 Récupération des statistiques...`);
  
  try {
    const result = await apiCall('/orders/admin/statistics', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const stats = result.data;
    
    console.log('\n📈 STATISTIQUES DES COMMANDES');
    console.log('================================');
    
    // Statistiques générales
    console.log('\n🔢 STATISTIQUES GÉNÉRALES:');
    console.log(`   Total commandes: ${stats.totalOrders}`);
    console.log(`   En attente: ${stats.pendingOrders}`);
    console.log(`   Confirmées: ${stats.confirmedOrders}`);
    console.log(`   En traitement: ${stats.processingOrders}`);
    console.log(`   Expédiées: ${stats.shippedOrders}`);
    console.log(`   Livrées: ${stats.deliveredOrders}`);
    console.log(`   Annulées: ${stats.cancelledOrders}`);
    console.log(`   Rejetées: ${stats.rejectedOrders}`);
    
    // Statistiques financières
    console.log('\n💰 STATISTIQUES FINANCIÈRES:');
    console.log(`   Chiffre d'affaires total: ${stats.totalRevenue}€`);
    console.log(`   Valeur moyenne commande: ${stats.averageOrderValue.toFixed(2)}€`);
    
    // Statistiques temporelles
    console.log('\n📅 STATISTIQUES TEMPORELLES:');
    console.log(`   Commandes aujourd'hui: ${stats.ordersToday}`);
    console.log(`   Commandes cette semaine: ${stats.ordersThisWeek}`);
    console.log(`   Commandes ce mois: ${stats.ordersThisMonth}`);
    console.log(`   CA aujourd'hui: ${stats.revenueToday}€`);
    console.log(`   CA cette semaine: ${stats.revenueThisWeek}€`);
    console.log(`   CA ce mois: ${stats.revenueThisMonth}€`);
    
    // Top produits
    console.log('\n🏆 TOP PRODUITS:');
    if (stats.topProducts.length > 0) {
      stats.topProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.productName}`);
        console.log(`      Quantité vendue: ${product.totalQuantity}`);
        console.log(`      Chiffre d'affaires: ${product.totalRevenue}€`);
      });
    } else {
      console.log('   Aucun produit vendu pour le moment');
    }
    
    console.log('\n================================');
    
    return stats;
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error.message);
    throw error;
  }
}

// Fonction principale de test
async function runStatisticsTest() {
  console.log('🚀 DÉBUT DU TEST DES STATISTIQUES');
  console.log('==================================');
  
  try {
    // 1. Connexion admin
    const adminToken = await login(TEST_CONFIG.adminEmail, TEST_CONFIG.adminPassword);
    
    // 2. Connexion utilisateur
    const userToken = await login(TEST_CONFIG.userEmail, TEST_CONFIG.userPassword);
    
    // 3. Afficher les statistiques initiales
    console.log('\n📊 STATISTIQUES INITIALES:');
    await getAndDisplayStatistics(adminToken);
    
    // 4. Créer des commandes de test
    const orders = await createTestOrders(userToken, 8);
    
    // 5. Mettre à jour quelques statuts
    await updateOrderStatuses(adminToken, orders);
    
    // 6. Afficher les statistiques finales
    console.log('\n📊 STATISTIQUES APRÈS TESTS:');
    await getAndDisplayStatistics(adminToken);
    
    console.log('\n🎉 TEST DES STATISTIQUES TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('\n❌ ÉCHEC DU TEST:', error.message);
    process.exit(1);
  }
}

// Test spécifique des statistiques sans création de données
async function testStatisticsOnly() {
  console.log('📊 TEST RAPIDE DES STATISTIQUES');
  console.log('===============================');
  
  try {
    const adminToken = await login(TEST_CONFIG.adminEmail, TEST_CONFIG.adminPassword);
    await getAndDisplayStatistics(adminToken);
    
    console.log('\n✅ Test des statistiques réussi !');
  } catch (error) {
    console.error('\n❌ Erreur test statistiques:', error.message);
    process.exit(1);
  }
}

// Fonction pour tester l'accès aux statistiques
async function testStatisticsAccess() {
  console.log('🔐 TEST D\'ACCÈS AUX STATISTIQUES');
  console.log('=================================');
  
  try {
    // Test avec admin
    console.log('\n1. Test avec compte admin...');
    const adminToken = await login(TEST_CONFIG.adminEmail, TEST_CONFIG.adminPassword);
    
    const adminResult = await apiCall('/orders/admin/statistics', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Accès admin autorisé');
    
    // Test avec utilisateur normal (devrait échouer)
    console.log('\n2. Test avec compte utilisateur...');
    const userToken = await login(TEST_CONFIG.userEmail, TEST_CONFIG.userPassword);
    
    try {
      await apiCall('/orders/admin/statistics', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('❌ PROBLÈME: L\'utilisateur normal a accès aux statistiques !');
    } catch (error) {
      console.log('✅ Accès utilisateur correctement refusé');
    }
    
    // Test sans token (devrait échouer)
    console.log('\n3. Test sans authentification...');
    try {
      await apiCall('/orders/admin/statistics');
      console.log('❌ PROBLÈME: Accès sans authentification autorisé !');
    } catch (error) {
      console.log('✅ Accès sans auth correctement refusé');
    }
    
    console.log('\n🎉 Tests d\'accès terminés avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur test d\'accès:', error.message);
    process.exit(1);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const command = args[0] || 'full';

// Import de fetch pour Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Exécution selon la commande
switch (command) {
  case 'stats':
    testStatisticsOnly();
    break;
  case 'access':
    testStatisticsAccess();
    break;
  case 'full':
  default:
    runStatisticsTest();
    break;
}

console.log('\n💡 COMMANDES DISPONIBLES:');
console.log('   node test-statistics.js          # Test complet');
console.log('   node test-statistics.js stats    # Statistiques seulement');
console.log('   node test-statistics.js access   # Test d\'accès seulement'); 