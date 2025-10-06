#!/usr/bin/env node

/**
 * Test direct du service VendorFundsService pour vérifier le calcul des gains
 */

const { PrismaClient } = require('@prisma/client');

// Simuler le service VendorFundsService
class VendorFundsService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Méthode corrigée pour récupérer les gains du vendeur
   */
  async getVendorEarnings(vendorId) {
    // D'abord essayer de récupérer depuis le cache
    const cachedEarnings = await this.prisma.vendorEarnings.findUnique({
      where: { vendorId }
    });

    if (cachedEarnings) {
      // Calculer correctement les montants depuis les demandes de fonds
      const fundsRequests = await this.prisma.vendorFundsRequest.findMany({
        where: { vendorId }
      });

      // Séparer les demandes payées et en attente
      const paidAmount = fundsRequests
        .filter(req => req.status === 'PAID')
        .reduce((sum, req) => sum + req.amount, 0);

      const pendingAmount = fundsRequests
        .filter(req => req.status === 'PENDING')
        .reduce((sum, req) => sum + req.amount, 0);

      // Calcul correct : Revenus Totaux - Payé - En Attente
      const availableAmount = Math.max(0, cachedEarnings.totalEarnings - paidAmount - pendingAmount);

      console.log(`[VENDOR ${vendorId}] Calcul des gains depuis cache:`, {
        totalEarnings: cachedEarnings.totalEarnings,
        paidAmount,
        pendingAmount,
        availableAmount
      });

      return {
        totalEarnings: cachedEarnings.totalEarnings,
        availableAmount: availableAmount,
        pendingAmount: pendingAmount,
        thisMonthEarnings: cachedEarnings.thisMonthEarnings,
        lastMonthEarnings: cachedEarnings.lastMonthEarnings,
        commissionPaid: cachedEarnings.totalCommissionPaid,
        totalCommission: cachedEarnings.totalEarnings + cachedEarnings.totalCommissionPaid,
        averageCommissionRate: 0.1
      };
    }

    throw new Error('Aucun cache de gains trouvé');
  }

  /**
   * Simuler le traitement d'une demande par l'admin
   */
  async processFundsRequest(adminId, requestId, processData) {
    const { status } = processData;

    // Vérifier que la demande existe
    const request = await this.prisma.vendorFundsRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    if (!['PENDING'].includes(request.status)) {
      throw new Error('Cette demande ne peut plus être modifiée');
    }

    // Le rejet n'est plus autorisé
    if (status === 'REJECTED') {
      throw new Error('Le rejet de demandes n\'est plus autorisé.');
    }

    // Mettre à jour la demande
    const updatedRequest = await this.prisma.vendorFundsRequest.update({
      where: { id: requestId },
      data: {
        status,
        processedBy: adminId,
        processedAt: new Date(),
        validatedAt: new Date(),
      }
    });

    console.log(`✅ Demande ${requestId} marquée comme ${status}`);
    return updatedRequest;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

async function testServiceFundsCalculation() {
  console.log('🧪 Test du service VendorFundsService...\n');

  const service = new VendorFundsService();

  try {
    // 1. Trouver un vendeur avec des données de test
    const vendor = await service.prisma.user.findFirst({
      where: { role: 'VENDEUR' }
    });

    if (!vendor) {
      console.log('❌ Aucun vendeur trouvé');
      return;
    }

    console.log(`📊 Test pour le vendeur: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id})\n`);

    // 2. Tester le calcul initial
    console.log('🔍 1. Test du calcul initial:');
    const initialEarnings = await service.getVendorEarnings(vendor.id);
    console.log('   Résultat:', {
      totalEarnings: initialEarnings.totalEarnings.toLocaleString() + ' FCFA',
      availableAmount: initialEarnings.availableAmount.toLocaleString() + ' FCFA',
      pendingAmount: initialEarnings.pendingAmount.toLocaleString() + ' FCFA'
    });

    // 3. Trouver une demande en attente pour test
    const pendingRequest = await service.prisma.vendorFundsRequest.findFirst({
      where: {
        vendorId: vendor.id,
        status: 'PENDING'
      }
    });

    if (!pendingRequest) {
      console.log('\\n❌ Aucune demande en attente trouvée pour le test');
      return;
    }

    console.log(`\\n🔍 2. Test de traitement d'une demande en attente:`);
    console.log(`   Demande ID: ${pendingRequest.id}`);
    console.log(`   Montant: ${pendingRequest.amount.toLocaleString()} FCFA`);

    // 4. Trouver un admin pour le test
    const admin = await service.prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }
    });

    if (!admin) {
      console.log('\\n❌ Aucun admin trouvé pour effectuer le test');
      return;
    }

    // 5. Marquer la demande comme payée
    await service.processFundsRequest(admin.id, pendingRequest.id, { status: 'PAID' });

    // 5. Recalculer les gains
    console.log('\\n🔍 3. Calcul après paiement:');
    const newEarnings = await service.getVendorEarnings(vendor.id);
    console.log('   Résultat:', {
      totalEarnings: newEarnings.totalEarnings.toLocaleString() + ' FCFA',
      availableAmount: newEarnings.availableAmount.toLocaleString() + ' FCFA',
      pendingAmount: newEarnings.pendingAmount.toLocaleString() + ' FCFA'
    });

    // 6. Vérifier que le montant disponible a bien changé
    const difference = initialEarnings.availableAmount - newEarnings.availableAmount;
    console.log(`\\n📊 Analyse du changement:`);
    console.log(`   Montant disponible initial: ${initialEarnings.availableAmount.toLocaleString()} FCFA`);
    console.log(`   Montant disponible après paiement: ${newEarnings.availableAmount.toLocaleString()} FCFA`);
    console.log(`   Différence: ${difference.toLocaleString()} FCFA`);

    if (Math.abs(difference - pendingRequest.amount) < 0.01) {
      console.log('   ✅ Calcul correct ! Le montant a diminué exactement du montant payé');
    } else {
      console.log('   ❌ Erreur dans le calcul ! La différence ne correspond pas au montant payé');
    }

    // 7. Remettre la demande en PENDING pour ne pas affecter les autres tests
    await service.prisma.vendorFundsRequest.update({
      where: { id: pendingRequest.id },
      data: {
        status: 'PENDING',
        processedBy: null,
        processedAt: null,
        validatedAt: null,
      }
    });
    console.log('\\n🔄 Demande remise en PENDING pour les prochains tests');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await service.disconnect();
  }
}

// Exécution du test
testServiceFundsCalculation();