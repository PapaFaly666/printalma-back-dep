const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('\n🔍 Vérification des commandes...\n');

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: {
          not: null
        }
      },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        paymentToken: true,
        paymentDate: true,
        paymentDetails: true,
        totalAmount: true,
        createdAt: true
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (orders.length > 0) {
      console.log(`✅ ${orders.length} commande(s) avec statut de paiement trouvée(s):\n`);
      orders.forEach(order => {
        console.log(`📦 ${order.orderNumber}`);
        console.log(`   Statut commande: ${order.status}`);
        console.log(`   Statut paiement: ${order.paymentStatus}`);
        console.log(`   Méthode: ${order.paymentMethod || 'N/A'}`);
        console.log(`   Transaction ID: ${order.transactionId || 'N/A'}`);
        console.log(`   Token: ${order.paymentToken || 'N/A'}`);
        console.log(`   Date paiement: ${order.paymentDate || 'N/A'}`);
        if (order.paymentDetails) {
          console.log(`   Détails: ${JSON.stringify(order.paymentDetails, null, 2)}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  Aucune commande avec statut de paiement trouvée\n');
    }

    // Statistiques
    const stats = await prisma.order.groupBy({
      by: ['paymentStatus'],
      _count: {
        paymentStatus: true
      }
    });

    if (stats.length > 0) {
      console.log('📊 Répartition des statuts de paiement:');
      stats.forEach(stat => {
        const status = stat.paymentStatus || 'NULL';
        console.log(`   - ${status}: ${stat._count.paymentStatus} commande(s)`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
