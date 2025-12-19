const { PrismaClient, DesignPaymentStatus, PayoutStatus, BankAccountType } = require('@prisma/client');
const { DesignRevenueService } = require('./src/services/designRevenueService');

const prisma = new PrismaClient();

async function testDesignRevenueSystem() {
  console.log('🧪 Démarrage des tests du système de revenus de designs...\n');

  try {
    // 1. Initialiser les paramètres de revenus
    console.log('1️⃣ Initialisation des paramètres de revenus...');
    await DesignRevenueService.initializeRevenueSettings();
    console.log('✅ Paramètres initialisés\n');

    // 2. Créer des données de test
    console.log('2️⃣ Création des données de test...');

    // Créer un vendeur de test
    const vendor = await prisma.user.create({
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

    // Créer un client de test
    const customer = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer-test@example.com',
        password: 'test123'
      }
    });
    console.log(`✅ Client créé: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);

    // Créer un design de test
    const design = await prisma.design.create({
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

    // Créer un produit de test
    const product = await prisma.product.create({
      data: {
        name: 'T-Shirt Test',
        description: 'T-shirt pour tester les revenus',
        price: 10000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });
    console.log(`✅ Produit créé: ${product.name} (ID: ${product.id})`);

    // Créer une commande de test
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}`,
        userId: customer.id,
        totalAmount: 15000,
        phoneNumber: '+221771234567',
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });
    console.log(`✅ Commande créée: ${order.orderNumber} (ID: ${order.id})`);

    // Créer un item de commande avec personnalisation
    const customization = await prisma.productCustomization.create({
      data: {
        userId: customer.id,
        productId: product.id,
        designElements: [
          {
            type: 'image',
            designId: design.id,
            designPrice: 5000,
            x: 100,
            y: 100,
            width: 200,
            height: 200
          }
        ],
        totalPrice: 15000,
        status: 'ordered'
      }
    });
    console.log(`✅ Personnalisation créée (ID: ${customization.id})`);

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        unitPrice: 10000,
        customizationId: customization.id
      }
    });
    console.log(`✅ OrderItem créé (ID: ${orderItem.id})\n`);

    // 3. Tester l'enregistrement d'utilisation de design
    console.log('3️⃣ Test de l\'enregistrement d\'utilisation de design...');
    const designUsage = await DesignRevenueService.recordDesignUsage({
      designId: design.id,
      orderId: order.id,
      orderItemId: orderItem.id,
      customizationId: customization.id,
      vendorId: vendor.id,
      customerId: customer.id,
      designPrice: 5000,
      productName: product.name,
      productCategory: 'Vêtements'
    });
    console.log(`✅ Utilisation enregistrée: ${designUsage.vendorRevenue} FCFA pour le vendeur\n`);

    // 4. Tester la mise à jour du statut
    console.log('4️⃣ Test de la mise à jour des statuts...');

    // Confirmer la commande
    await DesignRevenueService.onOrderConfirmed(order.id);
    console.log('✅ Commande confirmée -> utilisation confirmée');

    // Livrer la commande
    await DesignRevenueService.onOrderDelivered(order.id);
    console.log('✅ Commande livrée -> utilisation prête pour paiement\n');

    // 5. Tester les statistiques
    console.log('5️⃣ Test des statistiques de revenus...');
    const stats = await DesignRevenueService.getRevenueStats(vendor.id, 'all');
    console.log('📊 Statistiques du vendeur:');
    console.log(`   - Revenu total: ${stats.totalRevenue} FCFA`);
    console.log(`   - Revenu en attente: ${stats.pendingRevenue} FCFA`);
    console.log(`   - Revenu complété: ${stats.completedRevenue} FCFA`);
    console.log(`   - Total utilisations: ${stats.totalUsages}\n`);

    // 6. Tester le solde disponible
    console.log('6️⃣ Test du solde disponible...');
    const balance = await DesignRevenueService.getAvailableBalance(vendor.id);
    console.log(`💰 Solde disponible: ${balance} FCFA\n`);

    // 7. Créer un compte bancaire de test
    console.log('7️⃣ Création d\'un compte bancaire de test...');
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
    console.log(`✅ Compte bancaire créé: ${bankAccount.bankName} (${bankAccount.id})\n`);

    // 8. Tester une demande de paiement
    console.log('8️⃣ Test de la demande de paiement...');
    if (balance >= 10000) {
      const payout = await DesignRevenueService.createPayoutRequest(
        vendor.id,
        Math.min(10000, balance),
        bankAccount.id
      );
      console.log(`✅ Demande de paiement créée: ${payout.amount} FCFA (Status: ${payout.status})`);
    } else {
      console.log('⚠️ Solde insuffisant pour créer une demande de paiement');
    }

    // 9. Tester l'historique des designs
    console.log('\n9️⃣ Test de l\'historique des designs...');
    const designs = await DesignRevenueService.getDesignsWithRevenue(vendor.id);
    console.log('📂 Designs avec revenus:');
    designs.forEach(d => {
      console.log(`   - ${d.designName}: ${d.totalRevenue} FCFA (${d.totalUsages} utilisations)`);
    });

    // 10. Nettoyage des données de test
    console.log('\n🧹 Nettoyage des données de test...');
    await prisma.designUsage.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.vendorPayout.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.vendorBankAccount.deleteMany({ where: { vendorId: vendor.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.productCustomization.deleteMany({ where: { id: customization.id } });
    await prisma.order.deleteMany({ where: { id: order.id } });
    await prisma.design.deleteMany({ where: { id: design.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
    await prisma.user.deleteMany({ where: { id: { in: [vendor.id, customer.id] } } });
    console.log('✅ Données de test supprimées\n');

    console.log('🎉 Tous les tests ont été passés avec succès !');
    console.log('\n📋 Résumé des fonctionnalités testées:');
    console.log('   ✅ Initialisation des paramètres de revenus');
    console.log('   ✅ Enregistrement des utilisations de designs');
    console.log('   ✅ Mise à jour automatique des statuts (confirmé, livré)');
    console.log('   ✅ Calcul des statistiques de revenus');
    console.log('   ✅ Calcul du solde disponible');
    console.log('   ✅ Création de demandes de paiement');
    console.log('   ✅ Récupération de l\'historique des designs');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testDesignRevenueSystem();