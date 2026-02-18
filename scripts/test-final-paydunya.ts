import axios from 'axios';

async function testFinalPaydunya() {
  console.log('🧪 NOUVEAU TEST COMPLET\n');
  console.log('═══════════════════════════════════════════════════\n');

  const masterKey = 'BYRJC1bN-y1Cd-zIzw-HNmm-1rxJsAYSlFV1';
  const privateKey = 'live_private_wFaMv8rlrXEPBMrhdLvCGkgnZrx';
  const token = 'aoSNq1dFGdWsscRFF63O';
  const webhookUrl = 'https://webhook.site/f6e65778-b5b6-4050-9dfe-2e6ec6f84b69';

  console.log('📋 CONFIGURATION:');
  console.log('   Mode: PRODUCTION (live)');
  console.log('   API: https://app.paydunya.com/api/v1');
  console.log('   Webhook:', webhookUrl);
  console.log('   Montant: 800 FCFA');
  console.log('');

  console.log('📤 Étape 1: Création de l\'invoice...\n');

  try {
    const invoiceResponse = await axios.post(
      'https://app.paydunya.com/api/v1/checkout-invoice/create',
      {
        invoice: {
          total_amount: 800,
          description: 'Test Printalma - ' + new Date().toLocaleString('fr-FR'),
          customer: {
            name: 'Papa Faly Sidy',
            email: 'djibymamadou.wade@unchk.edu.sn',
            phone: '+221774322221'
          }
        },
        store: {
          name: 'Printalma',
          tagline: 'Impression personnalisée de qualité',
          postal_address: 'Dakar, Sénégal',
          phone: '+221338234567',
          website_url: 'https://printalma.com'
        },
        custom_data: {
          test_timestamp: new Date().toISOString(),
          source: 'test_script'
        },
        actions: {
          return_url: 'https://printalma.com/order-confirmation',
          cancel_url: 'https://printalma.com/order-confirmation?status=cancelled',
          callback_url: webhookUrl
        }
      },
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ INVOICE CRÉÉE AVEC SUCCÈS!\n');
    console.log('📋 RÉPONSE PAYDUNYA:');
    console.log('   Response Code:', invoiceResponse.data.response_code);
    console.log('   Response Text:', invoiceResponse.data.response_text);
    console.log('   Token:', invoiceResponse.data.token);
    console.log('   Description:', invoiceResponse.data.description);
    console.log('');

    const paymentUrl = invoiceResponse.data.response_text;
    const invoiceToken = invoiceResponse.data.token;

    // Analyser le token
    console.log('🔍 ANALYSE DU TOKEN:');
    if (invoiceToken.startsWith('test_')) {
      console.log('   ⚠️  Préfixe: test_ (MODE TEST)');
    } else if (invoiceToken.startsWith('live_')) {
      console.log('   ✅ Préfixe: live_ (MODE PRODUCTION)');
    } else {
      console.log('   ✅ Pas de préfixe (MODE PRODUCTION)');
    }
    console.log('   Token:', invoiceToken);
    console.log('');

    // Analyser l'URL
    console.log('🔗 ANALYSE DE L\'URL:');
    if (paymentUrl.includes('/sandbox-checkout/')) {
      console.log('   ⚠️  Contient "/sandbox-checkout/" (TEST)');
    } else if (paymentUrl.includes('paydunya.com/checkout/')) {
      console.log('   ✅ Format production: paydunya.com/checkout/');
    }
    console.log('   URL:', paymentUrl);
    console.log('');

    console.log('📤 Étape 2: Test d\'accès à la page de paiement...\n');

    // Tester l'accès à la page
    const pageResponse = await axios.get(paymentUrl, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('📄 RÉPONSE HTTP:');
    console.log('   Status Code:', pageResponse.status);
    console.log('   Status Text:', pageResponse.statusText);
    console.log('');

    // Analyser le contenu
    const html = pageResponse.data.toString();

    console.log('📝 ANALYSE DU CONTENU:');

    if (pageResponse.status === 404) {
      console.log('   ❌ PAGE NON TROUVÉE (404)');
      console.log('   L\'invoice n\'existe pas ou a expiré');
    } else if (pageResponse.status >= 500) {
      console.log('   ❌ ERREUR SERVEUR (' + pageResponse.status + ')');
      console.log('   Problème côté PayDunya');
    } else if (pageResponse.status === 200) {
      const hasError = html.toLowerCase().includes('erreur') ||
                       html.toLowerCase().includes('error') ||
                       html.toLowerCase().includes('échoué') ||
                       html.toLowerCase().includes('failed');

      const hasPayment = html.toLowerCase().includes('payer') ||
                         html.toLowerCase().includes('payment') ||
                         html.toLowerCase().includes('checkout') ||
                         html.toLowerCase().includes('montant');

      const hasServerError = html.includes('Une erreur est survenue au niveau du serveur');

      if (hasServerError) {
        console.log('   ❌ ERREUR SERVEUR PAYDUNYA DÉTECTÉE');
        console.log('   Message: "Une erreur est survenue au niveau du serveur"');
        console.log('');
        console.log('🔍 CAUSES POSSIBLES:');
        console.log('   1. Application PayDunya en mode TEST sur le dashboard');
        console.log('      → Vérifiez sur https://app.paydunya.com');
        console.log('      → Activez le mode PRODUCTION');
        console.log('');
        console.log('   2. Webhook callback inaccessible');
        console.log('      → Webhook actuel:', webhookUrl);
        console.log('');
        console.log('   3. Compte nécessitant validation');
        console.log('      → Contactez le support PayDunya');
      } else if (hasPayment) {
        console.log('   ✅ PAGE DE PAIEMENT FONCTIONNELLE!');
        console.log('   La page contient des éléments de paiement');
        console.log('   Le checkout devrait fonctionner normalement');
      } else if (hasError) {
        console.log('   ⚠️  Erreur détectée dans la page');
      } else {
        console.log('   ℹ️  Page chargée (contenu inconnu)');
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔗 URL À TESTER DANS VOTRE NAVIGATEUR:');
    console.log('   ' + paymentUrl);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    if (pageResponse.status === 200 && !html.includes('Une erreur est survenue')) {
      console.log('✅ TEST RÉUSSI - Tout fonctionne!');
    } else {
      console.log('⚠️  TEST PARTIELLEMENT RÉUSSI');
      console.log('   L\'invoice est créée mais la page peut avoir des problèmes');
    }
    console.log('');

  } catch (error: any) {
    console.log('❌ ERREUR LORS DU TEST!\n');

    if (error.response) {
      console.log('📥 ERREUR DE L\'API:');
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('📡 PAS DE RÉPONSE:');
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('⚙️  ERREUR:', error.message);
    }
    console.log('');
  }
}

testFinalPaydunya().catch(console.error);
