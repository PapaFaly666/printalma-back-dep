const io = require('socket.io-client');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3004';

async function testWebSocketRealTime() {
  console.log('🔥 Test WebSocket Temps Réel - PrintAlma\n');

  // ⚠️ REMPLACEZ AVEC VOS TOKENS RÉELS
  const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
  const clientToken = 'YOUR_CLIENT_TOKEN_HERE';

  console.log('📝 Étape 1: Connexion WebSocket Admin...');
  
  // Connexion WebSocket Admin
  const adminSocket = io(`${API_BASE}/orders`, {
    auth: {
      token: adminToken
    },
    transports: ['websocket'],
  });

  adminSocket.on('connect', () => {
    console.log('✅ Admin connecté au WebSocket:', adminSocket.id);
  });

  adminSocket.on('connect_error', (error) => {
    console.error('❌ Erreur connexion admin:', error.message);
  });

  // Écouter les nouvelles commandes
  adminSocket.on('newOrder', (notification) => {
    console.log('\n🆕 NOUVELLE COMMANDE REÇUE:');
    console.log('📦 Titre:', notification.title);
    console.log('💰 Message:', notification.message);
    console.log('📊 Données:', JSON.stringify(notification.data, null, 2));
    console.log('⏰ Timestamp:', notification.timestamp);
  });

  // Écouter les changements de statut
  adminSocket.on('orderStatusChanged', (notification) => {
    console.log('\n📝 STATUT CHANGÉ:');
    console.log('📦 Titre:', notification.title);
    console.log('🔄 Message:', notification.message);
    console.log('📊 Données:', JSON.stringify(notification.data, null, 2));
  });

  // Test ping
  setTimeout(() => {
    console.log('\n🏓 Test ping...');
    adminSocket.emit('ping', { test: true });
  }, 2000);

  adminSocket.on('pong', (data) => {
    console.log('✅ Pong reçu:', data);
  });

  console.log('\n📝 Étape 2: Simulation d\'une commande client...');
  
  // Attendre que l'admin soit connecté
  setTimeout(async () => {
    try {
      // Simuler une commande client
      const orderData = {
        shippingAddress: "123 Rue Test WebSocket, 75001 Paris",
        phoneNumber: "+33123456789",
        notes: "Test WebSocket temps réel",
        orderItems: [
          {
            productId: 1, // Assurez-vous qu'un produit avec ID 1 existe
            quantity: 1,
            size: "M",
            color: "Rouge"
          }
        ]
      };

      console.log('📦 Création de commande test...');
      
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Commande créée:', result.data.orderNumber);
        console.log('⏳ L\'admin devrait recevoir une notification...');
      } else {
        console.error('❌ Erreur création commande:', result.message);
      }

    } catch (error) {
      console.error('❌ Erreur:', error.message);
    }
  }, 3000);

  // Test des statistiques WebSocket
  setTimeout(async () => {
    try {
      console.log('\n📊 Vérification des statistiques WebSocket...');
      
      const response = await fetch(`${API_BASE}/orders/admin/websocket-stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('📈 Statistiques WebSocket:');
        console.log('👑 Admins connectés:', result.data.connectedAdmins);
        console.log('👤 Utilisateurs connectés:', result.data.connectedUsers);
        console.log('📊 Total:', result.data.total);
      } else {
        console.error('❌ Erreur stats:', result.message);
      }
    } catch (error) {
      console.error('❌ Erreur stats:', error.message);
    }
  }, 5000);

  // Garder le script en vie
  setTimeout(() => {
    console.log('\n⏹️ Fin du test');
    adminSocket.disconnect();
    process.exit(0);
  }, 10000);
}

// Instructions
console.log(`
🔧 INSTRUCTIONS:
1. Assurez-vous que votre backend est lancé (npm run start)
2. Installez socket.io-client: npm install socket.io-client
3. Remplacez YOUR_ADMIN_TOKEN_HERE par un token admin valide
4. Remplacez YOUR_CLIENT_TOKEN_HERE par un token client valide
5. Assurez-vous qu'un produit avec ID 1 existe dans votre base
6. Exécutez: node test-websocket-real.js

Pour obtenir des tokens:
- Connectez-vous via Postman ou votre frontend
- Ou utilisez les scripts test-login.js existants
`);

testWebSocketRealTime(); 