import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testLiveInvoice() {
  console.log('\n🧪 TEST DÉTAILLÉ D\'INVOICE EN MODE LIVE\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Récupérer la config depuis la BDD
  const dbConfig = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!dbConfig) {
    console.log('❌ Aucune configuration active\n');
    await prisma.$disconnect();
    return;
  }

  const mode = dbConfig.activeMode;
  console.log(`1️⃣  MODE ACTIF: ${mode.toUpperCase()}\n`);

  if (mode !== 'live') {
    console.log('❌ Le système n\'est pas en mode LIVE !');
    console.log('   Exécutez: npx ts-node scripts/switch-paydunya-mode.ts live --confirm\n');
    await prisma.$disconnect();
    return;
  }

  const masterKey = dbConfig.liveMasterKey;
  const privateKey = dbConfig.livePrivateKey;
  const token = dbConfig.liveToken;
  const publicKey = dbConfig.livePublicKey;

  console.log('2️⃣  CLÉS UTILISÉES:\n');
  console.log(`   Master Key:   ${masterKey}`);
  console.log(`   Private Key:  ${privateKey}`);
  console.log(`   Public Key:   ${publicKey}`);
  console.log(`   Token:        ${token}\n`);

  const apiUrl = 'https://app.paydunya.com/api/v1';
  console.log(`3️⃣  API URL: ${apiUrl}\n`);

  // Créer l'invoice
  const invoiceData = {
    invoice: {
      total_amount: 1000,
      description: `Test LIVE détaillé - ${new Date().toISOString()}`,
      customer: {
        name: 'Test Client',
        email: 'test@printalma.com',
        phone: '+221776543210'
      }
    },
    store: {
      name: 'Printalma',
      tagline: 'Impression personnalisée',
      postal_address: 'Dakar, Sénégal',
      phone: '+221338234567',
      website_url: 'https://printalma.com'
    },
    actions: {
      return_url: 'https://printalma.com/return',
      cancel_url: 'https://printalma.com/cancel',
      callback_url: 'https://webhook.site/f6e65778-b5b6-4050-9dfe-2e6ec6f84b69'
    }
  };

  console.log('4️⃣  DONNÉES DE L\'INVOICE:\n');
  console.log(JSON.stringify(invoiceData, null, 2));
  console.log('\n');

  try {
    console.log('5️⃣  ENVOI DE LA REQUÊTE...\n');

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
        timeout: 30000,
        validateStatus: () => true // Accepter tous les codes de réponse
      }
    );

    console.log('6️⃣  RÉPONSE COMPLÈTE:\n');
    console.log(`   Status HTTP: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}\n`);
    console.log('   Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    if (response.data.response_code === '00') {
      const paymentUrl = response.data.response_text;
      const invoiceToken = response.data.token;

      console.log('✅ INVOICE CRÉÉE AVEC SUCCÈS!\n');
      console.log(`   Token: ${invoiceToken}`);
      console.log(`   URL de paiement: ${paymentUrl}\n`);

      console.log('7️⃣  VÉRIFICATION IMMÉDIATE DU STATUT...\n');

      // Attendre 2 secondes
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await axios.get(
        `${apiUrl}/checkout-invoice/confirm/${invoiceToken}`,
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

      console.log('   Statut actuel:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
      console.log('\n');

      if (statusResponse.data.status === 'cancelled') {
        console.log('❌ L\'INVOICE EST DÉJÀ ANNULÉE!\n');
        console.log('Cela signifie que Paydunya rejette l\'invoice immédiatement.\n');
        console.log('Raisons possibles:');
        console.log('   1. Les clés API ne sont pas correctes');
        console.log('   2. Le compte n\'est pas entièrement activé');
        console.log('   3. Les URLs de callback ne sont pas valides');
        console.log('   4. Il y a une restriction sur le compte\n');
        console.log('RECOMMANDATION:');
        console.log('   → Vérifiez votre dashboard Paydunya: https://app.paydunya.com');
        console.log('   → Contactez le support Paydunya pour vérifier l\'état du compte\n');
      } else if (statusResponse.data.status === 'pending') {
        console.log('✅ L\'INVOICE EST ACTIVE!\n');
        console.log(`Vous pouvez tester le paiement à cette URL:\n${paymentUrl}\n`);
      }

    } else {
      console.log('❌ ERREUR LORS DE LA CRÉATION DE L\'INVOICE!\n');
      console.log(`   Code: ${response.data.response_code}`);
      console.log(`   Message: ${response.data.response_text}\n`);
    }

  } catch (error: any) {
    console.log('❌ ERREUR!\n');

    if (error.response) {
      console.log(`   Status HTTP: ${error.response.status}`);
      console.log(`   Réponse: ${JSON.stringify(error.response.data, null, 2)}\n`);
    } else if (error.request) {
      console.log(`   Erreur réseau: ${error.message}\n`);
    } else {
      console.log(`   Erreur: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
  await prisma.$disconnect();
}

testLiveInvoice().catch(console.error);
