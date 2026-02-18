import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * Ce script simule EXACTEMENT ce que fait l'application quand elle crée une commande
 * pour identifier la différence entre nos tests (qui fonctionnent) et l'app (qui échoue)
 */
async function testInvoiceLikeApp() {
  console.log('\n🧪 TEST SIMULANT L\'APPLICATION\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Récupérer la config depuis la BDD (comme le fait l'app)
  const dbConfig = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!dbConfig) {
    console.log('❌ Aucune configuration active\n');
    await prisma.$disconnect();
    return;
  }

  const mode = dbConfig.activeMode;
  const masterKey = mode === 'test' ? dbConfig.testMasterKey : dbConfig.liveMasterKey;
  const privateKey = mode === 'test' ? dbConfig.testPrivateKey : dbConfig.livePrivateKey;
  const token = mode === 'test' ? dbConfig.testToken : dbConfig.liveToken;

  const apiUrl = mode === 'test'
    ? 'https://app.paydunya.com/sandbox-api/v1'
    : 'https://app.paydunya.com/api/v1';

  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`API: ${apiUrl}\n`);

  // Simuler les URLs comme le fait l'application
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const baseReturnUrl = `${frontendUrl}/order-confirmation`;
  const orderNumber = `TEST-${Date.now()}`;
  const orderEmail = 'test@printalma.com';
  const orderAmount = 5000;

  const returnUrl = `${baseReturnUrl}?orderNumber=${encodeURIComponent(orderNumber)}&totalAmount=${encodeURIComponent(orderAmount)}&email=${encodeURIComponent(orderEmail)}`;
  const cancelUrl = `${baseReturnUrl}?orderNumber=${encodeURIComponent(orderNumber)}&status=cancelled`;
  const callbackUrl = process.env.PAYDUNYA_CALLBACK_URL || 'https://webhook.site/f6e65778-b5b6-4050-9dfe-2e6ec6f84b69';

  console.log('📋 URLS GÉNÉRÉES (comme l\'application):');
  console.log(`   Frontend URL: ${frontendUrl}`);
  console.log(`   Return URL: ${returnUrl}`);
  console.log(`   Cancel URL: ${cancelUrl}`);
  console.log(`   Callback URL: ${callbackUrl}\n`);

  // Créer l'invoice EXACTEMENT comme le fait l'application
  const invoiceData = {
    invoice: {
      total_amount: orderAmount,
      description: `Commande Printalma - ${orderNumber}`,
      customer: {
        name: 'Test Client',
        email: orderEmail,
        phone: '+221776543210'
      }
    },
    store: {
      name: 'Printalma',
      tagline: 'Impression personnalisée de qualité',
      postal_address: 'Dakar, Sénégal',
      phone: process.env.STORE_PHONE || '+221338234567',
      website_url: process.env.STORE_URL || 'https://printalma.com'
    },
    custom_data: {
      orderId: 999,
      orderNumber: orderNumber,
      userId: null
    },
    actions: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      callback_url: callbackUrl
    }
  };

  console.log('📤 PAYLOAD ENVOYÉ:');
  console.log(JSON.stringify(invoiceData, null, 2));
  console.log('\n');

  try {
    console.log('🚀 CRÉATION DE L\'INVOICE...\n');

    const response = await axios.post(
      `${apiUrl}/checkout-invoice/create`,
      invoiceData,
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ INVOICE CRÉÉE!\n');
    console.log(`   Response Code: ${response.data.response_code}`);
    console.log(`   Token: ${response.data.token}`);
    console.log(`   URL: ${response.data.response_text}\n`);

    // Vérifier immédiatement le statut
    console.log('🔍 VÉRIFICATION IMMÉDIATE DU STATUT...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await axios.get(
      `${apiUrl}/checkout-invoice/confirm/${response.data.token}`,
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('📊 STATUT:');
    console.log(`   Status: ${statusResponse.data.status}`);
    console.log(`   Mode: ${statusResponse.data.mode}`);
    console.log(`   Customer Payment Method: ${statusResponse.data.customer?.payment_method || 'null'}\n`);

    console.log('🔗 URLS DANS LA RÉPONSE PAYDUNYA:');
    console.log(`   Return URL: ${statusResponse.data.actions?.return_url}`);
    console.log(`   Cancel URL: ${statusResponse.data.actions?.cancel_url}`);
    console.log(`   Callback URL: ${statusResponse.data.actions?.callback_url}\n`);

    if (statusResponse.data.status === 'cancelled') {
      console.log('❌ L\'INVOICE EST DÉJÀ CANCELLED!\n');
      console.log('🔍 ANALYSE DU PROBLÈME:');

      // Vérifier si c'est un problème d'URL
      const hasLocalhostUrl =
        returnUrl.includes('localhost') ||
        cancelUrl.includes('localhost') ||
        callbackUrl.includes('localhost');

      if (hasLocalhostUrl) {
        console.log('   ⚠️  PROBLÈME DÉTECTÉ: URLs localhost en mode LIVE');
        console.log('   → PayDunya rejette les URLs localhost en production\n');
        console.log('   SOLUTION:');
        console.log('   → Configurez la variable FRONTEND_URL sur Render');
        console.log('   → Exemple: FRONTEND_URL=https://votre-frontend.com\n');
      } else {
        console.log('   ❓ Les URLs semblent correctes');
        console.log('   → Le problème pourrait venir d\'autre chose\n');
      }
    } else {
      console.log(`✅ L'INVOICE EST ACTIVE (status: ${statusResponse.data.status})\n`);
      console.log(`🔗 Testez à cette URL: ${response.data.response_text}\n`);
    }

  } catch (error: any) {
    console.log('❌ ERREUR!\n');

    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Réponse: ${JSON.stringify(error.response.data, null, 2)}\n`);
    } else {
      console.log(`   Erreur: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
  await prisma.$disconnect();
}

testInvoiceLikeApp().catch(console.error);
