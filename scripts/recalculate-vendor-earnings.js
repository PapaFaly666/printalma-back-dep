/**
 * Script de recalcul des gains vendeurs après la correction du calcul
 *
 * Ce script recalcule les gains de tous les vendeurs en utilisant la nouvelle logique :
 * - Les vendeurs gagnent UNIQUEMENT sur les designs vendus (prix design seulement)
 * - Fini le calcul sur le prix total du produit
 *
 * UTILISATION:
 *   node scripts/recalculate-vendor-earnings.js
 *
 * OU pour un vendeur spécifique:
 *   node scripts/recalculate-vendor-earnings.js --vendorId=5
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateAllVendors() {
  try {
    console.log('🔄 Début du recalcul des gains vendeurs...\n');

    // Récupérer tous les vendeurs
    const vendors = await prisma.user.findMany({
      where: {
        role: 'VENDEUR',
        is_deleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true
      }
    });

    console.log(`📊 ${vendors.length} vendeur(s) trouvé(s)\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const vendor of vendors) {
      try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`👤 Vendeur: ${vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`} (ID: ${vendor.id})`);
        console.log(`${'='.repeat(80)}`);

        // Recalculer les gains pour ce vendeur
        const earnings = await recalculateVendorEarnings(vendor.id);

        console.log(`✅ Recalcul terminé pour vendeur ${vendor.id}:`);
        console.log(`   - Total gains: ${earnings.totalEarnings.toLocaleString('fr-FR')} FCFA`);
        console.log(`   - Disponible: ${earnings.availableAmount.toLocaleString('fr-FR')} FCFA`);
        console.log(`   - En attente: ${earnings.pendingAmount.toLocaleString('fr-FR')} FCFA`);
        console.log(`   - Ce mois: ${earnings.thisMonthEarnings.toLocaleString('fr-FR')} FCFA`);
        console.log(`   - Mois dernier: ${earnings.lastMonthEarnings.toLocaleString('fr-FR')} FCFA`);

        successCount++;
      } catch (error) {
        console.error(`❌ Erreur pour vendeur ${vendor.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RÉSUMÉ DU RECALCUL`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Succès: ${successCount}/${vendors.length}`);
    console.log(`❌ Erreurs: ${errorCount}/${vendors.length}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function recalculateVendorEarnings(vendorId) {
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Récupérer le taux de commission du vendeur
  const vendorCommission = await prisma.vendorCommission.findUnique({
    where: { vendorId }
  });
  const vendorCommissionRate = vendorCommission ? vendorCommission.commissionRate / 100 : 0.4;

  console.log(`   💰 Taux de commission: ${(vendorCommissionRate * 100).toFixed(2)}%`);

  // ✅ NOUVELLE LOGIQUE: Calculer uniquement les revenus des designs
  // Les designs avec statut READY_FOR_PAYOUT sont disponibles pour retrait
  const designUsages = await prisma.designUsage.findMany({
    where: {
      vendorId,
      paymentStatus: 'READY_FOR_PAYOUT'
    },
    select: {
      vendorRevenue: true,
      platformFee: true,
      usedAt: true,
      designName: true,
      designPrice: true,
      orderNumber: true
    }
  });

  console.log(`   🎨 ${designUsages.length} design(s) prêt(s) pour paiement`);

  let totalEarnings = 0;
  let totalCommission = 0;
  let thisMonthEarnings = 0;
  let lastMonthEarnings = 0;

  // Calculer les gains par design
  for (const usage of designUsages) {
    const revenue = parseFloat(usage.vendorRevenue.toString());
    const commission = parseFloat(usage.platformFee.toString());
    const usedAt = new Date(usage.usedAt);

    totalEarnings += revenue;
    totalCommission += commission;

    // Gains de ce mois
    if (usedAt >= firstDayThisMonth) {
      thisMonthEarnings += revenue;
    }

    // Gains du mois dernier
    if (usedAt >= firstDayLastMonth && usedAt <= lastDayLastMonth) {
      lastMonthEarnings += revenue;
    }

    console.log(`     - ${usage.designName}: ${revenue.toLocaleString('fr-FR')} FCFA (commande ${usage.orderNumber})`);
  }

  // Calculer les montants en attente et payés
  const fundsRequests = await prisma.vendorFundsRequest.findMany({
    where: { vendorId }
  });

  const paidAmount = fundsRequests
    .filter(req => req.status === 'PAID')
    .reduce((sum, req) => sum + req.amount, 0);

  const pendingAmount = fundsRequests
    .filter(req => req.status === 'PENDING' || req.status === 'APPROVED')
    .reduce((sum, req) => sum + req.amount, 0);

  const availableAmount = Math.max(0, totalEarnings - paidAmount - pendingAmount);

  console.log(`   💵 Déjà payé: ${paidAmount.toLocaleString('fr-FR')} FCFA`);
  console.log(`   ⏳ En attente: ${pendingAmount.toLocaleString('fr-FR')} FCFA`);

  // Mettre à jour la table vendor_earnings
  await prisma.vendorEarnings.upsert({
    where: { vendorId },
    update: {
      totalEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      totalCommissionPaid: totalCommission,
      averageCommissionRate: vendorCommissionRate,
      lastCalculatedAt: new Date()
    },
    create: {
      vendorId,
      totalEarnings,
      availableAmount: 0, // Sera recalculé dynamiquement
      pendingAmount: 0,   // Sera recalculé dynamiquement
      thisMonthEarnings,
      lastMonthEarnings,
      totalCommissionPaid: totalCommission,
      averageCommissionRate: vendorCommissionRate
    }
  });

  return {
    totalEarnings,
    availableAmount,
    pendingAmount,
    thisMonthEarnings,
    lastMonthEarnings,
    commissionPaid: totalCommission
  };
}

async function recalculateSingleVendor(vendorId) {
  try {
    console.log(`🔄 Recalcul pour le vendeur ID: ${vendorId}\n`);

    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        role: true
      }
    });

    if (!vendor) {
      throw new Error(`Vendeur avec ID ${vendorId} non trouvé`);
    }

    if (vendor.role !== 'VENDEUR') {
      throw new Error(`L'utilisateur ${vendorId} n'est pas un vendeur (rôle: ${vendor.role})`);
    }

    console.log(`👤 Vendeur: ${vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`}\n`);

    const earnings = await recalculateVendorEarnings(vendorId);

    console.log(`\n✅ Recalcul terminé:`);
    console.log(`   - Total gains: ${earnings.totalEarnings.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - Disponible: ${earnings.availableAmount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - En attente: ${earnings.pendingAmount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - Ce mois: ${earnings.thisMonthEarnings.toLocaleString('fr-FR')} FCFA`);
    console.log(`   - Mois dernier: ${earnings.lastMonthEarnings.toLocaleString('fr-FR')} FCFA\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);
  const vendorIdArg = args.find(arg => arg.startsWith('--vendorId='));

  if (vendorIdArg) {
    const vendorId = parseInt(vendorIdArg.split('=')[1]);
    if (isNaN(vendorId)) {
      console.error('❌ Erreur: vendorId doit être un nombre');
      process.exit(1);
    }
    await recalculateSingleVendor(vendorId);
  } else {
    await recalculateAllVendors();
  }
}

// Exécution
main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
