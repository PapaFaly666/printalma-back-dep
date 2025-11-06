const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testCronManually() {
  console.log('🧪 Test manuel du cron job PayDunya');
  console.log('═════════════════════════════════════════════════════════');

  try {
    // 1. Vérifier le paiement test_BMsjlOT10F
    console.log('\n🔍 1. Vérification du paiement test_BMsjlOT10F...');

    const response = await axios.get('http://localhost:3004/paydunya/status/test_BMsjlOT10F');
    const paymentStatus = response.data.data;

    console.log(`   Statut: ${paymentStatus.status}`);
    console.log(`   Response code: ${paymentStatus.response_code}`);
    console.log(`   Token: ${paymentStatus.invoice.token}`);
    console.log(`   Order ID: ${paymentStatus.custom_data.orderId}`);
    console.log(`   Order Number: ${paymentStatus.custom_data.orderNumber}`);

    // 2. Trouver la commande associée dans la base
    console.log('\n📊 2. Recherche de la commande associée...');

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: paymentStatus.custom_data.orderNumber
      },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        status: true,
        totalAmount: true,
        email: true,
        transactionId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (order) {
      console.log(`   Commande trouvée: ${order.orderNumber}`);
      console.log(`   Statut paiement: ${order.paymentStatus}`);
      console.log(`   Statut commande: ${order.status}`);
      console.log(`   Transaction ID: ${order.transactionId}`);
      console.log(`   Créée le: ${order.createdAt}`);
      console.log(`   Modifiée le: ${order.updatedAt}`);

      // 3. Vérifier si la commande doit être mise à jour
      if (order.paymentStatus === 'PENDING' && paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
        console.log('\n✅ 3. La commande DOIT être mise à jour !');
        console.log('   -> Paiement complété chez PayDunya');
        console.log('   -> Commande encore en attente dans la base');
        console.log('   -> Le cron job devrait la traiter');

        // 4. Simuler ce que le cron job devrait faire
        console.log('\n🔧 4. Simulation du traitement du cron job...');

        console.log('   Recherche du token dans PaymentAttempt...');
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

        const token = paymentAttempt?.paytechToken || order.transactionId;
        console.log(`   Token trouvé: ${token || 'AUCUN'}`);

        if (!token) {
          console.log('   ⚠️  PROBLÈME: Aucun token PayDunya trouvé pour cette commande');
          console.log('   -> Le cron job ne peut pas faire la correspondance');
          console.log('   -> Solution: Il faut sauvegarder le token lors de la création du paiement');
        } else {
          console.log('   ✅ Token trouvé, le cron job pourrait traiter cette commande');
        }

      } else if (order.paymentStatus === 'PAID') {
        console.log('\n✅ 3. La commande est déjà mise à jour (PAID)');
        console.log('   -> Le cron job a déjà fonctionné ou un webhook a été reçu');
      } else {
        console.log('\n⏳ 3. La commande ne nécessite pas de mise à jour');
        console.log(`   -> Statut paiement: ${order.paymentStatus}`);
        console.log(`   -> Statut PayDunya: ${paymentStatus.status}`);
      }

    } else {
      console.log(`   ❌ Commande ${paymentStatus.custom_data.orderNumber} non trouvée`);
    }

    // 5. Lister les autres commandes en attente
    console.log('\n📋 5. Autres commandes PayDunya en attente:');

    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING',
        status: 'PENDING'
      },
      select: {
        orderNumber: true,
        totalAmount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    if (pendingOrders.length > 0) {
      console.log(`   ${pendingOrders.length} commande(s) en attente:`);
      pendingOrders.forEach(o => {
        console.log(`   - ${o.orderNumber} (${o.totalAmount} FCFA - ${o.createdAt.toLocaleDateString()})`);
      });
    } else {
      console.log('   Aucune autre commande en attente');
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('═════════════════════════════════════════════════════════');

    if (order && order.paymentStatus === 'PENDING' && paymentStatus.status === 'completed') {
      console.log('❌ Le cron job ne fonctionne pas correctement');
      console.log('   -> Le paiement est validé mais la commande reste en attente');
      console.log('   -> Cause probable: absence de token sauvegardé');
    } else if (order && order.paymentStatus === 'PAID') {
      console.log('✅ Le système fonctionne!');
      console.log('   -> La commande a été correctement mise à jour');
    } else {
      console.log('ℹ️  État indéterminé - nécessite investigation');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCronManually();