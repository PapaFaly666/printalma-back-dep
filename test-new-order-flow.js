const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testNewOrderFlow() {
  console.log('🧪 Test du flux complet: Création commande → TransactionId → Détection cron job');
  console.log('══════════════════════════════════════════════════════════════════════');

  try {
    // 1. Vérifier les commandes PayDunya récentes
    console.log('\n📊 1. Vérification des commandes PayDunya récentes...');

    const recentOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // dernières 24h
        }
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        transactionId: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`✅ Trouvé ${recentOrders.length} commande(s) PayDunya récentes`);

    if (recentOrders.length === 0) {
      console.log('ℹ️  Aucune commande PayDunya récente trouvée pour tester');
      console.log('   -> Créez une nouvelle commande PayDunya pour tester ce flux');
      return;
    }

    // 2. Analyser chaque commande
    console.log('\n🔍 2. Analyse détaillée des commandes...');

    for (const order of recentOrders) {
      console.log(`\n📋 Commande: ${order.orderNumber}`);
      console.log(`   • Montant: ${order.totalAmount} FCFA`);
      console.log(`   • Email: ${order.email || 'Non fourni'}`);
      console.log(`   • Créée le: ${order.createdAt.toLocaleString()}`);
      console.log(`   • Transaction ID: ${order.transactionId || '❌ MANQUANT'}`);

      // 3. Vérifier le PaymentAttempt associé
      const paymentAttempt = await prisma.paymentAttempt.findFirst({
        where: {
          orderId: order.id,
          paymentMethod: 'paydunya'
        },
        select: {
          paytechToken: true,
          attemptedAt: true,
          amount: true
        }
      });

      if (paymentAttempt) {
        console.log(`   • Payment Token: ✅ ${paymentAttempt.paytechToken}`);
        console.log(`   • Token Amount: ${paymentAttempt.amount} FCFA`);
        console.log(`   • Tentative le: ${paymentAttempt.attemptedAt.toLocaleString()}`);

        // 4. Si on a un token, tester le statut PayDunya
        if (paymentAttempt.paytechToken) {
          console.log(`   🔍 Vérification du statut PayDunya...`);

          try {
            const response = await axios.get(`http://localhost:3004/paydunya/status/${paymentAttempt.paytechToken}`);
            const paymentStatus = response.data.data;

            console.log(`   • Statut PayDunya: ${paymentStatus.status}`);
            console.log(`   • Response Code: ${paymentStatus.response_code}`);

            if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
              console.log(`   ✅ PAIEMENT VALIDÉ - Le cron job devrait traiter cette commande!`);
            } else {
              console.log(`   ⏳ Paiement en attente ou autre statut`);
            }
          } catch (error) {
            console.log(`   ❌ Erreur lors de la vérification: ${error.message}`);
          }
        }
      } else {
        console.log(`   • Payment Token: ❌ AUCUN PAYMENT ATTEMPT`);
      }
    }

    // 5. Résumé pour le cron job
    console.log('\n📊 3. Résumé pour le cron job...');

    const ordersWithTokens = recentOrders.filter(order => order.transactionId);
    const ordersWithPaymentAttempts = await Promise.all(
      recentOrders.map(async (order) => {
        const attempt = await prisma.paymentAttempt.findFirst({
          where: { orderId: order.id, paymentMethod: 'paydunya' }
        });
        return { order, hasAttempt: !!attempt };
      })
    );

    const ordersWithAttempts = ordersWithPaymentAttempts.filter(item => item.hasAttempt).length;

    console.log(`   • Commandes avec transactionId: ${ordersWithTokens.length}/${recentOrders.length}`);
    console.log(`   • Commandes avec PaymentAttempt: ${ordersWithAttempts}/${recentOrders.length}`);
    console.log(`   • Commandes complètes (transactionId + PaymentAttempt): ${ordersWithTokens.length}/${recentOrders.length}`);

    if (ordersWithTokens.length === recentOrders.length) {
      console.log('\n✅ EXCELLENT! Toutes les commandes ont un transactionId');
      console.log('   -> Le cron job pourra détecter et traiter automatiquement ces paiements!');
    } else {
      console.log('\n⚠️  Certaines commandes n\'ont pas de transactionId');
      console.log('   -> Les nouvelles commandes devraient maintenant être correctement configurées');
    }

    // 6. Instructions
    console.log('\n📝 4. Instructions pour tester le flux complet:');
    console.log('   1. Créez une nouvelle commande PayDunya via l\'API ou le frontend');
    console.log('   2. Vérifiez que le transactionId est sauvegardé');
    console.log('   3. Payez la commande via PayDunya');
    console.log('   4. Le cron job devrait automatiquement la détecter et la mettre à jour');
    console.log('   5. Vérifiez les logs: "AUTOMATIC PAYMENT CHECK" toutes les 15 secondes');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testNewOrderFlow();