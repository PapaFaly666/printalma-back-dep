#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { calculateRevenueSplit } = require('./dist/utils/commission-utils');

const prisma = new PrismaClient();

async function migrateExistingOrders() {
  console.log('🚀 Début de la migration des commissions pour les commandes existantes...');

  try {
    // Récupérer toutes les commandes sans commission stockée
    const ordersWithoutCommission = await prisma.order.findMany({
      where: {
        commissionRate: null
      },
      include: {
        orderItems: {
          include: {
            vendorProduct: {
              select: {
                vendorId: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 ${ordersWithoutCommission.length} commandes à migrer`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const order of ordersWithoutCommission) {
      try {
        // Récupérer le premier vendeur de la commande
        const firstItem = order.orderItems[0];
        let vendorId = null;
        let commissionRate = 40.0; // Taux par défaut

        if (firstItem?.vendorProduct?.vendorId) {
          vendorId = firstItem.vendorProduct.vendorId;

          // Récupérer la commission personnalisée du vendeur si elle existe
          const vendorCommission = await prisma.vendorCommission.findUnique({
            where: { vendorId }
          });

          if (vendorCommission) {
            commissionRate = vendorCommission.commissionRate;
          }
        }

        // Calculer le split de revenus
        const revenueSplit = calculateRevenueSplit(order.totalAmount, commissionRate);

        // Mettre à jour la commande avec les informations de commission
        await prisma.order.update({
          where: { id: order.id },
          data: {
            commissionRate: commissionRate,
            commissionAmount: revenueSplit.commissionAmount,
            vendorAmount: revenueSplit.vendorRevenue,
            commissionAppliedAt: new Date()
          }
        });

        migratedCount++;

        if (migratedCount % 100 === 0) {
          console.log(`✅ ${migratedCount} commandes migrées...`);
        }

      } catch (error) {
        console.error(`❌ Erreur migration commande ${order.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 RÉSUMÉ DE LA MIGRATION:');
    console.log(`✅ Commandes migrées avec succès: ${migratedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total traité: ${migratedCount + errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️ Certaines commandes n\'ont pas pu être migrées. Vérifiez les logs ci-dessus.');
    }

  } catch (error) {
    console.error('💥 Erreur critique lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateExistingOrders()
  .then(() => {
    console.log('\n🎉 Migration terminée avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec de la migration:', error);
    process.exit(1);
  });