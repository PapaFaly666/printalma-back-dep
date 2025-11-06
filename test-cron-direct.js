const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3004';

async function testCronDirectly() {
  console.log('🧪 Test direct du cron job PayDunya');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. Récupérer les commandes PayDunya en attente
    console.log('\n📊 1. Récupération des commandes PayDunya en attente...');

    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING',
        status: 'PENDING',
      },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true,
        totalAmount: true,
        createdAt: true,
        email: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3
    });

    console.log(`✅ Trouvé ${pendingOrders.length} commande(s) en attente`);

    if (pendingOrders.length === 0) {
      console.log('ℹ️  Aucune commande à tester');
      return;
    }

    // 2. Pour chaque commande, chercher le token PayDunya
    for (const order of pendingOrders) {
      console.log(`\n🔍 Test de la commande ${order.orderNumber}`);

      // Le problème : chercher le token dans les PaymentAttempt
      const paymentAttempt = await prisma.paymentAttempt.findFirst({
        where: {
          orderId: order.id,
          paymentMethod: 'paydunya',
        },
        orderBy: {
          attemptedAt: 'desc',
        },
        select: {
          paytechToken: true,
        },
      });

      const token = paymentAttempt?.paytechToken || order.transactionId;

      if (!token) {
        console.log(`⚠️  Aucun token PayDunya trouvé pour ${order.orderNumber}`);
        console.log('   -> C\'est normal, le token n\'est pas sauvegardé lors de la création');

        // Simuler que le token est celui que tu as mentionné
        console.log('   -> Simulation avec le token test_BMsjlOT10F');

        // 3. Vérifier le statut auprès de PayDunya avec le token que tu as donné
        console.log(`🔍 Vérification avec le token test_BMsjlOT10F...`);

        try {
          const response = await axios.get(`${BASE_URL}/paydunya/status/test_BMsjlOT10F`);
          const paymentStatus = response.data.data;

          console.log(`   Statut PayDunya: ${paymentStatus.status}`);
          console.log(`   Response code: ${paymentStatus.response_code}`);

          // 4. Si le paiement est complété, simuler la mise à jour
          if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
            console.log('✅ Paiement complété détecté ! Simulation de la mise à jour...');
            console.log(`   -> Le cron job devrait mettre à jour la commande ${order.orderNumber}`);
            console.log('   -> Mais il ne le fait pas car il ne trouve pas le token associé');

            // Ici on voit que le cron ne peut pas trouver le token
            console.log('   -> Problème: le cron ne peut pas faire la correspondance entre le paiement et la commande');

          } else {
            console.log('⏳ Toujours en attente');
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la vérification: ${error.message}`);
        }

        break; // On teste juste la première commande
      } else {
        console.log(`   Token trouvé: ${token}`);
        console.log('   -> Le cron devrait pouvoir traiter cette commande');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCronDirectly();