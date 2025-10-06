#!/usr/bin/env node

/**
 * Script de test pour vérifier le calcul correct des montants disponibles vendeur
 * Utilisation: node test-funds-calculation.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testVendorEarningsCalculation() {
  console.log('🧪 Test du calcul des gains vendeur...\n');

  try {
    // 1. Récupérer un vendeur avec des demandes de fonds
    const vendor = await prisma.user.findFirst({
      where: { role: 'VENDEUR' },
      include: {
        vendorFundsRequests: true
      }
    });

    if (!vendor) {
      console.log('❌ Aucun vendeur trouvé');
      return;
    }

    console.log(`📊 Test pour le vendeur: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id})`);

    // 2. Calculer manuellement les montants
    const totalRequests = vendor.vendorFundsRequests.length;
    const paidRequests = vendor.vendorFundsRequests.filter(r => r.status === 'PAID');
    const pendingRequests = vendor.vendorFundsRequests.filter(r => r.status === 'PENDING');

    const paidAmount = paidRequests.reduce((sum, req) => sum + req.amount, 0);
    const pendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

    console.log('\n📋 Demandes de fonds:');
    console.log(`   - Total demandes: ${totalRequests}`);
    console.log(`   - Demandes payées: ${paidRequests.length} (${paidAmount.toLocaleString()} FCFA)`);
    console.log(`   - Demandes en attente: ${pendingRequests.length} (${pendingAmount.toLocaleString()} FCFA)`);

    // 3. Récupérer les gains depuis la table vendorEarnings
    const cachedEarnings = await prisma.vendorEarnings.findUnique({
      where: { vendorId: vendor.id }
    });

    if (!cachedEarnings) {
      console.log('❌ Aucun cache de gains trouvé pour ce vendeur');
      return;
    }

    console.log('\n💰 Revenus vendeur (cache):');
    console.log(`   - Revenus totaux: ${cachedEarnings.totalEarnings.toLocaleString()} FCFA`);

    // 4. Calculer le montant disponible correct
    const expectedAvailable = Math.max(0, cachedEarnings.totalEarnings - paidAmount - pendingAmount);

    console.log('\n🧮 Calcul du montant disponible:');
    console.log(`   Formule: Revenus Totaux - Payé - En Attente`);
    console.log(`   Calcul: ${cachedEarnings.totalEarnings.toLocaleString()} - ${paidAmount.toLocaleString()} - ${pendingAmount.toLocaleString()}`);
    console.log(`   ✅ Montant disponible attendu: ${expectedAvailable.toLocaleString()} FCFA`);

    // 5. Comparer avec la valeur en cache (qui ne devrait plus être utilisée)
    const cachedAvailable = cachedEarnings.availableAmount;
    console.log(`   🗃️  Valeur en cache (ignorée): ${cachedAvailable.toLocaleString()} FCFA`);

    // 6. Simulation du processus de paiement
    console.log('\n🔄 Simulation: Si une demande de 10,000 FCFA est payée:');
    const simulatedPaid = paidAmount + 10000;
    const simulatedAvailable = Math.max(0, cachedEarnings.totalEarnings - simulatedPaid - pendingAmount);
    console.log(`   Nouveau montant payé: ${simulatedPaid.toLocaleString()} FCFA`);
    console.log(`   Nouveau montant disponible: ${simulatedAvailable.toLocaleString()} FCFA`);
    console.log(`   Différence: -10,000 FCFA ✅`);

    // 7. Afficher toutes les demandes pour debug
    if (vendor.vendorFundsRequests.length > 0) {
      console.log('\n📋 Détail des demandes:');
      vendor.vendorFundsRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id} | ${req.amount.toLocaleString()} FCFA | ${req.status} | ${req.createdAt.toDateString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour tester une demande spécifique
async function testSpecificRequest(requestId) {
  console.log(`🔍 Test d'une demande spécifique: ${requestId}\n`);

  try {
    const request = await prisma.vendorFundsRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: { vendor: true }
    });

    if (!request) {
      console.log('❌ Demande non trouvée');
      return;
    }

    console.log(`📄 Demande ID: ${request.id}`);
    console.log(`   Vendeur: ${request.vendor.firstName} ${request.vendor.lastName}`);
    console.log(`   Montant: ${request.amount.toLocaleString()} FCFA`);
    console.log(`   Statut: ${request.status}`);
    console.log(`   Date: ${request.createdAt.toDateString()}`);

    // Calculer l'impact sur les gains du vendeur
    const vendorId = request.vendorId;

    // Avant changement de statut
    const beforePaid = await prisma.vendorFundsRequest.aggregate({
      where: { vendorId, status: 'PAID' },
      _sum: { amount: true }
    });

    const beforePending = await prisma.vendorFundsRequest.aggregate({
      where: { vendorId, status: 'PENDING' },
      _sum: { amount: true }
    });

    console.log('\n📊 État actuel:');
    console.log(`   Montant payé total: ${(beforePaid._sum.amount || 0).toLocaleString()} FCFA`);
    console.log(`   Montant en attente total: ${(beforePending._sum.amount || 0).toLocaleString()} FCFA`);

    if (request.status === 'PENDING') {
      console.log('\n🔄 Si cette demande est marquée comme PAID:');
      const afterPaid = (beforePaid._sum.amount || 0) + request.amount;
      const afterPending = (beforePending._sum.amount || 0) - request.amount;
      console.log(`   Nouveau montant payé: ${afterPaid.toLocaleString()} FCFA (+${request.amount.toLocaleString()})`);
      console.log(`   Nouveau montant en attente: ${afterPending.toLocaleString()} FCFA (-${request.amount.toLocaleString()})`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
const args = process.argv.slice(2);
if (args[0] === 'request' && args[1]) {
  testSpecificRequest(args[1]);
} else {
  testVendorEarningsCalculation();
}