const { io } = require('socket.io-client');

console.log('🧪 Test WebSocket avec Cookies - PrintAlma\n');

console.log(`
🔧 PRÉREQUIS IMPORTANT:
1. Connectez-vous d'abord sur votre frontend (http://localhost:3000 ou similaire)
2. Assurez-vous d'avoir un cookie 'auth_token' valide
3. Ce script ne peut pas utiliser les cookies du navigateur
4. → Utilisez plutôt le test depuis votre frontend directement

⚠️ Ce script sert surtout pour tester la configuration WebSocket backend.
`);

// Configuration WebSocket pour test
const socket = io('http://localhost:3004/orders', {
  withCredentials: true, // ⭐ IMPORTANT: Envoie les cookies (si disponibles)
  transports: ['websocket', 'polling'],
  timeout: 10000,
  // Note: Node.js ne gère pas les cookies comme un navigateur
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
🔐 PROBLÈME D'AUTHENTIFICATION (ATTENDU):
- Ce script Node.js ne peut pas utiliser les cookies du navigateur
- Les cookies httpOnly ne sont pas accessibles depuis Node.js de cette façon
- C'est normal que ce test échoue !

✅ POUR TESTER VRAIMENT:
1. Ouvrez votre frontend dans le navigateur
2. Connectez-vous en tant qu'admin
3. Ouvrez la console du navigateur (F12)
4. Testez avec ce code:

   const { io } = window.io; // Si socket.io est chargé globalement
   const socket = io('http://localhost:3004/orders', {
     withCredentials: true,
     transports: ['websocket', 'polling']
   });
   
   socket.on('connect', () => console.log('✅ WebSocket connecté!'));
   socket.on('connect_error', (err) => console.error('❌ Erreur:', err));

📝 OU utilisez directement le service WebSocket dans votre frontend React.
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
Votre WebSocket fonctionne parfaitement.

⚠️ MAIS ce test ne prouve pas l'authentification par cookie !
→ Testez directement depuis votre frontend pour la vraie validation.
  `);
});

// Timeout de sécurité
setTimeout(() => {
  if (socket.connected) {
    console.log('\n⏱️ Test terminé après 15 secondes');
    socket.disconnect();
  }
}, 15000);

console.log('⏳ En attente de connexion... (timeout 15s)');
console.log('💡 Appuyez sur Ctrl+C pour arrêter');

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du test...');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
}); 