import axios from 'axios';

async function testOrderCreation() {
  console.log('🧪 Test de création de commande avec PayDunya\n');

  const orderData = {
    orderItems: [
      {
        productId: 1,
        quantity: 1,
        unitPrice: 200,
        size: 'M',
        colorId: 1
      }
    ],
    shippingDetails: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '+221771234567',
      street: '123 Test Street',
      city: 'Dakar',
      postalCode: '10000',
      country: 'Sénégal'
    },
    paymentMethod: 'PAYDUNYA',
    initiatePayment: true
  };

  try {
    console.log('📤 Envoi de la commande au backend...');
    const response = await axios.post('http://localhost:3004/orders/guest', orderData);

    console.log('✅ Commande créée avec succès!\n');
    console.log('📋 Réponse du backend:');
    console.log(JSON.stringify(response.data, null, 2));

    // Analyser la réponse
    if (response.data.data?.payment?.token) {
      const token = response.data.data.payment.token;
      console.log('\n🔑 Token PayDunya:', token);

      if (token.startsWith('test_')) {
        console.log('⚠️  LE TOKEN COMMENCE PAR "test_" - MODE TEST UTILISÉ');
      } else if (token.startsWith('live_')) {
        console.log('✅ LE TOKEN COMMENCE PAR "live_" - MODE LIVE UTILISÉ');
      } else {
        console.log('ℹ️  Token sans préfixe:', token);
      }

      if (response.data.data.payment.redirect_url) {
        console.log('\n🔗 URL de paiement:');
        console.log('   ', response.data.data.payment.redirect_url);
      }
    } else {
      console.log('\n❌ Aucun token de paiement dans la réponse!');
      console.log('   Le backend n\'a pas généré de paiement PayDunya');
    }

  } catch (error: any) {
    console.log('❌ Erreur lors de la création de la commande:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Le serveur backend n\'est pas démarré!');
      console.log('   → Démarrez le serveur avec: npm run start:dev');
    } else {
      console.log('   Message:', error.message);
    }
  }
}

testOrderCreation().catch(console.error);
