const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function correctRevenueCalculation() {
  try {
    console.log('🔍 Calcul CORRECT des revenus vendeur...');

    const vendorId = 3; // Papa Faly Sidy

    // Récupérer les commandes avec commissionRate et commissionAmount
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        userId: vendorId // Utiliser userId car c'est le vendeur qui commande
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        commissionRate: true,
        commissionAmount: true,
        vendorAmount: true,
        orderItems: {
          select: {
            id: true,
            unitPrice: true,
            quantity: true,
            vendorProductId: true
          }
        }
      }
    });

    console.log(`📊 Trouvé ${orders.length} commandes du vendeur\n`);

    let totalVendorAmount = 0;
    let totalOrderAmount = 0;

    for (const order of orders) {
      console.log(`📋 Commande ${order.orderNumber}:`);
      console.log(`   Montant total: ${order.totalAmount} XOF`);
      console.log(`   Taux commission: ${order.commissionRate}%`);
      console.log(`   Montant commission: ${order.commissionAmount} XOF`);
      console.log(`   Montant vendeur: ${order.vendorAmount} XOF`);
      console.log('');

      totalVendorAmount += order.vendorAmount || 0;
      totalOrderAmount += order.totalAmount || 0;
    }

    console.log(`📈 RÉSULTATS FINAUX:`);
    console.log(`==================`);
    console.log(`Total commandes: ${totalOrderAmount} XOF`);
    console.log(`Total pour vendeur: ${totalVendorAmount} XOF`);
    console.log(`Taux moyen: ${((1 - totalVendorAmount/totalOrderAmount) * 100).toFixed(1)}% commission`);

    console.log(`\n✅ VALIDATION:`);
    console.log(`Attendu: 21 600 XOF`);
    console.log(`Calculé: ${totalVendorAmount} XOF`);
    console.log(`Différence: ${Math.abs(21600 - totalVendorAmount)} XOF`);

    if (Math.abs(21600 - totalVendorAmount) < 100) {
      console.log('🎉 CALCUL PARFAIT ! Les revenus correspondent exactement.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du calcul:', error);
  } finally {
    await prisma.$disconnect();
  }
}

correctRevenueCalculation();