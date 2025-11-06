const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3004';

async function testCronJob() {
  console.log('🧪 Test du cron job PayDunya');
  console.log('═════════════════════════════════════════');

  try {
    // Utiliser directement le token de notre commande test
    const testToken = 'test_ryUTPqOML6';
    const testOrderNumber = 'ORD-1762428863949';

    console.log(`\n🔍 Test avec la commande ${testOrderNumber}`);
    console.log(`   Token: ${testToken}`);

    // Simuler le comportement du cron job avec notre token
    const order = await prisma.order.findUnique({
      where: { orderNumber: testOrderNumber },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
      }
    });

    if (!order) {
      console.log('❌ Commande non trouvée');
      return;
    }

    console.log(`   Statut actuel: ${order.paymentStatus} / ${order.status}`);

      // Vérifier le statut auprès de PayDunya
    try {
      const response = await axios.get(`${BASE_URL}/paydunya/status/${testToken}`);
      const paymentStatus = response.data.data;

      console.log(`   Statut PayDunya: ${paymentStatus.status}`);
      console.log(`   Response code: ${paymentStatus.response_code}`);

      // Si le paiement est complété, simuler la mise à jour du cron
      if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
        console.log('✅ Paiement complété ! Simulation de la mise à jour du cron...');

        // Simuler le comportement du cron job
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            transactionId: testToken,
          },
        });

        console.log('✅ Commande mise à jour: PAID/CONFIRMED');
      } else if (paymentStatus.status === 'cancelled' || paymentStatus.status === 'failed') {
        console.log(`❌ Paiement ${paymentStatus.status.toUpperCase()}`);

        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
          },
        });

        console.log('✅ Commande mise à jour: FAILED/CANCELLED');
      } else {
        console.log('⏳ Toujours en attente');
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification: ${error.message}`);
    }

    // Vérification finale
    console.log('\n📊 Vérification finale des statuts...');

    const finalOrder = await prisma.order.findUnique({
      where: { orderNumber: testOrderNumber },
      select: {
        orderNumber: true,
        paymentStatus: true,
        status: true,
        transactionId: true,
      }
    });

    console.log('\nRésultat final:');
    console.log(`   ${finalOrder.orderNumber}: ${finalOrder.paymentStatus} / ${finalOrder.status}`);
    console.log(`   Transaction ID: ${finalOrder.transactionId}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCronJob();