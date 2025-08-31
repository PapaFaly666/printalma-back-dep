const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingDesignUrlMockupUrl() {
  console.log('🔧 === MIGRATION DESIGNURL ET MOCKUPURL POUR PRODUITS EXISTANTS ===\n');

  try {
    // 1. Identifier les produits qui nécessitent une correction
    const problematicProducts = await prisma.vendorProduct.findMany({
      where: {
        OR: [
          { mockupUrl: null },
          { originalDesignUrl: null }
        ]
      },
      select: {
        id: true,
        vendorName: true,
        designUrl: true,
        mockupUrl: true,
        originalDesignUrl: true,
        createdAt: true,
        baseProduct: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 ${problematicProducts.length} produits nécessitent une correction\n`);

    if (problematicProducts.length === 0) {
      console.log('✅ Aucun produit à corriger !');
      return;
    }

    let correctedCount = 0;
    let errorCount = 0;

    for (const product of problematicProducts) {
      console.log(`🔧 Correction produit ${product.id}: "${product.vendorName}"`);
      console.log(`   Type: ${product.baseProduct.name}`);
      console.log(`   AVANT:`);
      console.log(`      DesignUrl: ${product.designUrl ? product.designUrl.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`      MockupUrl: ${product.mockupUrl ? product.mockupUrl.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`      OriginalDesignUrl: ${product.originalDesignUrl ? product.originalDesignUrl.substring(0, 60) + '...' : 'NULL'}`);

      try {
        // Stratégie de correction selon le cas
        let newDesignUrl = product.designUrl;
        let newMockupUrl = product.mockupUrl;
        let newOriginalDesignUrl = product.originalDesignUrl;
        
        // CAS 1: MockupUrl est NULL mais DesignUrl existe
        if (!product.mockupUrl && product.designUrl) {
          // L'ancien designUrl devient mockupUrl (car c'était un mockup)
          newMockupUrl = product.designUrl;
          
          // Si l'URL semble être un mockup (contient vendor_), la garder comme design temporaire
          if (product.designUrl.includes('vendor_')) {
            // Cas typique: l'ancien designUrl était en fait un mockup
            newDesignUrl = product.designUrl; // On garde la même pour l'instant
            console.log(`      🔄 Strategy: Ancien designUrl devient mockupUrl (était déjà un mockup)`);
          } else {
            // Cas moins courant: designUrl était vraiment un design
            newDesignUrl = product.designUrl;
            console.log(`      🔄 Strategy: DesignUrl semble correct, ajout de mockupUrl`);
          }
        }
        
        // CAS 2: OriginalDesignUrl est NULL - on ne peut pas le reconstituer
        // On laisse NULL car on ne peut pas deviner le design original
        
        console.log(`   APRÈS:`);
        console.log(`      DesignUrl: ${newDesignUrl ? newDesignUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`      MockupUrl: ${newMockupUrl ? newMockupUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`      OriginalDesignUrl: ${newOriginalDesignUrl ? newOriginalDesignUrl.substring(0, 60) + '...' : 'NULL'}`);

        // Appliquer la correction si des changements sont nécessaires
        const needsUpdate = (
          newMockupUrl !== product.mockupUrl ||
          newDesignUrl !== product.designUrl ||
          newOriginalDesignUrl !== product.originalDesignUrl
        );

        if (needsUpdate) {
          await prisma.vendorProduct.update({
            where: { id: product.id },
            data: {
              designUrl: newDesignUrl,
              mockupUrl: newMockupUrl,
              originalDesignUrl: newOriginalDesignUrl
            }
          });
          
          console.log(`   ✅ Produit ${product.id} mis à jour avec succès`);
          correctedCount++;
        } else {
          console.log(`   ⏭️ Aucun changement nécessaire pour produit ${product.id}`);
        }

      } catch (error) {
        console.error(`   ❌ Erreur lors de la correction du produit ${product.id}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Ligne vide
    }

    // Résumé final
    console.log('📊 === RÉSUMÉ DE LA MIGRATION ===');
    console.log(`✅ Produits corrigés avec succès: ${correctedCount}`);
    console.log(`❌ Erreurs rencontrées: ${errorCount}`);
    console.log(`📈 Taux de succès: ${Math.round((correctedCount / problematicProducts.length) * 100)}%`);

    if (correctedCount > 0) {
      console.log(`\n🎉 Migration terminée ! ${correctedCount} produits ont été corrigés.`);
      console.log(`💡 Note: Les originalDesignUrl restent NULL car non récupérables pour les anciens produits.`);
      console.log(`🔄 Les nouveaux produits utiliseront automatiquement la logique correcte.`);
    }

    // Vérification post-migration
    console.log(`\n🔍 === VÉRIFICATION POST-MIGRATION ===`);
    const verificationProducts = await prisma.vendorProduct.findMany({
      where: {
        id: { in: problematicProducts.map(p => p.id) }
      },
      select: {
        id: true,
        vendorName: true,
        designUrl: true,
        mockupUrl: true,
        originalDesignUrl: true
      }
    });

    let fixedProducts = 0;
    verificationProducts.forEach(product => {
      const hasDesignUrl = !!product.designUrl;
      const hasMockupUrl = !!product.mockupUrl;
      
      if (hasDesignUrl && hasMockupUrl) {
        fixedProducts++;
        console.log(`✅ Produit ${product.id}: DesignUrl et MockupUrl présents`);
      } else {
        console.log(`⚠️ Produit ${product.id}: Encore des URLs manquantes`);
      }
    });

    console.log(`\n📊 Produits avec URLs complètes après migration: ${fixedProducts}/${verificationProducts.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  fixExistingDesignUrlMockupUrl().catch(console.error);
}

module.exports = { fixExistingDesignUrlMockupUrl }; 

const prisma = new PrismaClient();

async function fixExistingDesignUrlMockupUrl() {
  console.log('🔧 === MIGRATION DESIGNURL ET MOCKUPURL POUR PRODUITS EXISTANTS ===\n');

  try {
    // 1. Identifier les produits qui nécessitent une correction
    const problematicProducts = await prisma.vendorProduct.findMany({
      where: {
        OR: [
          { mockupUrl: null },
          { originalDesignUrl: null }
        ]
      },
      select: {
        id: true,
        vendorName: true,
        designUrl: true,
        mockupUrl: true,
        originalDesignUrl: true,
        createdAt: true,
        baseProduct: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 ${problematicProducts.length} produits nécessitent une correction\n`);

    if (problematicProducts.length === 0) {
      console.log('✅ Aucun produit à corriger !');
      return;
    }

    let correctedCount = 0;
    let errorCount = 0;

    for (const product of problematicProducts) {
      console.log(`🔧 Correction produit ${product.id}: "${product.vendorName}"`);
      console.log(`   Type: ${product.baseProduct.name}`);
      console.log(`   AVANT:`);
      console.log(`      DesignUrl: ${product.designUrl ? product.designUrl.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`      MockupUrl: ${product.mockupUrl ? product.mockupUrl.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`      OriginalDesignUrl: ${product.originalDesignUrl ? product.originalDesignUrl.substring(0, 60) + '...' : 'NULL'}`);

      try {
        // Stratégie de correction selon le cas
        let newDesignUrl = product.designUrl;
        let newMockupUrl = product.mockupUrl;
        let newOriginalDesignUrl = product.originalDesignUrl;
        
        // CAS 1: MockupUrl est NULL mais DesignUrl existe
        if (!product.mockupUrl && product.designUrl) {
          // L'ancien designUrl devient mockupUrl (car c'était un mockup)
          newMockupUrl = product.designUrl;
          
          // Si l'URL semble être un mockup (contient vendor_), la garder comme design temporaire
          if (product.designUrl.includes('vendor_')) {
            // Cas typique: l'ancien designUrl était en fait un mockup
            newDesignUrl = product.designUrl; // On garde la même pour l'instant
            console.log(`      🔄 Strategy: Ancien designUrl devient mockupUrl (était déjà un mockup)`);
          } else {
            // Cas moins courant: designUrl était vraiment un design
            newDesignUrl = product.designUrl;
            console.log(`      🔄 Strategy: DesignUrl semble correct, ajout de mockupUrl`);
          }
        }
        
        // CAS 2: OriginalDesignUrl est NULL - on ne peut pas le reconstituer
        // On laisse NULL car on ne peut pas deviner le design original
        
        console.log(`   APRÈS:`);
        console.log(`      DesignUrl: ${newDesignUrl ? newDesignUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`      MockupUrl: ${newMockupUrl ? newMockupUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`      OriginalDesignUrl: ${newOriginalDesignUrl ? newOriginalDesignUrl.substring(0, 60) + '...' : 'NULL'}`);

        // Appliquer la correction si des changements sont nécessaires
        const needsUpdate = (
          newMockupUrl !== product.mockupUrl ||
          newDesignUrl !== product.designUrl ||
          newOriginalDesignUrl !== product.originalDesignUrl
        );

        if (needsUpdate) {
          await prisma.vendorProduct.update({
            where: { id: product.id },
            data: {
              designUrl: newDesignUrl,
              mockupUrl: newMockupUrl,
              originalDesignUrl: newOriginalDesignUrl
            }
          });
          
          console.log(`   ✅ Produit ${product.id} mis à jour avec succès`);
          correctedCount++;
        } else {
          console.log(`   ⏭️ Aucun changement nécessaire pour produit ${product.id}`);
        }

      } catch (error) {
        console.error(`   ❌ Erreur lors de la correction du produit ${product.id}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Ligne vide
    }

    // Résumé final
    console.log('📊 === RÉSUMÉ DE LA MIGRATION ===');
    console.log(`✅ Produits corrigés avec succès: ${correctedCount}`);
    console.log(`❌ Erreurs rencontrées: ${errorCount}`);
    console.log(`📈 Taux de succès: ${Math.round((correctedCount / problematicProducts.length) * 100)}%`);

    if (correctedCount > 0) {
      console.log(`\n🎉 Migration terminée ! ${correctedCount} produits ont été corrigés.`);
      console.log(`💡 Note: Les originalDesignUrl restent NULL car non récupérables pour les anciens produits.`);
      console.log(`🔄 Les nouveaux produits utiliseront automatiquement la logique correcte.`);
    }

    // Vérification post-migration
    console.log(`\n🔍 === VÉRIFICATION POST-MIGRATION ===`);
    const verificationProducts = await prisma.vendorProduct.findMany({
      where: {
        id: { in: problematicProducts.map(p => p.id) }
      },
      select: {
        id: true,
        vendorName: true,
        designUrl: true,
        mockupUrl: true,
        originalDesignUrl: true
      }
    });

    let fixedProducts = 0;
    verificationProducts.forEach(product => {
      const hasDesignUrl = !!product.designUrl;
      const hasMockupUrl = !!product.mockupUrl;
      
      if (hasDesignUrl && hasMockupUrl) {
        fixedProducts++;
        console.log(`✅ Produit ${product.id}: DesignUrl et MockupUrl présents`);
      } else {
        console.log(`⚠️ Produit ${product.id}: Encore des URLs manquantes`);
      }
    });

    console.log(`\n📊 Produits avec URLs complètes après migration: ${fixedProducts}/${verificationProducts.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  fixExistingDesignUrlMockupUrl().catch(console.error);
}

module.exports = { fixExistingDesignUrlMockupUrl }; 
 
 
 
 
 
 
 
 
 
 