const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWithRealData() {
  try {
    console.log('🔍 Recherche de vendeurs avec des commandes livrées...');

    // Chercher des vendeurs qui ont des commandes livrées
    const vendorsWithOrders = await prisma.$queryRaw`
      SELECT DISTINCT v.id, u.firstName, u.lastName, u.shop_name
      FROM "User" u
      JOIN "VendorProduct" vp ON vp."vendorId" = u.id
      JOIN "OrderItem" oi ON oi."productId" = vp."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status = 'DELIVERED'
      AND u.role = 'VENDEUR'
      LIMIT 5
    `;

    console.log(`📦 ${vendorsWithOrders.length} vendeur(s) trouvé(s) avec des commandes livrées`);

    if (vendorsWithOrders.length === 0) {
      console.log('ℹ️ Aucun vendeur avec des commandes livrées trouvé');

      // Vérifier s'il y a des commandes du tout
      const totalOrders = await prisma.order.count();
      const deliveredOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });

      console.log(`📊 Statistiques globales:`);
      console.log(`   - Total commandes: ${totalOrders}`);
      console.log(`   - Commandes livrées: ${deliveredOrders}`);

      if (deliveredOrders > 0) {
        // Chercher les produits dans ces commandes
        const productsInOrders = await prisma.$queryRaw`
          SELECT DISTINCT vp."vendorId", u.firstName, u.lastName, u.shop_name
          FROM "VendorProduct" vp
          JOIN "OrderItem" oi ON oi."productId" = vp."productId"
          JOIN "Order" o ON o.id = oi."orderId"
          JOIN "User" u ON u.id = vp."vendorId"
          WHERE o.status = 'DELIVERED'
          LIMIT 3
        `;

        console.log(`🔍 Produits trouvés dans les commandes livrées: ${productsInOrders.length}`);
        console.log(productsInOrders);
      }

      return;
    }

    // Tester avec le premier vendeur trouvé
    const vendor = vendorsWithOrders[0];
    console.log(`\n🎯 Test avec le vendeur: ${vendor.firstName} ${vendor.lastName} (${vendor.shop_name || 'Sans boutique'}) - ID: ${vendor.id}`);

    await testVendorEarnings(vendor.id);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testVendorEarnings(vendorId) {
  try {
    console.log('\n🔍 Test du calcul des gains après correction...');

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

          console.log(`   📌 Commande #${order.id}: ${orderItemTotal.toFixed(2)} FCFA - Commission: ${commissionAmount.toFixed(2)} FCFA - Net: ${netEarnings.toFixed(2)} FCFA`);
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

    // Calcul correct : Revenus nets - Montant déjà payé - Montant en attente
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

    // Afficher le détail des demandes
    if (pendingRequests.length > 0) {
      console.log('\n📋 Demandes en attente/approuvées:');
      pendingRequests.forEach(req => {
        console.log(`   - ${req.status}: ${req.amount.toFixed(2)} FCFA (${req.description})`);
      });
    }

    if (paidRequests.length > 0) {
      console.log('\n✅ Demandes payées:');
      paidRequests.forEach(req => {
        console.log(`   - ${req.amount.toFixed(2)} FCFA (${req.description})`);
      });
    }

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testWithRealData();