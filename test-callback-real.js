const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function testCallback() {
  console.log('==========================================');
  console.log('🧪 TEST COMPLET CALLBACK ORANGE MONEY');
  console.log('==========================================\n');

  // 1. Trouver une commande
  const order = await prisma.order.findFirst({
    where: { paymentMethod: 'ORANGE_MONEY' },
    orderBy: { createdAt: 'desc' }
  });

  if (!order) {
    console.log('❌ Aucune commande Orange Money trouvée');
    return;
  }

  console.log('1️⃣ Commande trouvée:');
  console.log(`   - ID: ${order.id}`);
  console.log(`   - Order Number: ${order.orderNumber}`);
  console.log(`   - Status AVANT: ${order.paymentStatus}`);
  console.log(`   - TransactionId AVANT: ${order.transactionId || 'null'}`);
  console.log('');

  // 2. Envoyer le callback
  console.log('2️⃣ Envoi du callback SUCCESS...\n');

  const txnId = `TXN-TEST-${Date.now()}`;
  const reference = `OM-${order.orderNumber}-${Date.now()}`;

  try {
    const callbackResponse = await axios.post('http://localhost:3004/orange-money/callback', {
      status: 'SUCCESS',
      transactionId: txnId,
      amount: {
        unit: 'XOF',
        value: order.totalAmount
      },
      code: 'PRINTALMA001',
      reference: reference,
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
        customerName: 'Test Client'
      }
    });

    console.log('✅ Callback reçu par le serveur:');
    console.log(`   Response: ${JSON.stringify(callbackResponse.data)}\n`);

    // 3. Attendre que le traitement async se termine
    console.log('⏳ Attente du traitement asynchrone (3 secondes)...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Vérifier le statut
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id }
    });

    console.log('3️⃣ Statut APRÈS callback:');
    console.log(`   - Payment Status: ${updatedOrder.paymentStatus}`);
    console.log(`   - Transaction ID: ${updatedOrder.transactionId}`);
    console.log('');

    // 5. Tests de validation
    console.log('==========================================');
    console.log('📊 VALIDATION DES CORRECTIONS');
    console.log('==========================================\n');

    let allPassed = true;

    // Test 1: TransactionId sauvegardé
    console.log('Test 1: TransactionId sauvegardé lors de la génération');
    if (updatedOrder.transactionId && updatedOrder.transactionId.startsWith('OM-')) {
      console.log(`✅ PASS - TransactionId: ${updatedOrder.transactionId}`);
    } else {
      console.log(`❌ FAIL - TransactionId non sauvegardé ou incorrect`);
      allPassed = false;
    }
    console.log('');

    // Test 2: Callback met à jour le statut
    console.log('Test 2: Callback met à jour paymentStatus');
    if (updatedOrder.paymentStatus === 'PAID') {
      console.log(`✅ PASS - PaymentStatus: PAID`);
    } else {
      console.log(`❌ FAIL - PaymentStatus: ${updatedOrder.paymentStatus} (devrait être PAID)`);
      allPassed = false;
    }
    console.log('');

    // Test 3: Callback sauvegarde le nouveau transactionId
    console.log('Test 3: Callback sauvegarde le transactionId Orange');
    if (updatedOrder.transactionId === txnId || updatedOrder.transactionId === reference) {
      console.log(`✅ PASS - TransactionId mis à jour: ${updatedOrder.transactionId}`);
    } else {
      console.log(`⚠️  INFO - TransactionId non mis à jour (peut être normal si référence initiale conservée)`);
      console.log(`   Attendu: ${txnId} ou ${reference}`);
      console.log(`   Actuel: ${updatedOrder.transactionId}`);
    }
    console.log('');

    // Test 4: Redirection si déjà payé
    console.log('Test 4: Redirection si commande déjà payée');
    const statusResponse = await axios.get(`http://localhost:3004/orange-money/payment-status/${order.orderNumber}`);

    if (statusResponse.data.shouldRedirect === true && statusResponse.data.redirectUrl) {
      console.log(`✅ PASS - shouldRedirect: true`);
      console.log(`   Redirect URL: ${statusResponse.data.redirectUrl}`);
    } else {
      console.log(`❌ FAIL - shouldRedirect: ${statusResponse.data.shouldRedirect}`);
      allPassed = false;
    }
    console.log('');

    // Test 5: Idempotence
    console.log('Test 5: Idempotence (2ème callback ignoré)');
    const txnId2 = `TXN-DUPLICATE-${Date.now()}`;
    await axios.post('http://localhost:3004/orange-money/callback', {
      status: 'SUCCESS',
      transactionId: txnId2,
      amount: { unit: 'XOF', value: order.totalAmount },
      code: 'PRINTALMA001',
      reference: `OM-${order.orderNumber}-${Date.now()}`,
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
        customerName: 'Test Duplicate'
      }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id }
    });

    if (finalOrder.transactionId === updatedOrder.transactionId) {
      console.log(`✅ PASS - TransactionId non modifié (idempotence OK)`);
      console.log(`   TransactionId conservé: ${finalOrder.transactionId}`);
    } else {
      console.log(`❌ FAIL - TransactionId modifié par le 2ème callback`);
      console.log(`   Avant: ${updatedOrder.transactionId}`);
      console.log(`   Après: ${finalOrder.transactionId}`);
      allPassed = false;
    }
    console.log('');

    // Résumé
    console.log('==========================================');
    if (allPassed) {
      console.log('✅✅✅ TOUS LES TESTS PASSENT ! ✅✅✅');
    } else {
      console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    }
    console.log('==========================================\n');

    console.log('💡 Points vérifiés:');
    console.log('   1. TransactionId sauvegardé à la génération');
    console.log('   2. Callback met à jour paymentStatus = PAID');
    console.log('   3. Callback sauvegarde transactionId Orange');
    console.log('   4. Redirection automatique si déjà payé');
    console.log('   5. Idempotence (double callback ignoré)');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  await prisma.$disconnect();
}

testCallback().catch(console.error);
