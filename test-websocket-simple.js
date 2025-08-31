const { io } = require('socket.io-client');

console.log('🧪 Test WebSocket Simple - PrintAlma\n');

// ⚠️ Remplacez par votre token admin réel
const adminToken = 'YOUR_ADMIN_TOKEN_HERE';

if (adminToken === 'YOUR_ADMIN_TOKEN_HERE') {
  console.log(`
❌ ERREUR: Vous devez remplacer YOUR_ADMIN_TOKEN_HERE par un vrai token admin !

🔧 Pour obtenir un token admin:
1. Connectez-vous à votre frontend en tant qu'admin
2. Ouvrez la console du navigateur (F12)
3. Tapez: localStorage.getItem('authToken')
4. Copiez le résultat et remplacez YOUR_ADMIN_TOKEN_HERE dans ce fichier
5. Relancez: node test-websocket-simple.js
  `);
  process.exit(1);
}

console.log('🔌 Connexion WebSocket avec token...');
console.log('Token utilisé:', adminToken.substring(0, 20) + '...');

const socket = io('http://localhost:3004/orders', {
  auth: {
    token: adminToken
  },
  transports: ['websocket', 'polling'],
  timeout: 10000
});

// Gestion des événements
socket.on('connect', () => {
  console.log('✅ SUCCÈS: WebSocket connecté !');
  console.log('Socket ID:', socket.id);
  
  // Test ping immédiat
  console.log('\n🏓 Test ping...');
  socket.emit('ping', { test: true, timestamp: new Date().toISOString() });
});

socket.on('connect_error', (error) => {
  console.error('❌ ERREUR de connexion:', error.message);
  
  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    console.log(`
🔐 PROBLÈME D'AUTHENTIFICATION:
- Votre token est probablement expiré ou invalide
- Connectez-vous à nouveau sur votre frontend
- Récupérez un nouveau token depuis localStorage.getItem('authToken')
    `);
  } else if (error.message.includes('timeout')) {
    console.log(`
⏱️ TIMEOUT:
- Vérifiez que votre backend est démarré (npm run start)
- Vérifiez que le port 3004 est bien ouvert
    `);
  } else {
    console.log(`
🔧 AUTRES PROBLÈMES POSSIBLES:
- Backend non démarré: npm run start
- Mauvaise URL: vérifiez http://localhost:3004
- Problème firewall/antivirus
    `);
  }
  
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ WebSocket déconnecté:', reason);
  process.exit(0);
});

// Écouter les nouvelles commandes
socket.on('newOrder', (notification) => {
  console.log('\n🆕 NOUVELLE COMMANDE REÇUE !');
  console.log('Titre:', notification.title);
  console.log('Message:', notification.message);
  console.log('Données:', JSON.stringify(notification.data, null, 2));
  console.log('⏰ Reçu à:', new Date().toLocaleTimeString());
});

// Écouter les changements de statut
socket.on('orderStatusChanged', (notification) => {
  console.log('\n📝 CHANGEMENT DE STATUT !');
  console.log('Titre:', notification.title);
  console.log('Message:', notification.message);
  console.log('Données:', JSON.stringify(notification.data, null, 2));
});

// Réponse ping
socket.on('pong', (data) => {
  console.log('✅ Pong reçu:', data.message);
  console.log('Utilisateur:', data.user);
  console.log('Timestamp:', data.timestamp);
  
  console.log(`
🎉 SUCCÈS COMPLET !
Votre WebSocket fonctionne parfaitement. Les admins recevront les notifications en temps réel.

Pour tester une vraie notification:
1. Laissez ce script tourner
2. Créez une commande depuis votre frontend client
3. Vous devriez voir apparaître ici: "🆕 NOUVELLE COMMANDE REÇUE !"
  `);
});

// Timeout de sécurité
setTimeout(() => {
  if (socket.connected) {
    console.log('\n⏱️ Test terminé après 30 secondes');
    socket.disconnect();
  }
}, 30000);

console.log('⏳ En attente de connexion... (timeout 30s)');
console.log('Appuyez sur Ctrl+C pour arrêter');

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du test...');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
}); 