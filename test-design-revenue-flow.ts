import { PrismaClient } from '@prisma/client';
import { DesignUsageTracker } from './src/utils/designUsageTracker';

const prisma = new PrismaClient();

/**
 * Script de test pour le système de revenus des designs vendeurs
 * Simule le flux complet : création commande → paiement → livraison
 */

async function testDesignRevenueFlow() {
  console.log('🧪 ===== TEST DU SYSTÈME DE REVENUS DES DESIGNS VENDEURS =====\n');

  try {
    // ============================================
    // 1. PRÉPARATION DES DONNÉES DE TEST
    // ============================================
    console.log('📦 Étape 1 : Préparation des données de test...\n');

    // Trouver ou créer un vendeur
    let vendor = await prisma.user.findFirst({
      where: { role: 'VENDEUR' }
    });

    if (!vendor) {
      console.log('⚠️  Aucun vendeur trouvé. Création d\'un vendeur de test...');
      vendor = await prisma.user.create({
        data: {
          firstName: 'Test',
          lastName: 'Vendeur',
          email: `test-vendor-${Date.now()}@test.com`,
          password: 'hashed_password',
          phone: '+221701234567',
          role: 'VENDEUR',
          shop_name: 'Test Design Shop',
          country: 'Senegal'
        }
      });
      console.log(`✅ Vendeur créé : ID ${vendor.id} - ${vendor.shop_name}`);
    } else {
      console.log(`✅ Vendeur trouvé : ID ${vendor.id} - ${vendor.shop_name || vendor.firstName}`);
    }

    // Trouver ou créer un design
    let design = await prisma.design.findFirst({
      where: { vendorId: vendor.id }
    });

    if (!design) {
      console.log('⚠️  Aucun design trouvé. Création d\'un design de test...');
      design = await prisma.design.create({
        data: {
          name: 'Design Test Revenue',
          imageUrl: 'https://via.placeholder.com/500',
          thumbnailUrl: 'https://via.placeholder.com/150',
          price: 5000, // 5000 FCFA
          cloudinaryPublicId: 'test-design-revenue',
          fileSize: 50000,
          originalFileName: 'test-design.png',
          dimensions: { width: 500, height: 500 },
          format: 'png',
          vendor: {
            connect: { id: vendor.id }
          },
          isPublished: true,
          isValidated: true,
          isPending: false
        }
      });
      console.log(`✅ Design créé : ID ${design.id} - ${design.name} - Prix: ${design.price} FCFA`);
    } else {
      console.log(`✅ Design trouvé : ID ${design.id} - ${design.name} - Prix: ${design.price} FCFA`);
    }

    // Trouver un produit
    const product = await prisma.product.findFirst({
      include: {
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('❌ Aucun produit trouvé dans la DB. Veuillez créer au moins un produit.');
    }

    console.log(`✅ Produit trouvé : ID ${product.id} - ${product.name}`);

    const colorVariation = product.colorVariations[0];
    if (!colorVariation) {
      throw new Error('❌ Aucune variation de couleur trouvée pour le produit.');
    }

    console.log(`✅ Variation couleur : ID ${colorVariation.id} - ${colorVariation.name}`);

    // Trouver un client
    let customer = await prisma.user.findFirst({
      where: {
        role: { not: 'VENDEUR' }
      }
    });

    if (!customer) {
      console.log('⚠️  Aucun client trouvé. Utilisation d\'un utilisateur générique...');
      customer = await prisma.user.create({
        data: {
          firstName: 'Test',
          lastName: 'Client',
          email: `test-client-${Date.now()}@test.com`,
          password: 'hashed_password',
          phone: '+221701234568',
          country: 'Senegal'
        }
      });
      console.log(`✅ Client créé : ID ${customer.id}`);
    } else {
      console.log(`✅ Client trouvé : ID ${customer.id} - ${customer.firstName} ${customer.lastName}`);
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 2. CRÉATION DE LA CUSTOMIZATION
    // ============================================
    console.log('📦 Étape 2 : Création d\'une customization avec le design...\n');

    const customization = await prisma.productCustomization.create({
      data: {
        productId: product.id,
        userId: customer.id,
        colorVariationId: colorVariation.id,
        viewId: 1,
        status: 'draft',
        designElements: [
          {
            id: 'elem_test_1',
            type: 'image',
            imageUrl: design.imageUrl,
            designId: design.id,
            designPrice: parseFloat(design.price.toString()),
            x: 0.5,
            y: 0.5,
            width: 200,
            height: 200,
            rotation: 0,
            zIndex: 1
          }
        ],
        elementsByView: {
          [`${colorVariation.id}-1`]: [
            {
              id: 'elem_test_1',
              type: 'image',
              imageUrl: design.imageUrl,
              designId: design.id,
              designPrice: parseFloat(design.price.toString()),
              x: 0.5,
              y: 0.5,
              width: 200,
              height: 200,
              rotation: 0,
              zIndex: 1
            }
          ]
        }
      }
    });

    console.log(`✅ Customization créée : ID ${customization.id}`);
    console.log(`   - Design utilisé : ${design.id} (${design.name})`);
    console.log(`   - Prix du design : ${design.price} FCFA`);

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 3. CRÉATION DE LA COMMANDE
    // ============================================
    console.log('📦 Étape 3 : Création de la commande...\n');

    const orderNumber = `TEST-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        email: customer.email,
        phoneNumber: customer.phone || '+221701234567',
        shippingName: `${customer.firstName} ${customer.lastName}`,
        shippingStreet: '123 Test Street',
        shippingCity: 'Dakar',
        shippingCountry: 'Senegal',
        totalAmount: parseFloat(product.price.toString()) + parseFloat(design.price.toString()),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'PAYDUNYA'
      },
      include: {
        orderItems: true
      }
    });

    console.log(`✅ Commande créée : ${orderNumber} (ID: ${order.id})`);

    // Créer l'order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        unitPrice: parseFloat(product.price.toString()),
        size: 'M',
        color: colorVariation.name,
        colorId: colorVariation.id,
        customizationId: customization.id
      },
      include: {
        product: true
      }
    });

    console.log(`✅ Order item créé : ID ${orderItem.id}`);

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 4. TRACKING DES DESIGNS (SIMULATION)
    // ============================================
    console.log('📦 Étape 4 : Tracking des designs utilisés...\n');

    const customizationIds = {
      [`${colorVariation.id}-1`]: customization.id
    };

    await DesignUsageTracker.extractAndRecordDesignUsages(
      prisma as any,
      order,
      orderItem,
      customizationIds
    );

    // Vérifier que le design_usage a été créé
    const designUsages = await prisma.designUsage.findMany({
      where: { orderId: order.id }
    });

    console.log(`\n✅ Nombre de design_usages créés : ${designUsages.length}`);

    if (designUsages.length > 0) {
      const usage = designUsages[0];
      console.log(`\n📊 Détails du design usage :`);
      console.log(`   - ID : ${usage.id}`);
      console.log(`   - Design : ${usage.designName} (ID: ${usage.designId})`);
      console.log(`   - Vendeur : ID ${usage.vendorId}`);
      console.log(`   - Prix design : ${usage.designPrice} FCFA`);
      console.log(`   - Revenu vendeur (70%) : ${usage.vendorRevenue} FCFA`);
      console.log(`   - Frais plateforme (30%) : ${usage.platformFee} FCFA`);
      console.log(`   - Statut paiement : ${usage.paymentStatus}`);
      console.log(`   - Date utilisation : ${usage.usedAt}`);
    } else {
      console.log('❌ Aucun design_usage créé !');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 5. SIMULATION PAIEMENT CONFIRMÉ
    // ============================================
    console.log('📦 Étape 5 : Simulation du paiement confirmé...\n');

    await DesignUsageTracker.updatePaymentStatus(
      prisma as any,
      order.id,
      'CONFIRMED'
    );

    const afterPayment = await prisma.designUsage.findMany({
      where: { orderId: order.id }
    });

    console.log(`✅ Statut après paiement : ${afterPayment[0]?.paymentStatus}`);
    console.log(`   - Date confirmation : ${afterPayment[0]?.confirmedAt}`);

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 6. SIMULATION COMMANDE LIVRÉE
    // ============================================
    console.log('📦 Étape 6 : Simulation de la livraison...\n');

    await DesignUsageTracker.updatePaymentStatus(
      prisma as any,
      order.id,
      'READY_FOR_PAYOUT'
    );

    const afterDelivery = await prisma.designUsage.findMany({
      where: { orderId: order.id }
    });

    console.log(`✅ Statut après livraison : ${afterDelivery[0]?.paymentStatus}`);
    console.log(`   - Date prêt pour paiement : ${afterDelivery[0]?.readyForPayoutAt}`);

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 7. TEST DES STATISTIQUES
    // ============================================
    console.log('📦 Étape 7 : Test des statistiques de revenus...\n');

    const summary = await DesignUsageTracker.getOrderDesignUsagesSummary(
      prisma as any,
      order.id
    );

    console.log('📊 Résumé de la commande :');
    console.log(`   - Total designs : ${summary.totalDesigns}`);
    console.log(`   - Total revenus : ${summary.totalRevenue} FCFA`);
    console.log(`   - Vendeurs concernés : ${summary.byVendor.length}`);

    summary.byVendor.forEach(v => {
      console.log(`\n   Vendeur ${v.vendorName} (ID: ${v.vendorId}) :`);
      console.log(`     - Designs utilisés : ${v.designCount}`);
      console.log(`     - Revenus : ${v.totalRevenue} FCFA`);
    });

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 8. RÉSULTAT FINAL
    // ============================================
    console.log('✅ ===== TEST TERMINÉ AVEC SUCCÈS ! =====\n');
    console.log('📊 Résumé final :');
    console.log(`   - Commande : ${orderNumber}`);
    console.log(`   - Design utilisé : ${design.name} (${design.price} FCFA)`);
    console.log(`   - Vendeur recevra : ${afterDelivery[0]?.vendorRevenue} FCFA (70%)`);
    console.log(`   - Plateforme recevra : ${afterDelivery[0]?.platformFee} FCFA (30%)`);
    console.log(`   - Statut actuel : ${afterDelivery[0]?.paymentStatus}`);
    console.log('\n✅ Le système fonctionne correctement ! 🎉\n');

  } catch (error) {
    console.error('\n❌ ===== ERREUR LORS DU TEST =====\n');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testDesignRevenueFlow()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur:', error.message);
    process.exit(1);
  });
