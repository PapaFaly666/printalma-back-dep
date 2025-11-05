const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrderStatus() {
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'ORD-1762365653324' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        totalAmount: true,
        paymentAttempts: true,
        lastPaymentAttemptAt: true,
        hasInsufficientFunds: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (order) {
      console.log('\n✅ Commande trouvée dans la base de données:');
      console.log('==========================================');
      console.log(JSON.stringify(order, null, 2));
      console.log('==========================================');
      console.log('\n📊 Résumé:');
      console.log(`  - Statut de la commande: ${order.status}`);
      console.log(`  - Statut du paiement: ${order.paymentStatus}`);
      console.log(`  - Transaction ID: ${order.transactionId || 'N/A'}`);
      console.log(`  - Tentatives de paiement: ${order.paymentAttempts}`);

      if (order.paymentStatus === 'PAID') {
        console.log('\n✅ LE WEBHOOK A ÉTÉ TRAITÉ AVEC SUCCÈS!');
        console.log('   Le paiement a été confirmé dans la base de données.');
      } else {
        console.log('\n⚠️  Le webhook n\'a pas encore été traité ou a échoué.');
      }
    } else {
      console.log('❌ Commande non trouvée dans la base de données.');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderStatus();
