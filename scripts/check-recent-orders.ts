import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentOrders() {
  console.log('\n📋 COMMANDES RÉCENTES PAYDUNYA\n');
  console.log('═══════════════════════════════════════════════════\n');

  const recentOrders = await prisma.order.findMany({
    where: {
      paymentMethod: 'PAYDUNYA',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      status: true,
      totalAmount: true,
      transactionId: true,
      createdAt: true,
      updatedAt: true,
      notes: true,
    },
  });

  if (recentOrders.length === 0) {
    console.log('❌ Aucune commande PayDunya trouvée\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`Trouvé ${recentOrders.length} commande(s) récente(s):\n`);

  for (const order of recentOrders) {
    const statusIcon = order.paymentStatus === 'PAID' ? '✅' :
                       order.paymentStatus === 'PENDING' ? '⏳' :
                       order.paymentStatus === 'FAILED' ? '❌' : '❓';

    console.log(`${statusIcon} ${order.orderNumber}`);
    console.log(`   Statut paiement: ${order.paymentStatus}`);
    console.log(`   Statut commande: ${order.status}`);
    console.log(`   Montant: ${order.totalAmount} FCFA`);
    console.log(`   Transaction ID: ${order.transactionId || 'N/A'}`);
    console.log(`   Créée: ${order.createdAt}`);
    console.log(`   Mise à jour: ${order.updatedAt}`);

    if (order.notes) {
      console.log(`   Notes: ${order.notes.substring(0, 200)}${order.notes.length > 200 ? '...' : ''}`);
    }

    console.log('');
  }

  // Chercher les PaymentAttempt pour la dernière commande échouée
  const failedOrder = recentOrders.find(o => o.paymentStatus === 'FAILED');

  if (failedOrder) {
    console.log('═══════════════════════════════════════════════════');
    console.log(`\n🔍 DÉTAILS DE LA DERNIÈRE COMMANDE ÉCHOUÉE: ${failedOrder.orderNumber}\n`);

    const paymentAttempts = await prisma.paymentAttempt.findMany({
      where: {
        orderId: failedOrder.id,
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    console.log(`Nombre de tentatives: ${paymentAttempts.length}\n`);

    for (const attempt of paymentAttempts) {
      console.log(`Tentative ${attempt.attemptNumber}:`);
      console.log(`   Méthode: ${attempt.paymentMethod}`);
      console.log(`   Statut: ${attempt.status}`);
      console.log(`   Token: ${attempt.paytechToken || 'N/A'}`);
      console.log(`   Date: ${attempt.attemptedAt}`);

      if (attempt.failureReason || attempt.failureMessage) {
        console.log(`   Erreur:`);
        if (attempt.failureReason) console.log(`      Raison: ${attempt.failureReason}`);
        if (attempt.failureCategory) console.log(`      Catégorie: ${attempt.failureCategory}`);
        if (attempt.failureCode) console.log(`      Code: ${attempt.failureCode}`);
        if (attempt.failureMessage) console.log(`      Message: ${attempt.failureMessage}`);
        if (attempt.processorResponse) console.log(`      Réponse: ${attempt.processorResponse}`);
      }

      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════\n');
  await prisma.$disconnect();
}

checkRecentOrders().catch(console.error);
