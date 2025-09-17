const axios = require('axios');

// Créer un client axios qui garde les cookies
const client = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: true // Important pour les cookies
});

async function testWithCookies() {
  try {
    console.log('🍪 Test avec cookies (authentication basée sur httpOnly cookies)...\n');

    // 1. Login pour définir le cookie
    console.log('1. Login avec cookies...');
    const loginResponse = await client.post('/auth/login', {
      email: 'pf.d@zig.univ.sn',
      password: 'password123'
    });

    console.log('✅ Login réussi !');
    console.log('Utilisateur:', loginResponse.data.user.email);
    console.log('Cookies reçus dans les headers:', loginResponse.headers['set-cookie'] ? 'OUI' : 'NON');

    // 2. Test des endpoints avec les cookies automatiquement inclus
    console.log('\n2. Test des statistiques (avec cookies)...');
    const statsResponse = await client.get('/vendor/orders/statistics');

    console.log('✅ Statistiques récupérées !');
    console.log('Data:', JSON.stringify(statsResponse.data, null, 2));

    // 3. Test de la liste des commandes
    console.log('\n3. Test de la liste des commandes...');
    const ordersResponse = await client.get('/vendor/orders');

    console.log('✅ Commandes récupérées !');
    console.log(`📦 ${ordersResponse.data.data?.orders?.length || 0} commandes trouvées`);

    if (ordersResponse.data.data?.orders) {
      ordersResponse.data.data.orders.forEach((order, i) => {
        console.log(`   ${i+1}. ${order.orderNumber} - ${order.status} (${order.totalAmount} FCFA)`);
      });
    }

    // 4. Test avec paramètres
    console.log('\n4. Test des commandes PENDING...');
    const pendingResponse = await client.get('/vendor/orders?status=PENDING');

    console.log(`⏳ ${pendingResponse.data.data?.orders?.length || 0} commandes PENDING trouvées`);

    // 5. Test de notifications
    console.log('\n5. Test des notifications...');
    const notifResponse = await client.get('/vendor/orders/notifications');

    console.log(`🔔 ${notifResponse.data.data?.length || 0} notifications trouvées`);

    console.log('\n🎉 Tous les tests passés avec succès !');
    console.log('\n💡 Pour curl, utilise les cookies:');
    console.log('1. Login d\'abord : curl -c cookies.txt -X POST http://localhost:3004/auth/login -H "Content-Type: application/json" -d \'{"email":"pf.d@zig.univ.sn","password":"password123"}\'');
    console.log('2. Ensuite utilise : curl -b cookies.txt http://localhost:3004/vendor/orders/statistics');

  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur HTTP:', error.response.status);
      console.log('URL:', error.config.url);
      console.log('Message:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

testWithCookies();