const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeleteProtection() {
  console.log('🧪 Test de protection contre la suppression...\n');

  try {
    // 1. Trouver une sous-catégorie avec des variations
    console.log('1️⃣ Recherche d\'une sous-catégorie avec des variations...');
    const subCategoryWithVariations = await prisma.subCategory.findFirst({
      where: {
        isActive: true,
        variations: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        variations: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    isDelete: false
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            products: {
              where: {
                isDelete: false
              }
            }
          }
        }
      }
    });

    if (!subCategoryWithVariations) {
      console.log('❌ Aucune sous-catégorie avec variations trouvée');
      return;
    }

    console.log(`✅ Sous-catégorie trouvée: ${subCategoryWithVariations.name} (ID: ${subCategoryWithVariations.id})`);
    console.log(`   - Variations: ${subCategoryWithVariations.variations.length}`);
    console.log(`   - Produits directs: ${subCategoryWithVariations._count.products}`);

    // Afficher les détails des variations
    for (const variation of subCategoryWithVariations.variations) {
      console.log(`   - Variation: ${variation.name} (ID: ${variation.id}) - ${variation._count.products} produit(s)`);
    }

    // 2. Test de suppression de la sous-catégorie (devrait échouer)
    console.log('\n2️⃣ Test de suppression de la sous-catégorie (devrait échouer)...');
    try {
      await prisma.subCategory.delete({
        where: { id: subCategoryWithVariations.id }
      });
      console.log('❌ ERREUR: La sous-catégorie a été supprimée !');
    } catch (error) {
      console.log('✅ Succès: La sous-catégorie est protégée contre la suppression');
      console.log(`   Message: ${error.message}`);
    }

    // 3. Test de suppression d'une variation avec produits (devrait échouer)
    const variationWithProducts = subCategoryWithVariations.variations.find(v => v._count.products > 0);
    if (variationWithProducts) {
      console.log('\n3️⃣ Test de suppression d\'une variation avec produits (devrait échouer)...');
      try {
        await prisma.variation.delete({
          where: { id: variationWithProducts.id }
        });
        console.log('❌ ERREUR: La variation a été supprimée !');
      } catch (error) {
        console.log('✅ Succès: La variation est protégée contre la suppression');
        console.log(`   Message: ${error.message}`);
      }
    } else {
      console.log('\n3️⃣ Aucune variation avec des produits trouvée pour tester');
    }

    // 4. Test de suppression d'une variation sans produits (devrait réussir)
    const variationWithoutProducts = subCategoryWithVariations.variations.find(v => v._count.products === 0);
    if (variationWithoutProducts) {
      console.log('\n4️⃣ Test de suppression d\'une variation sans produits (devrait réussir)...');
      try {
        await prisma.variation.delete({
          where: { id: variationWithoutProducts.id }
        });
        console.log('✅ Succès: La variation sans produits a été supprimée');
      } catch (error) {
        console.log('⚠️  La suppression a échoué (peut-être dû à d\'autres contraintes)');
        console.log(`   Message: ${error.message}`);
      }
    } else {
      console.log('\n4️⃣ Aucune variation sans produits trouvée pour tester');
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteProtection();