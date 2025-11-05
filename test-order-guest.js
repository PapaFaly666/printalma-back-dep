#!/usr/bin/env node

// Script de test pour vérifier l'endpoint /orders/guest
const axios = require('axios');

const API_URL = 'http://localhost:3004';

async function testGuestOrder() {
  console.log('🧪 Test de l\'endpoint /orders/guest...');

  const orderData = {
    customerInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '775588836'
    },
    shippingDetails: {
      street: '123 Test Street',
      city: 'Dakar',
      postalCode: '10000',
      country: 'Sénégal'
    },
    orderItems: [
      {
        productId: 1,
        quantity: 1,
        unitPrice: 6000
      }
    ],
    paymentMethod: 'PAYDUNYA',
    initiatePayment: false,
    notes: 'Test commande depuis script'
  };

  try {
    console.log('📤 Envoi de la requête à /orders/guest...');
    console.log('Données:', JSON.stringify(orderData, null, 2));

    const response = await axios.post(`${API_URL}/orders/guest`, orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Succès !');
    console.log('Réponse:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Erreur:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Message:', error.message);
    }
  }
}

async function testProtectedOrders() {
  console.log('\n🧪 Test de l\'endpoint /orders (protégé)...');

  const orderData = {
    customerInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '775588836'
    },
    shippingDetails: {
      street: '123 Test Street',
      city: 'Dakar',
      postalCode: '10000',
      country: 'Sénégal'
    },
    orderItems: [
      {
        productId: 1,
        quantity: 1,
        unitPrice: 6000
      }
    ],
    paymentMethod: 'PAYDUNYA',
    initiatePayment: false,
    notes: 'Test commande depuis script'
  };

  try {
    console.log('📤 Envoi de la requête à /orders (sans auth)...');

    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Succès inattendu !');
    console.log('Réponse:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Erreur attendue:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log('✅ Confirmation: /orders nécessite une authentification');
      }
    } else {
      console.log('Message:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Démarrage des tests...\n');

  // Test 1: Endpoint guest (devrait fonctionner)
  await testGuestOrder();

  // Test 2: Endpoint protégé (devrait retourner 401)
  await testProtectedOrders();

  console.log('\n🎯 Conclusion:');
  console.log('- Utilisez /orders/guest pour les commandes sans authentification');
  console.log('- Utilisez /orders pour les commandes avec authentification (JWT)');
  console.log('- Le frontend doit utiliser /orders/guest');
}

main().catch(console.error);