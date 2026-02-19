/**
 * Script de test pour créer un paiement PayDunya en mode LIVE
 *
 * ATTENTION: Ce script crée un VRAI paiement !
 * Mode LIVE = Argent réel
 *
 * Usage:
 *   node test-paydunya-live-payment.js
 */

const https = require('https');

// Configuration
const BACKEND_URL = 'printalma-back-dep.onrender.com';
const TEST_AMOUNT = 1000; // 1000 FCFA = environ 1.50 EUR (montant minimum pour test)

console.log('🧪 Test de paiement PayDunya LIVE');
console.log('=====================================');
console.log('⚠️  ATTENTION: Mode LIVE activé !');
console.log('💰 Montant du test:', TEST_AMOUNT, 'FCFA');
console.log('');

// Données de test pour la facture
const paymentData = {
  invoice: {
    total_amount: TEST_AMOUNT,
    description: 'Test de paiement PrintAlma - Commande test'
  },
  store: {
    name: 'PrintAlma',
    tagline: 'Impression personnalisée',
    phone: '773838585',
    postal_address: 'Dakar, Sénégal',
    logo_url: 'https://printalma-website-dep.onrender.com/logo.png'
  },
  custom_data: {
    order_number: 'TEST-' + Date.now(),
    order_id: 999999,
    test: true
  },
  actions: {
    callback_url: 'https://printalma-back-dep.onrender.com/paydunya/webhook',
    return_url: 'https://printalma-website-dep.onrender.com/order-confirmation',
    cancel_url: 'https://printalma-website-dep.onrender.com/order-confirmation'
  }
};

console.log('📦 Données de paiement:');
console.log(JSON.stringify(paymentData, null, 2));
console.log('');
console.log('📡 Envoi de la requête à:', `https://${BACKEND_URL}/paydunya/payment`);
console.log('');

// Préparer la requête
const postData = JSON.stringify(paymentData);

const options = {
  hostname: BACKEND_URL,
  port: 443,
  path: '/paydunya/payment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Envoyer la requête
const req = https.request(options, (res) => {
  let data = '';

  console.log('📊 Status Code:', res.statusCode);
  console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Réponse reçue:');
    console.log('=====================================');

    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      console.log('');

      if (response.success && response.data) {
        console.log('');
        console.log('🎉 PAIEMENT CRÉÉ AVEC SUCCÈS !');
        console.log('=====================================');
        console.log('');
        console.log('📝 Token de paiement:', response.data.token);
        console.log('');
        console.log('💳 URL DE PAIEMENT (OUVREZ DANS LE NAVIGATEUR):');
        console.log('🔗', response.data.payment_url || response.data.redirect_url);
        console.log('');
        console.log('⚠️  RAPPEL: Ceci est un VRAI paiement en mode LIVE !');
        console.log('💰 Montant:', TEST_AMOUNT, 'FCFA');
        console.log('');
        console.log('📋 Étapes suivantes:');
        console.log('   1. Copiez l\'URL ci-dessus');
        console.log('   2. Ouvrez-la dans votre navigateur');
        console.log('   3. Effectuez le paiement avec Orange Money, Wave, etc.');
        console.log('   4. Vérifiez la redirection vers order-confirmation');
        console.log('');
        console.log('🔍 Pour vérifier le statut du paiement:');
        console.log(`   https://${BACKEND_URL}/paydunya/status/${response.data.token}`);
        console.log('');
      } else {
        console.error('');
        console.error('❌ ERREUR: Échec de création du paiement');
        console.error('Réponse:', response);
        console.error('');
      }
    } catch (error) {
      console.error('');
      console.error('❌ ERREUR: Impossible de parser la réponse JSON');
      console.error('Réponse brute:', data);
      console.error('Erreur:', error.message);
      console.error('');
    }
  });
});

req.on('error', (error) => {
  console.error('');
  console.error('❌ ERREUR DE REQUÊTE');
  console.error('=====================================');
  console.error('Message:', error.message);
  console.error('Code:', error.code);
  console.error('');
  console.error('💡 Causes possibles:');
  console.error('   - Le backend Render n\'est pas démarré');
  console.error('   - Problème de connexion internet');
  console.error('   - Variables d\'environnement PayDunya mal configurées');
  console.error('');
  console.error('🔧 Solutions:');
  console.error('   1. Vérifiez que le backend est accessible:');
  console.error(`      https://${BACKEND_URL}/paydunya/test-config`);
  console.error('   2. Vérifiez votre connexion internet');
  console.error('   3. Consultez les logs Render');
  console.error('');
});

// Envoyer les données
req.write(postData);
req.end();

console.log('⏳ Attente de la réponse du serveur...');
console.log('');
