const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateNewOrderWithTransactionId() {
  console.log('🧪 Simulation: Associer un transactionId à une commande existante');
  console.log('══════════════════════════════════════════════════════════════════════');

  try {
    // 1. Trouver une commande PayDunya sans transactionId
    console.log('\n🔍 1. Recherche d\'une commande PayDunya sans transactionId...');

    const orderWithoutToken = await prisma.order.findFirst({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        transactionId: null
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        email: true,
        createdAt: true
      }
    });

    if (!orderWithoutToken) {
      console.log('ℹ️  Aucune commande PayDunya sans transactionId trouvée');
      console.log('   -> Toutes les commandes ont déjà un transactionId');
      return;
    }

    console.log(`✅ Commande trouvée: ${orderWithoutToken.orderNumber}`);
    console.log(`   • Montant: ${orderWithoutToken.totalAmount} FCFA`);
    console.log(`   • Email: ${orderWithoutToken.email}`);
    console.log(`   • Créée le: ${orderWithoutToken.createdAt.toLocaleString()}`);

    // 2. Simuler un token PayDunya (utiliser un token de test réel)
    const testToken = 'test_dMZao0i32Q'; // Token que nous savons être "completed"

    console.log('\n💾 2. Simulation de la sauvegarde du transactionId...');
    console.log(`   • Token test: ${testToken}`);

    // 3. Mettre à jour la commande avec le transactionId
    await prisma.order.update({
      where: { id: orderWithoutToken.id },
      data: { transactionId: testToken }
    });

    console.log(`   ✅ TransactionId sauvegardé dans la commande ${orderWithoutToken.orderNumber}`);

    // 4. Créer un PaymentAttempt
    await prisma.paymentAttempt.create({
      data: {
        orderId: orderWithoutToken.id,
        orderNumber: orderWithoutToken.orderNumber,
        paymentMethod: 'paydunya',
        paytechToken: testToken,
        amount: orderWithoutToken.totalAmount,
        attemptedAt: new Date()
      }
    });

    console.log(`   ✅ PaymentAttempt créé pour la commande ${orderWithoutToken.orderNumber}`);

    // 5. Vérifier les mises à jour
    console.log('\n🔍 3. Vérification des mises à jour...');

    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderWithoutToken.id },
      select: {
        orderNumber: true,
        transactionId: true,
        paymentStatus: true,
        status: true
      }
    });

    const paymentAttempt = await prisma.paymentAttempt.findFirst({
      where: { orderId: orderWithoutToken.id },
      select: { paytechToken: true, amount: true }
    });

    console.log(`   • Commande ${updatedOrder.orderNumber}:`);
    console.log(`     - Transaction ID: ✅ ${updatedOrder.transactionId}`);
    console.log(`     - Payment Status: ${updatedOrder.paymentStatus}`);
    console.log(`     - Order Status: ${updatedOrder.status}`);

    console.log(`   • PaymentAttempt:`);
    console.log(`     - Token: ✅ ${paymentAttempt.paytechToken}`);
    console.log(`     - Amount: ${paymentAttempt.amount} FCFA`);

    console.log('\n🎉 4. Résultat:');
    console.log('   ✅ La commande est maintenant configurée correctement');
    console.log(`   ✅ Le cron job détectera cette commande dans son prochain cycle (15 secondes)`);
    console.log(`   ✅ Le token ${testToken} sera vérifié auprès de PayDunya`);

    console.log('\n📊 5. Surveillance du cron job:');
    console.log('   -> Surveillez les logs pour: "AUTOMATIC PAYMENT CHECK"');
    console.log('   -> Le paiement test_dMZao0i32Q est "completed" dans PayDunya');
    console.log('   -> La commande devrait passer automatiquement à PAID/CONFIRMED');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

simulateNewOrderWithTransactionId();