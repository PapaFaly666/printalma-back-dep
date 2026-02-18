import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testInvoiceCreation() {
  console.log('🧪 Test de création d\'invoice PayDunya\n');

  // Récupérer la configuration
  const config = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!config) {
    console.log('❌ Aucune configuration PayDunya trouvée');
    await prisma.$disconnect();
    return;
  }

  const mode = config.activeMode;
  console.log('📋 Configuration:');
  console.log('   Mode:', mode);
  console.log('');

  // Sélectionner les clés selon le mode
  let masterKey, privateKey, token, apiUrl;

  if (mode === 'live') {
    masterKey = config.liveMasterKey;
    privateKey = config.livePrivateKey;
    token = config.liveToken;
    apiUrl = 'https://app.paydunya.com/api/v1';
    console.log('🔑 Utilisation des clés LIVE');
  } else {
    masterKey = config.testMasterKey;
    privateKey = config.testPrivateKey;
    token = config.testToken;
    apiUrl = 'https://app.paydunya.com/sandbox-api/v1';
    console.log('🔑 Utilisation des clés TEST');
  }

  console.log('   Master Key:', masterKey?.substring(0, 15) + '...');
  console.log('   Private Key:', privateKey?.substring(0, 15) + '...');
  console.log('   Token:', token?.substring(0, 15) + '...');
  console.log('   API URL:', apiUrl);
  console.log('');

  // Créer une invoice de test
  const invoiceData = {
    invoice: {
      total_amount: 200,
      description: 'Test invoice - Mode ' + mode.toUpperCase()
    },
    store: {
      name: 'Printalma Test'
    },
    actions: {
      return_url: 'https://example.com/return',
      cancel_url: 'https://example.com/cancel',
      callback_url: 'https://example.com/callback'
    }
  };

  try {
    console.log('📤 Envoi de la requête à PayDunya...');
    const response = await axios.post(
      `${apiUrl}/checkout-invoice/create`,
      invoiceData,
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Invoice créée avec succès!\n');
    console.log('📋 Réponse PayDunya:');
    console.log('   Response Code:', response.data.response_code);
    console.log('   Response Text:', response.data.response_text);
    console.log('   Token:', response.data.token);
    console.log('   Description:', response.data.description);
    console.log('');

    // Analyser le token
    const invoiceToken = response.data.token;
    if (invoiceToken?.startsWith('test_')) {
      console.log('⚠️  Le token commence par "test_" - VOUS ÊTES EN MODE TEST');
      console.log('   Vérifiez que vous utilisez bien les bonnes clés LIVE de PayDunya');
    } else if (invoiceToken?.startsWith('live_')) {
      console.log('✅ Le token commence par "live_" - VOUS ÊTES EN MODE PRODUCTION');
    } else {
      console.log('ℹ️  Le token ne contient pas de préfixe explicite');
      console.log('   Token:', invoiceToken);
    }

    console.log('');
    console.log('🔗 URL de paiement:');
    console.log('   ', response.data.response_text);

  } catch (error) {
    console.log('❌ Erreur lors de la création de l\'invoice:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    } else {
      console.log('   Message:', error.message);
    }
  }

  await prisma.$disconnect();
}

testInvoiceCreation().catch(console.error);
