import { PrismaClient } from '@prisma/client';

/**
 * Script pour lister toutes les commandes PayDunya en attente
 * et afficher leurs tokens pour diagnostic
 */

const prisma = new PrismaClient();

async function listPendingOrders() {
  console.log('📋 COMMANDES PAYDUNYA EN ATTENTE\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30,
      include: {
        paymentAttemptsHistory: {
          orderBy: { attemptedAt: 'desc' },
          take: 1
        }
      }
    });

    if (orders.length === 0) {
      console.log('✅ Aucune commande PayDunya en attente');
      return;
    }

    console.log(`📦 ${orders.length} commande(s) en attente:\n`);

    orders.forEach((order, index) => {
      const ageMinutes = Math.round((Date.now() - order.createdAt.getTime()) / 60000);
      const lastAttempt = order.paymentAttemptsHistory[0];

      console.log(`${index + 1}. ${order.orderNumber}`);
      console.log(`   💰 Montant: ${order.totalAmount} FCFA`);
      console.log(`   📧 Email: ${order.email}`);
      console.log(`   🔑 Token: ${order.transactionId || 'Aucun'}`);
      console.log(`   🕐 Créée il y a: ${ageMinutes} min`);
      console.log(`   🔄 Tentatives: ${order.paymentAttempts}`);

      if (lastAttempt) {
        console.log(`   📊 Dernière tentative:`);
        console.log(`      Status: ${lastAttempt.status}`);
        console.log(`      Token: ${lastAttempt.paytechToken || 'N/A'}`);
        console.log(`      Date: ${lastAttempt.attemptedAt.toISOString()}`);
        if (lastAttempt.failureReason) {
          console.log(`      Échec: ${lastAttempt.failureReason} (${lastAttempt.failureCategory})`);
        }
      }

      // Diagnostic
      if (!order.transactionId) {
        console.log(`   ⚠️  ATTENTION: Pas de token - Paiement jamais initié`);
      } else if (order.transactionId.startsWith('test_')) {
        console.log(`   ℹ️  Token de test PayDunya`);
      }

      console.log();
    });

    // Statistiques
    const withToken = orders.filter(o => o.transactionId).length;
    const withoutToken = orders.filter(o => !o.transactionId).length;
    const withAttempts = orders.filter(o => o.paymentAttempts > 0).length;

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Statistiques:');
    console.log(`   Total: ${orders.length}`);
    console.log(`   Avec token: ${withToken}`);
    console.log(`   Sans token: ${withoutToken}`);
    console.log(`   Avec tentatives: ${withAttempts}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Commandes anciennes
    const oldOrders = orders.filter(o => {
      const ageHours = (Date.now() - o.createdAt.getTime()) / 3600000;
      return ageHours > 24;
    });

    if (oldOrders.length > 0) {
      console.log(`⚠️  ${oldOrders.length} commande(s) de plus de 24h en attente:`);
      oldOrders.forEach(o => {
        const ageHours = Math.round((Date.now() - o.createdAt.getTime()) / 3600000);
        console.log(`   - ${o.orderNumber} (${ageHours}h)`);
      });
      console.log();
      console.log(`💡 Recommandation: Marquer ces commandes comme FAILED ou contacter les clients`);
      console.log();
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listPendingOrders().catch(console.error);
