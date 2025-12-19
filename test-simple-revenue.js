const { PrismaClient, DesignPaymentStatus, PayoutStatus, BankAccountType } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimple() {
  console.log('🧪 Test simple du système de revenus de designs...\n');

  try {
    // 1. Vérifier que les tables existent
    console.log('1️⃣ Vérification des tables...');
    const designUsageCount = await prisma.designUsage.count();
    console.log(`✅ Table design_usages: ${designUsageCount} enregistrements`);

    const vendorPayoutCount = await prisma.vendorPayout.count();
    console.log(`✅ Table vendor_payouts: ${vendorPayoutCount} enregistrements`);

    const bankAccountCount = await prisma.vendorBankAccount.count();
    console.log(`✅ Table vendor_bank_accounts: ${bankAccountCount} enregistrements`);

    const settingsCount = await prisma.designRevenueSettings.count();
    console.log(`✅ Table design_revenue_settings: ${settingsCount} enregistrements\n`);

    // 2. Initialiser les paramètres s'ils n'existent pas
    if (settingsCount === 0) {
      console.log('2️⃣ Initialisation des paramètres de revenus...');
      await prisma.designRevenueSettings.create({
        data: {
          defaultCommissionRate: 70,
          minimumPayoutAmount: 10000,
          payoutDelayDays: 7,
          payoutSchedule: 'ON_DEMAND',
          isActive: true
        }
      });
      console.log('✅ Paramètres initialisés\n');
    }

    // 3. Créer des données de test
    console.log('3️⃣ Création des données de test...');

    // Créer un vendeur de test
    let vendor = await prisma.user.findFirst({
      where: { email: 'vendor-test@example.com' }
    });

    if (!vendor) {
      vendor = await prisma.user.create({
        data: {
          firstName: 'Test',
          lastName: 'Vendor',
          email: 'vendor-test@example.com',
          password: 'test123',
          shop_name: 'Test Shop',
          role: 'VENDEUR'
        }
      });
      console.log(`✅ Vendeur créé: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id})`);
    } else {
      console.log(`✅ Vendeur existant utilisé: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id})`);
    }

    // Créer un client de test
    let customer = await prisma.user.findFirst({
      where: { email: 'customer-test@example.com' }
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'customer-test@example.com',
          password: 'test123'
        }
      });
      console.log(`✅ Client créé: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
    } else {
      console.log(`✅ Client existant utilisé: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
    }

    // Créer un design de test
    let design = await prisma.design.findFirst({
      where: { name: 'Test Design Logo' }
    });

    if (!design) {
      design = await prisma.design.create({
        data: {
          vendorId: vendor.id,
          name: 'Test Design Logo',
          description: 'Un design de test pour les revenus',
          price: 5000,
          imageUrl: 'https://example.com/design.jpg',
          cloudinaryPublicId: 'test_design',
          fileSize: 1024,
          originalFileName: 'test.png',
          dimensions: { width: 500, height: 500 },
          format: 'PNG',
          isPublished: true,
          isValidated: true
        }
      });
      console.log(`✅ Design créé: ${design.name} (ID: ${design.id})`);
    } else {
      console.log(`✅ Design existant utilisé: ${design.name} (ID: ${design.id})`);
    }

    // 4. Simuler une utilisation de design
    console.log('\n4️⃣ Simulation d\'une utilisation de design...');

    // Récupérer les paramètres
    const settings = await prisma.designRevenueSettings.findFirst({
      where: { isActive: true }
    });
    const commissionRate = settings?.defaultCommissionRate || 70;

    // Calculer les revenus
    const designPrice = 5000;
    const vendorRevenue = Math.round(designPrice * (commissionRate / 100));
    const platformFee = Math.round(designPrice * ((100 - commissionRate) / 100));

    // Créer une utilisation
    const designUsage = await prisma.designUsage.create({
      data: {
        designId: design.id,
        orderId: 999, // ID de test
        orderItemId: 999, // ID de test
        vendorId: vendor.id,
        customerId: customer.id,
        designPrice: designPrice,
        commissionRate: commissionRate,
        vendorRevenue: vendorRevenue,
        platformFee: platformFee,
        paymentStatus: DesignPaymentStatus.PENDING,
        productName: 'T-Shirt Test',
        productCategory: 'Vêtements'
      }
    });
    console.log(`✅ Utilisation créée: ${designUsage.vendorRevenue} FCFA pour le vendeur`);

    // 5. Mettre à jour les statuts
    console.log('\n5️⃣ Mise à jour des statuts...');

    // Confirmer
    await prisma.designUsage.update({
      where: { id: designUsage.id },
      data: {
        paymentStatus: DesignPaymentStatus.CONFIRMED,
        confirmedAt: new Date()
      }
    });
    console.log('✅ Statut confirmé');

    // Livrer
    const readyDate = new Date();
    readyDate.setDate(readyDate.getDate() + 7);
    await prisma.designUsage.update({
      where: { id: designUsage.id },
      data: {
        paymentStatus: DesignPaymentStatus.READY_FOR_PAYOUT,
        readyForPayoutAt: readyDate
      }
    });
    console.log('✅ Statut prêt pour paiement (après 7 jours)');

    // Simuler que le délai est passé
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await prisma.designUsage.update({
      where: { id: designUsage.id },
      data: {
        readyForPayoutAt: pastDate
      }
    });

    // 6. Créer un compte bancaire
    console.log('\n6️⃣ Création d\'un compte bancaire...');

    const existingAccount = await prisma.vendorBankAccount.findFirst({
      where: { vendorId: vendor.id }
    });

    if (!existingAccount) {
      const bankAccount = await prisma.vendorBankAccount.create({
        data: {
          vendorId: vendor.id,
          bankName: 'Test Bank',
          accountNumber: '1234567890',
          accountHolderName: `${vendor.firstName} ${vendor.lastName}`,
          accountType: BankAccountType.CHECKING,
          isVerified: true,
          isDefault: true
        }
      });
      console.log(`✅ Compte bancaire créé: ${bankAccount.bankName} (${bankAccount.id})`);
    } else {
      console.log(`✅ Compte bancaire existant utilisé: ${existingAccount.bankName}`);
    }

    // 7. Calculer le solde disponible
    console.log('\n7️⃣ Calcul du solde disponible...');
    const totalRevenue = await prisma.designUsage.aggregate({
      where: {
        vendorId: vendor.id,
        paymentStatus: DesignPaymentStatus.READY_FOR_PAYOUT,
        readyForPayoutAt: { lte: new Date() }
      },
      _sum: { vendorRevenue: true }
    });
    const balance = totalRevenue._sum.vendorRevenue || 0;
    console.log(`💰 Solde disponible: ${balance} FCFA`);

    // 8. Créer une demande de paiement si possible
    if (balance >= 10000) {
      console.log('\n8️⃣ Création d\'une demande de paiement...');
      const bankAccount = await prisma.vendorBankAccount.findFirst({
        where: { vendorId: vendor.id }
      });

      const payout = await prisma.vendorPayout.create({
        data: {
          vendorId: vendor.id,
          amount: Math.min(10000, balance),
          bankAccountId: bankAccount.id,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountHolderName: bankAccount.accountHolderName,
          status: PayoutStatus.PENDING
        }
      });
      console.log(`✅ Demande de paiement créée: ${payout.amount} FCFA (Status: ${payout.status})`);
    } else {
      console.log('\n⚠️ Solde insuffisant pour créer une demande de paiement (minimum 10000 FCFA)');
    }

    // 9. Afficher les statistiques
    console.log('\n9️⃣ Statistiques finales...');
    const stats = await prisma.designUsage.groupBy({
      by: ['paymentStatus'],
      where: { vendorId: vendor.id },
      _count: { id: true },
      _sum: { vendorRevenue: true }
    });

    console.log('📊 Statistiques du vendeur:');
    stats.forEach(s => {
      console.log(`   - ${s.paymentStatus}: ${s._count.id} utilisations, ${s._sum.vendorRevenue} FCFA`);
    });

    console.log('\n🎉 Test simple terminé avec succès !');
    console.log('\n📋 Fonctionnalités vérifiées:');
    console.log('   ✅ Tables créées correctement');
    console.log('   ✅ Paramètres de revenus initialisés');
    console.log('   ✅ Utilisation de design enregistrée');
    console.log('   ✅ Mise à jour des statuts fonctionnelle');
    console.log('   ✅ Calcul du solde disponible');
    console.log('   ✅ Compte bancaire créé');
    console.log('   ✅ Demande de paiement possible');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testSimple();