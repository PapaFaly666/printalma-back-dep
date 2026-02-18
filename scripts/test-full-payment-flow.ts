import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testFullPaymentFlow() {
  console.log('🧪 TEST COMPLET DU FLUX DE PAIEMENT PAYDUNYA\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Vérifier la configuration en BDD
  console.log('1️⃣  CONFIGURATION BASE DE DONNÉES');
  const dbConfig = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!dbConfig) {
    console.log('❌ Aucune configuration active en BDD\n');
  } else {
    console.log('✅ Configuration trouvée en BDD');
    console.log(`   Mode: ${dbConfig.activeMode}`);
    console.log(`   Master Key LIVE: ${dbConfig.liveMasterKey?.substring(0, 20)}...`);
    console.log(`   Private Key LIVE: ${dbConfig.livePrivateKey?.substring(0, 25)}...`);
    console.log(`   Token LIVE: ${dbConfig.liveToken?.substring(0, 20)}...\n`);
  }

  // 2. Vérifier les variables d'environnement
  console.log('2️⃣  VARIABLES D\'ENVIRONNEMENT (.env)');
  const envMasterKey = process.env.PAYDUNYA_MASTER_KEY;
  const envPrivateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const envToken = process.env.PAYDUNYA_TOKEN;
  const envMode = process.env.PAYDUNYA_MODE;

  console.log(`   Mode: ${envMode}`);
  console.log(`   Master Key: ${envMasterKey?.substring(0, 20)}...`);
  console.log(`   Private Key: ${envPrivateKey?.substring(0, 25)}...`);
  console.log(`   Token: ${envToken?.substring(0, 20)}...\n`);

  // 3. Déterminer quelle configuration sera utilisée
  console.log('3️⃣  CONFIGURATION QUI SERA UTILISÉE');
  const mode = dbConfig?.activeMode || envMode || 'test';
  const masterKey = dbConfig?.activeMode === 'live'
    ? dbConfig.liveMasterKey
    : dbConfig?.testMasterKey || envMasterKey;
  const privateKey = dbConfig?.activeMode === 'live'
    ? dbConfig.livePrivateKey
    : dbConfig?.testPrivateKey || envPrivateKey;
  const token = dbConfig?.activeMode === 'live'
    ? dbConfig.liveToken
    : dbConfig?.testToken || envToken;

  console.log(`   Source: ${dbConfig ? 'Base de données' : 'Variables d\'environnement'}`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Master Key: ${masterKey?.substring(0, 20)}...`);
  console.log(`   Private Key: ${privateKey?.substring(0, 25)}...`);
  console.log(`   Token: ${token?.substring(0, 20)}...\n`);

  // 4. Déterminer l'URL de l'API
  const apiUrl = mode === 'live'
    ? 'https://app.paydunya.com/api/v1'
    : 'https://app.paydunya.com/sandbox-api/v1';

  console.log('4️⃣  URL DE L\'API PAYDUNYA');
  console.log(`   ${apiUrl}\n`);

  // 5. Tester la création d'une invoice
  console.log('5️⃣  TEST DE CRÉATION D\'INVOICE');
  console.log('   Envoi de la requête...\n');

  const invoiceData = {
    invoice: {
      total_amount: 500,
      description: `Test ${mode.toUpperCase()} - ${new Date().toISOString()}`
    },
    store: {
      name: 'Printalma Test'
    },
    actions: {
      return_url: 'https://printalma.com/return',
      cancel_url: 'https://printalma.com/cancel',
      callback_url: 'https://printalma.com/callback'
    }
  };

  try {
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
        timeout: 10000
      }
    );

    console.log('✅ SUCCÈS!\n');
    console.log('📋 RÉPONSE PAYDUNYA:');
    console.log(`   Response Code: ${response.data.response_code}`);
    console.log(`   Response Text: ${response.data.response_text}`);
    console.log(`   Token: ${response.data.token}`);
    console.log(`   Description: ${response.data.description}\n`);

    // Analyser le token
    if (response.data.token?.startsWith('test_')) {
      console.log('⚠️  TOKEN COMMENCE PAR "test_"');
      console.log('   Vous êtes en MODE TEST\n');
    } else if (response.data.token?.startsWith('live_')) {
      console.log('✅ TOKEN COMMENCE PAR "live_"');
      console.log('   Vous êtes en MODE PRODUCTION\n');
    } else {
      console.log('ℹ️  Token sans préfixe explicite');
      console.log(`   Token: ${response.data.token}\n`);
    }

    // URL de paiement
    const paymentUrl = response.data.response_text;
    console.log('🔗 URL DE PAIEMENT:');
    console.log(`   ${paymentUrl}\n`);

    if (paymentUrl.includes('/sandbox-checkout/')) {
      console.log('⚠️  URL CONTIENT "/sandbox-checkout/"');
      console.log('   Vous êtes en MODE TEST\n');
    } else if (paymentUrl.includes('paydunya.com/checkout/')) {
      console.log('✅ URL DE PRODUCTION');
      console.log('   Format: https://paydunya.com/checkout/invoice/{token}\n');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.log('❌ ERREUR!\n');

    if (error.response) {
      console.log('📥 RÉPONSE D\'ERREUR PAYDUNYA:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response Code: ${error.response.data?.response_code}`);
      console.log(`   Response Text: ${error.response.data?.response_text}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
    } else if (error.request) {
      console.log('📡 AUCUNE RÉPONSE DU SERVEUR:');
      console.log(`   Message: ${error.message}`);
      console.log(`   Code: ${error.code}\n`);
    } else {
      console.log('⚙️  ERREUR DE CONFIGURATION:');
      console.log(`   Message: ${error.message}\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('❌ TEST ÉCHOUÉ');
    console.log('═══════════════════════════════════════════════════\n');
  }

  await prisma.$disconnect();
}

testFullPaymentFlow().catch(console.error);
