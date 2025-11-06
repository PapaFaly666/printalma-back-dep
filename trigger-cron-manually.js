const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function triggerCronManually() {
  console.log('🔧 Déclenchement manuel du cron job PayDunya');
  console.log('═════════════════════════════════════════════════════════');

  try {
    // 1. Trouver la commande avec le token
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: 'ORD-1762430030426'
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        status: true
      }
    });

    if (!order) {
      console.log('❌ Commande non trouvée');
      return;
    }

    console.log(`📊 Commande trouvée: ${order.orderNumber}`);
    console.log(`   Statut actuel: ${order.paymentStatus}/${order.status}`);

    // 2. Trouver le token PayDunya
    const paymentAttempt = await prisma.paymentAttempt.findFirst({
      where: {
        orderId: order.id,
        paymentMethod: 'paydunya'
      },
      orderBy: {
        attemptedAt: 'desc'
      },
      select: {
        paytechToken: true
      }
    });

    if (!paymentAttempt?.paytechToken) {
      console.log('❌ Aucun token PayDunya trouvé');
      return;
    }

    console.log(`🔑 Token PayDunya: ${paymentAttempt.paytechToken}`);

    // 3. Vérifier le statut auprès de PayDunya
    console.log('\n🔍 Vérification du statut PayDunya...');

    const response = await axios.get(`http://localhost:3004/paydunya/status/${paymentAttempt.paytechToken}`);
    const paymentStatus = response.data.data;

    console.log(`   Statut PayDunya: ${paymentStatus.status}`);
    console.log(`   Response code: ${paymentStatus.response_code}`);

    // 4. Si le paiement est complété, mettre à jour la commande
    if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
      console.log('\n✅ Paiement complété ! Mise à jour de la commande...');

      // Simuler la mise à jour que ferait le cron job
      await prisma.order.update({
        where: {
          id: order.id
        },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          updatedAt: new Date()
        }
      });

      console.log('✅ Commande mise à jour avec succès !');
      console.log('   -> Payment status: PENDING → PAID');
      console.log('   -> Order status: PENDING → CONFIRMED');

      // Vérification
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        select: { paymentStatus: true, status: true, updatedAt: true }
      });

      console.log(`   -> Mis à jour le: ${updatedOrder.updatedAt}`);

    } else {
      console.log('\n⏳ Le paiement n\'est pas encore complété');
      console.log(`   -> Statut actuel: ${paymentStatus.status}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

triggerCronManually();