import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function checkInvoiceStatus(token: string) {
  console.log(`\n🔍 VÉRIFICATION DU STATUT DE L'INVOICE: ${token}\n`);
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
  const masterKey = mode === 'test' ? dbConfig.testMasterKey : dbConfig.liveMasterKey;
  const privateKey = mode === 'test' ? dbConfig.testPrivateKey : dbConfig.livePrivateKey;
  const tokenKey = mode === 'test' ? dbConfig.testToken : dbConfig.liveToken;

  const apiUrl = mode === 'test'
    ? 'https://app.paydunya.com/sandbox-api/v1'
    : 'https://app.paydunya.com/api/v1';

  console.log(`Mode actif: ${mode.toUpperCase()}`);
  console.log(`API URL: ${apiUrl}\n`);

  try {
    console.log('📡 Envoi de la requête de vérification...\n');

    const response = await axios.get(
      `${apiUrl}/checkout-invoice/confirm/${token}`,
      {
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': tokenKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ RÉPONSE REÇUE\n');
    console.log('📋 DÉTAILS COMPLETS:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    console.log('📊 RÉSUMÉ:');
    console.log(`   Response Code: ${response.data.response_code}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Response Text: ${response.data.response_text}`);

    if (response.data.invoice) {
      console.log(`\n   Invoice Details:`);
      console.log(`      Total Amount: ${response.data.invoice.total_amount}`);
      console.log(`      Description: ${response.data.invoice.description}`);
    }

    if (response.data.receipt_url) {
      console.log(`\n   Receipt URL: ${response.data.receipt_url}`);
    }

    console.log('\n');

    // Interpréter le statut
    if (response.data.status === 'completed') {
      console.log('✅ STATUT: Paiement RÉUSSI\n');
    } else if (response.data.status === 'cancelled') {
      console.log('❌ STATUT: Paiement ANNULÉ\n');
      console.log('Raisons possibles:');
      console.log('   - L\'utilisateur a annulé le paiement');
      console.log('   - Timeout (l\'utilisateur n\'a pas payé dans les délais)');
      console.log('   - Erreur lors du traitement\n');
    } else if (response.data.status === 'failed') {
      console.log('❌ STATUT: Paiement ÉCHOUÉ\n');
      console.log('Raisons possibles:');
      console.log('   - Fonds insuffisants');
      console.log('   - Erreur de transaction');
      console.log('   - Problème avec le moyen de paiement\n');
    } else if (response.data.status === 'pending') {
      console.log('⏳ STATUT: Paiement EN ATTENTE\n');
      console.log('L\'utilisateur n\'a pas encore finalisé le paiement\n');
    } else {
      console.log(`ℹ️  STATUT: ${response.data.status}\n`);
    }

  } catch (error: any) {
    console.log('❌ ERREUR LORS DE LA VÉRIFICATION\n');

    if (error.response) {
      console.log(`Status HTTP: ${error.response.status}`);
      console.log(`Réponse: ${JSON.stringify(error.response.data, null, 2)}\n`);
    } else if (error.request) {
      console.log(`Erreur réseau: ${error.message}\n`);
    } else {
      console.log(`Erreur: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
  await prisma.$disconnect();
}

const token = process.argv[2];

if (!token) {
  console.log('\n❌ Veuillez fournir un token PayDunya\n');
  console.log('Usage: npx ts-node scripts/check-invoice-status.ts <token>\n');
  console.log('Exemple: npx ts-node scripts/check-invoice-status.ts lrR1pLwyGerDvnoQoFCD\n');
  process.exit(1);
}

checkInvoiceStatus(token).catch(console.error);
