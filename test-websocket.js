// test-websocket.js - Script de test pour les WebSockets
const { io } = require('socket.io-client');

async function testWebSocketSystem() {
  console.log('🧪 Test du système WebSocket');
  console.log('================================');

  // Configuration
  const serverUrl = 'http://localhost:3004';
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_TEST_TOKEN_HERE'; // Remplacez par un vrai token

  console.log('🔌 Connexion au serveur WebSocket...');

  // Créer la connexion
  const socket = io(`${serverUrl}/orders`, {
    auth: {
      token: testToken
    },
    transports: ['websocket'],
    autoConnect: true,
  });

  // Événements de connexion
  socket.on('connect', () => {
    console.log('✅ Connecté avec succès! ID:', socket.id);
    
    // Test ping
    console.log('🏓 Envoi d\'un ping...');
    socket.emit('ping', { test: true, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Déconnecté:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🚫 Erreur de connexion:', error.message);
  });

  // Événements de notifications
  socket.on('newOrder', (notification) => {
    console.log('🆕 Nouvelle commande reçue:');
    console.log('  - Titre:', notification.title);
    console.log('  - Message:', notification.message);
    console.log('  - Données:', notification.data);
  });

  socket.on('orderStatusChanged', (notification) => {
    console.log('📝 Statut commande modifié:');
    console.log('  - Titre:', notification.title);
    console.log('  - Message:', notification.message);
  });

  socket.on('myOrderUpdated', (notification) => {
    console.log('📦 Votre commande mise à jour:');
    console.log('  - Titre:', notification.title);
    console.log('  - Message:', notification.message);
  });

  socket.on('pong', (data) => {
    console.log('🏓 Pong reçu:', data);
  });

  // Garder la connexion active
  console.log('⏳ Connexion active - En attente de notifications...');
  console.log('   (Créez une commande pour tester les notifications)');
  
  // Déconnexion propre après 30 secondes
  setTimeout(() => {
    console.log('🔌 Déconnexion du test...');
    socket.disconnect();
    process.exit(0);
  }, 30000);
}

// Fonction pour tester avec Fetch API (créer une commande de test)
async function createTestOrder() {
  console.log('📦 Création d\'une commande de test...');
  
  const orderData = {
    shippingAddress: "123 Rue de Test, 75001 Paris",
    phoneNumber: "+33123456789",
    notes: "Commande de test WebSocket",
    orderItems: [
      {
        productId: 1, // Assurez-vous que ce produit existe
        quantity: 1,
        size: "M",
        color: "Rouge"
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3004/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Remplacez par un vrai token
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Commande créée:', result.data.orderNumber);
      console.log('   Les admins connectés devraient recevoir une notification!');
    } else {
      console.log('❌ Erreur création commande:', result.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

// Affichage des instructions
console.log(`
🚀 Test du Système WebSocket pour PrintAlma
==========================================

INSTRUCTIONS:
1. Assurez-vous que votre serveur NestJS est démarré (port 3004)
2. Remplacez 'YOUR_TEST_TOKEN_HERE' par un vrai token JWT
3. Lancez ce script: node test-websocket.js
4. Dans un autre terminal, créez une commande pour tester les notifications

POUR TESTER:
- Connectez-vous en tant qu'admin dans votre frontend
- Créez une commande depuis un autre compte
- Vérifiez que l'admin reçoit bien la notification

`);

// Lancer le test
if (require.main === module) {
  testWebSocketSystem().catch(console.error);
} 