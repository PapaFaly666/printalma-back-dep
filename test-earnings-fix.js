const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVendorEarnings() {
  try {
    console.log('🔍 Test du calcul des gains vendeur après correction...');

    // ID du vendeur à tester (vous pouvez changer cet ID)
    const vendorId = 1;

    // Simuler la méthode calculateVendorEarnings modifiée
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Récupérer le taux de commission actuel du vendeur
    const vendorCommission = await prisma.vendorCommission.findUnique({
      where: { vendorId: vendorId }
    });

    const commissionRate = vendorCommission?.commissionRate || 0.10;
    console.log(`💰 Taux de commission utilisé: ${commissionRate * 100}%`);

    // Calculer les gains depuis les commandes livrées (commission déjà débitée)
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        orderItems: {
          some: {
            product: {
              vendorProducts: {
                some: {
                  vendorId: vendorId,
                },
              },
            },
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                vendorProducts: {
                  where: { vendorId: vendorId },
                },
              },
            },
          },
        },
      },
    });

    console.log(`📦 Nombre de commandes livrées trouvées: ${deliveredOrders.length}`);

    // Calculer les gains nets après commission
    let totalEarnings = 0; // Gains nets pour le vendeur (après commission)
    let totalCommissionAmount = 0; // Commission totale prélevée par l'admin
    let thisMonthEarnings = 0;
    let lastMonthEarnings = 0;

    for (const order of deliveredOrders) {
      for (const item of order.orderItems) {
        if (item.product.vendorProducts.length > 0) {
          // Calcul : Prix unitaire * Quantité = Montant total de la commande
          const orderItemTotal = item.unitPrice * item.quantity;

          // Commission prélevée par l'admin
          const commissionAmount = orderItemTotal * commissionRate;

          // Gains nets pour le vendeur (ce qui lui reste après débit de la commission)
          const netEarnings = orderItemTotal - commissionAmount;

          totalEarnings += netEarnings;
          totalCommissionAmount += commissionAmount;

          // Gains de ce mois
          if (order.createdAt >= firstDayThisMonth) {
            thisMonthEarnings += netEarnings;
          }

          // Gains du mois dernier
          if (order.createdAt >= firstDayLastMonth && order.createdAt <= lastDayLastMonth) {
            lastMonthEarnings += netEarnings;
          }
        }
      }
    }

    // Calculer les montants en attente et payés
    const pendingRequests = await prisma.vendorFundsRequest.findMany({
      where: {
        vendorId: vendorId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const paidRequests = await prisma.vendorFundsRequest.findMany({
      where: {
        vendorId: vendorId,
        status: 'PAID',
      },
    });

    const pendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);
    const paidAmount = paidRequests.reduce((sum, req) => sum + req.amount, 0);

    // Calcul correct : Revenus nets - Commission admin - Déjà payé - En attente
    const availableAmount = Math.max(0, totalEarnings - paidAmount - pendingAmount);

    console.log('\n📊 RÉSULTATS DU CALCUL:');
    console.log(`💵 Total des gains nets (après commission): ${totalEarnings.toFixed(2)} FCFA`);
    console.log(`💸 Commission totale prélevée: ${totalCommissionAmount.toFixed(2)} FCFA`);
    console.log(`💰 Gains ce mois: ${thisMonthEarnings.toFixed(2)} FCFA`);
    console.log(`💰 Gains mois dernier: ${lastMonthEarnings.toFixed(2)} FCFA`);
    console.log(`⏳ Montant en attente: ${pendingAmount.toFixed(2)} FCFA`);
    console.log(`✅ Montant déjà payé: ${paidAmount.toFixed(2)} FCFA`);
    console.log(`💳 Montant disponible pour retrait: ${availableAmount.toFixed(2)} FCFA`);

    console.log('\n🔍 Détail des demandes de fonds:');
    console.log(`Demandes en attente: ${pendingRequests.length}`);
    console.log(`Demandes payées: ${paidRequests.length}`);

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVendorEarnings();