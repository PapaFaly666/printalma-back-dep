const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeCommissionRates() {
  try {
    console.log('🔍 Analyse des taux de commission réels...');

    const vendorId = 3; // Papa Faly Sidy

    // Récupérer les commandes avec les infos de commission
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        orderItems: {
          some: {
            vendorProductId: {
              not: null
            }
          }
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    console.log(`📊 Analyse de ${orders.length} commandes:\n`);

    let totalVendorAmount = 0;
    let totalOrderAmount = 0;

    for (const order of orders) {
      const vendorItems = order.orderItems.filter(item =>
        item.vendorProductId && item.product
      );

      for (const item of vendorItems) {
        // Vérifier que le vendorProduct appartient bien à ce vendeur
        const vendorProduct = await prisma.vendorProduct.findFirst({
          where: {
            id: item.vendorProductId,
            vendorId: vendorId
          }
        });

        if (vendorProduct) {
          const orderAmount = item.unitPrice * item.quantity;

          // Calculer avec les différents taux de commission possibles
          const commission40 = orderAmount * 0.4; // commission 40%
          const commission50 = orderAmount * 0.5; // commission 50%
          const commission59 = orderAmount * 0.59; // commission 59% (comme dans le code)

          const vendorAmount40 = orderAmount * 0.6; // 60% pour vendeur
          const vendorAmount50 = orderAmount * 0.5; // 50% pour vendeur
          const vendorAmount41 = orderAmount * 0.41; // 41% pour vendeur (59% commission)

          console.log(`📋 Commande ${order.orderNumber}:`);
          console.log(`   Montant: ${orderAmount} XOF`);
          console.log(`   Si commission 40%: vendeur reçoit ${vendorAmount40} XOF`);
          console.log(`   Si commission 50%: vendeur reçoit ${vendorAmount50} XOF`);
          console.log(`   Si commission 59%: vendeur reçoit ${vendorAmount41} XOF`);
          console.log('');

          totalOrderAmount += orderAmount;
        }
      }
    }

    console.log(`📈 Total montant commandes: ${totalOrderAmount} XOF`);
    console.log(`💸 Si commission 40%: vendeur reçoit ${totalOrderAmount * 0.6} XOF`);
    console.log(`💸 Si commission 50%: vendeur reçoit ${totalOrderAmount * 0.5} XOF`);
    console.log(`💸 Si commission 59%: vendeur reçoit ${totalOrderAmount * 0.41} XOF`);

    console.log(`\n🎯 Attendu selon /orders/my-orders: 21 600 XOF`);
    console.log(`📊 Pour atteindre 21 600 XOF, il faut: ${(21600/totalOrderAmount * 100).toFixed(1)}% du montant total`);
    console.log(`📊 Cela correspond à une commission de: ${((1 - 21600/totalOrderAmount) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCommissionRates();