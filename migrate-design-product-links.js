const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 🔧 Script de Migration - Design Product Links V2
 * 
 * Ce script migre les liens existants basés sur designCloudinaryUrl
 * vers le nouveau système DesignProductLink avec designId
 */

async function migrateDesignProductLinks() {
  console.log('🔧 === MIGRATION DESIGN PRODUCT LINKS V2 ===');
  console.log('');

  try {
    // 1. Vérifier que les tables existent
    console.log('1. Vérification des tables...');
    
    const designCount = await prisma.design.count();
    const vendorProductCount = await prisma.vendorProduct.count();
    
    console.log(`   - Designs: ${designCount}`);
    console.log(`   - Produits vendeur: ${vendorProductCount}`);
    
    // 2. Récupérer les produits avec designCloudinaryUrl mais sans designId
    console.log('');
    console.log('2. Recherche des produits à migrer...');
    
    const productsToMigrate = await prisma.vendorProduct.findMany({
      where: {
        designCloudinaryUrl: { not: null },
        designId: null
      },
      select: {
        id: true,
        vendorId: true,
        designCloudinaryUrl: true,
        name: true,
        status: true
      }
    });
    
    console.log(`   - Produits à migrer: ${productsToMigrate.length}`);
    
    if (productsToMigrate.length === 0) {
      console.log('✅ Aucun produit à migrer trouvé');
      return { created: 0, errors: 0, updated: 0 };
    }
    
    // 3. Migrer chaque produit
    console.log('');
    console.log('3. Migration des produits...');
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const product of productsToMigrate) {
      try {
        console.log(`   Traitement produit ${product.id}: ${product.name}`);
        
        // Trouver le design correspondant
        const design = await prisma.design.findFirst({
          where: {
            imageUrl: product.designCloudinaryUrl,
            vendorId: product.vendorId
          }
        });
        
        if (!design) {
          console.log(`     ⚠️ Design non trouvé pour URL: ${product.designCloudinaryUrl}`);
          errors++;
          continue;
        }
        
        console.log(`     ✅ Design trouvé: ${design.name} (ID: ${design.id})`);
        
        // Créer le lien DesignProductLink
        try {
          await prisma.designProductLink.create({
            data: {
              designId: design.id,
              vendorProductId: product.id
            }
          });
          
          console.log(`     🔗 Lien créé: Design ${design.id} ↔ Produit ${product.id}`);
          created++;
        } catch (linkError) {
          if (linkError.code === 'P2002') {
            console.log(`     🔗 Lien déjà existant: Design ${design.id} ↔ Produit ${product.id}`);
          } else {
            console.log(`     ❌ Erreur création lien: ${linkError.message}`);
            errors++;
            continue;
          }
        }
        
        // Mettre à jour le designId dans VendorProduct
        await prisma.vendorProduct.update({
          where: { id: product.id },
          data: { designId: design.id }
        });
        
        console.log(`     ✅ designId mis à jour: ${design.id}`);
        updated++;
        
      } catch (error) {
        console.log(`     ❌ Erreur produit ${product.id}: ${error.message}`);
        errors++;
      }
    }
    
    // 4. Statistiques finales
    console.log('');
    console.log('4. Vérification post-migration...');
    
    const stats = await getStats();
    console.log(`   - Total liens: ${stats.totalLinks}`);
    console.log(`   - Designs uniques: ${stats.uniqueDesigns}`);
    console.log(`   - Produits uniques: ${stats.uniqueProducts}`);
    console.log(`   - Produits avec designId: ${stats.productsWithDesignId}`);
    console.log(`   - Produits avec URL seulement: ${stats.productsWithUrlOnly}`);
    
    console.log('');
    console.log('🎉 === RÉSUMÉ MIGRATION ===');
    console.log(`✅ Liens créés: ${created}`);
    console.log(`✅ Produits mis à jour: ${updated}`);
    console.log(`❌ Erreurs: ${errors}`);
    
    return { created, updated, errors };
    
  } catch (error) {
    console.error('❌ Erreur globale migration:', error);
    throw error;
  }
}

/**
 * 📊 Récupérer les statistiques des liens
 */
async function getStats() {
  try {
    const [
      totalLinks,
      uniqueDesigns,
      uniqueProducts,
      productsWithDesignId,
      productsWithUrlOnly
    ] = await Promise.all([
      prisma.designProductLink.count(),
      prisma.designProductLink.groupBy({
        by: ['designId'],
        _count: true
      }).then(result => result.length),
      prisma.designProductLink.groupBy({
        by: ['vendorProductId'],
        _count: true
      }).then(result => result.length),
      prisma.vendorProduct.count({
        where: { designId: { not: null } }
      }),
      prisma.vendorProduct.count({
        where: {
          designCloudinaryUrl: { not: null },
          designId: null
        }
      })
    ]);

    return {
      totalLinks,
      uniqueDesigns,
      uniqueProducts,
      productsWithDesignId,
      productsWithUrlOnly
    };
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    return {
      totalLinks: 0,
      uniqueDesigns: 0,
      uniqueProducts: 0,
      productsWithDesignId: 0,
      productsWithUrlOnly: 0
    };
  }
}

/**
 * 🧹 Nettoyer les liens orphelins
 */
async function cleanupOrphanedLinks() {
  console.log('🧹 Nettoyage des liens orphelins...');
  
  try {
    // Supprimer les liens vers des designs supprimés
    const deletedDesignLinks = await prisma.$executeRaw`
      DELETE FROM "DesignProductLink" 
      WHERE "design_id" NOT IN (SELECT id FROM "Design")
    `;
    
    // Supprimer les liens vers des produits supprimés
    const deletedProductLinks = await prisma.$executeRaw`
      DELETE FROM "DesignProductLink" 
      WHERE "vendor_product_id" NOT IN (SELECT id FROM "VendorProduct")
    `;
    
    console.log(`   - Liens design supprimés: ${deletedDesignLinks}`);
    console.log(`   - Liens produit supprimés: ${deletedProductLinks}`);
    
    return { deleted: deletedDesignLinks + deletedProductLinks };
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    return { deleted: 0 };
  }
}

/**
 * 🔧 Réparer les liens manquants
 */
async function repairMissingLinks() {
  console.log('🔧 Réparation des liens manquants...');
  
  try {
    // Trouver les produits avec designId mais sans lien
    const productsWithDesignIdButNoLink = await prisma.vendorProduct.findMany({
      where: {
        designId: { not: null },
        designProductLinks: { none: {} }
      },
      select: {
        id: true,
        designId: true,
        name: true
      }
    });
    
    console.log(`   - Produits à réparer: ${productsWithDesignIdButNoLink.length}`);
    
    let repaired = 0;
    let errors = 0;
    
    for (const product of productsWithDesignIdButNoLink) {
      try {
        await prisma.designProductLink.create({
          data: {
            designId: product.designId,
            vendorProductId: product.id
          }
        });
        
        console.log(`     🔧 Réparé: Produit ${product.id} (${product.name})`);
        repaired++;
      } catch (error) {
        console.log(`     ❌ Erreur réparation produit ${product.id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`   - Liens réparés: ${repaired}`);
    console.log(`   - Erreurs: ${errors}`);
    
    return { repaired, errors };
  } catch (error) {
    console.error('❌ Erreur réparation:', error);
    return { repaired: 0, errors: 1 };
  }
}

/**
 * 🧪 Script principal
 */
async function main() {
  try {
    console.log('🚀 Démarrage de la migration Design Product Links V2');
    console.log('');
    
    // 1. Migration principale
    const migrationResult = await migrateDesignProductLinks();
    
    // 2. Nettoyage des liens orphelins
    console.log('');
    const cleanupResult = await cleanupOrphanedLinks();
    
    // 3. Réparation des liens manquants
    console.log('');
    const repairResult = await repairMissingLinks();
    
    // 4. Statistiques finales
    console.log('');
    console.log('📊 === STATISTIQUES FINALES ===');
    const finalStats = await getStats();
    console.log(`Total liens: ${finalStats.totalLinks}`);
    console.log(`Designs uniques: ${finalStats.uniqueDesigns}`);
    console.log(`Produits uniques: ${finalStats.uniqueProducts}`);
    console.log(`Produits avec designId: ${finalStats.productsWithDesignId}`);
    console.log(`Produits avec URL seulement: ${finalStats.productsWithUrlOnly}`);
    
    console.log('');
    console.log('🎉 === MIGRATION TERMINÉE ===');
    console.log(`✅ Migration: ${migrationResult.created} créés, ${migrationResult.updated} mis à jour, ${migrationResult.errors} erreurs`);
    console.log(`✅ Nettoyage: ${cleanupResult.deleted} liens orphelins supprimés`);
    console.log(`✅ Réparation: ${repairResult.repaired} liens réparés, ${repairResult.errors} erreurs`);
    
    if (migrationResult.errors === 0 && repairResult.errors === 0) {
      console.log('🎉 MIGRATION RÉUSSIE - Le système cascade validation V2 est prêt !');
    } else {
      console.log('⚠️ MIGRATION AVEC ERREURS - Vérifiez les logs ci-dessus');
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier si le script est exécuté directement
if (require.main === module) {
  main();
}

module.exports = {
  migrateDesignProductLinks,
  getStats,
  cleanupOrphanedLinks,
  repairMissingLinks
}; 