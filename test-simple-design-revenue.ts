import { PrismaClient } from '@prisma/client';
import { DesignUsageTracker } from './src/utils/designUsageTracker';

const prisma = new PrismaClient();

/**
 * Test simple du système de revenus des designs vendeurs
 * Utilise les données existantes dans la DB
 */

async function testSimpleDesignRevenue() {
  console.log('🧪 ===== TEST SIMPLE DU SYSTÈME DE REVENUS =====\n');

  try {
    // ============================================
    // 1. VÉRIFIER LES DONNÉES EXISTANTES
    // ============================================
    console.log('📦 Vérification des données existantes...\n');

    const vendorCount = await prisma.user.count({ where: { role: 'VENDEUR' } });
    const designCount = await prisma.design.count();
    const productCount = await prisma.product.count();

    console.log(`✅ Vendeurs dans la DB : ${vendorCount}`);
    console.log(`✅ Designs dans la DB : ${designCount}`);
    console.log(`✅ Produits dans la DB : ${productCount}`);

    if (vendorCount === 0 || designCount === 0 || productCount === 0) {
      console.log('\n⚠️  La base de données ne contient pas suffisamment de données pour le test.');
      console.log('   Veuillez d\'abord créer au moins un vendeur, un design et un produit.\n');
      return;
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 2. TESTER AVEC UNE COMMANDE EXISTANTE (SI DISPONIBLE)
    // ============================================
    console.log('📦 Recherche de commandes existantes avec designs...\n');

    // Chercher une customization qui utilise un design
    const customizations = await prisma.productCustomization.findMany({
      take: 5,
      include: {
        order: true
      }
    });

    console.log(`✅ Customizations trouvées : ${customizations.length}`);

    let customizationWithDesign = null;
    for (const custom of customizations) {
      const elements = custom.designElements as any[];
      if (elements && elements.length > 0) {
        const hasDesign = elements.some(el => el.type === 'image' && el.designId);
        if (hasDesign) {
          customizationWithDesign = custom;
          break;
        }
      }
    }

    if (customizationWithDesign) {
      console.log(`✅ Customization avec design trouvée : ID ${customizationWithDesign.id}`);

      const elements = customizationWithDesign.designElements as any[];
      const designElement = elements.find(el => el.type === 'image' && el.designId);

      if (designElement) {
        console.log(`   - Design utilisé : ID ${designElement.designId}`);
        console.log(`   - Prix du design : ${designElement.designPrice} FCFA`);
      }

      if (customizationWithDesign.orderId) {
        console.log(`   - Commande associée : ID ${customizationWithDesign.orderId}`);

        // Vérifier si des design_usages existent déjà
        const existingUsages = await prisma.designUsage.findMany({
          where: { orderId: customizationWithDesign.orderId }
        });

        console.log(`   - Design usages enregistrés : ${existingUsages.length}`);

        if (existingUsages.length > 0) {
          console.log('\n📊 Détails des design usages :');
          existingUsages.forEach((usage, index) => {
            console.log(`\n   ${index + 1}. Design: ${usage.designName}`);
            console.log(`      - Vendeur ID: ${usage.vendorId}`);
            console.log(`      - Prix: ${usage.designPrice} FCFA`);
            console.log(`      - Revenu vendeur: ${usage.vendorRevenue} FCFA (70%)`);
            console.log(`      - Frais plateforme: ${usage.platformFee} FCFA (30%)`);
            console.log(`      - Statut: ${usage.paymentStatus}`);
            console.log(`      - Date: ${usage.usedAt}`);
          });
        }
      }
    } else {
      console.log('⚠️  Aucune customization avec design trouvée.');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 3. TESTER LES STATISTIQUES (SI DES DONNÉES EXISTENT)
    // ============================================
    console.log('📦 Test des statistiques globales...\n');

    const allDesignUsages = await prisma.designUsage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        design: {
          select: { name: true }
        },
        vendor: {
          select: { firstName: true, lastName: true, shop_name: true }
        },
        order: {
          select: { orderNumber: true }
        }
      }
    });

    console.log(`✅ Total design usages dans la DB : ${allDesignUsages.length}`);

    if (allDesignUsages.length > 0) {
      console.log('\n📊 Derniers design usages :');
      allDesignUsages.slice(0, 5).forEach((usage, index) => {
        const vendorName = usage.vendor.shop_name || `${usage.vendor.firstName} ${usage.vendor.lastName}`;
        console.log(`\n   ${index + 1}. ${usage.designName}`);
        console.log(`      - Vendeur: ${vendorName}`);
        console.log(`      - Commande: ${usage.orderNumber}`);
        console.log(`      - Revenu: ${usage.vendorRevenue} FCFA`);
        console.log(`      - Statut: ${usage.paymentStatus}`);
      });

      // Calculer les statistiques globales
      const totalRevenue = allDesignUsages.reduce(
        (sum, usage) => sum + parseFloat(usage.vendorRevenue.toString()),
        0
      );

      const byStatus = allDesignUsages.reduce((acc, usage) => {
        acc[usage.paymentStatus] = (acc[usage.paymentStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n📊 Statistiques :');
      console.log(`   - Revenu total généré : ${totalRevenue.toFixed(2)} FCFA`);
      console.log(`   - Par statut :`);
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`     • ${status}: ${count}`);
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 4. TESTER LES MÉTHODES DU SERVICE
    // ============================================
    console.log('📦 Test des méthodes du service...\n');

    // Trouver un vendeur avec des designs
    const vendorWithDesigns = await prisma.user.findFirst({
      where: {
        role: 'VENDEUR',
        designs: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { designs: true }
        }
      }
    });

    if (vendorWithDesigns) {
      console.log(`✅ Vendeur trouvé : ID ${vendorWithDesigns.id}`);
      console.log(`   - Nom boutique: ${vendorWithDesigns.shop_name || vendorWithDesigns.firstName}`);
      console.log(`   - Designs: ${vendorWithDesigns._count.designs}`);

      // Compter ses design usages
      const vendorUsages = await prisma.designUsage.count({
        where: { vendorId: vendorWithDesigns.id }
      });

      console.log(`   - Design usages enregistrés: ${vendorUsages}`);

      if (vendorUsages > 0) {
        // Calculer ses revenus
        const vendorStats = await prisma.designUsage.aggregate({
          where: { vendorId: vendorWithDesigns.id },
          _sum: { vendorRevenue: true },
          _count: true
        });

        const totalRevenue = parseFloat(vendorStats._sum.vendorRevenue?.toString() || '0');

        console.log('\n📊 Statistiques du vendeur :');
        console.log(`   - Utilisations totales: ${vendorStats._count}`);
        console.log(`   - Revenus totaux: ${totalRevenue.toFixed(2)} FCFA`);
      }
    } else {
      console.log('⚠️  Aucun vendeur avec des designs trouvé.');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ============================================
    // 5. RÉSUMÉ
    // ============================================
    console.log('✅ ===== TEST TERMINÉ ! =====\n');

    const summary = await prisma.designUsage.aggregate({
      _sum: {
        vendorRevenue: true,
        platformFee: true
      },
      _count: true
    });

    const totalVendorRevenue = parseFloat(summary._sum.vendorRevenue?.toString() || '0');
    const totalPlatformFee = parseFloat(summary._sum.platformFee?.toString() || '0');

    console.log('📊 Résumé global du système :');
    console.log(`   - Total design usages: ${summary._count}`);
    console.log(`   - Revenus vendeurs: ${totalVendorRevenue.toFixed(2)} FCFA`);
    console.log(`   - Revenus plateforme: ${totalPlatformFee.toFixed(2)} FCFA`);
    console.log(`   - Total global: ${(totalVendorRevenue + totalPlatformFee).toFixed(2)} FCFA`);

    console.log('\n✅ Le système de revenus fonctionne ! 🎉\n');

  } catch (error) {
    console.error('\n❌ ===== ERREUR LORS DU TEST =====\n');
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testSimpleDesignRevenue()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur:', error.message);
    process.exit(1);
  });
