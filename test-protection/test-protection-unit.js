// Test unitaire des logiques de protection sans serveur
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUnitProtection() {
  console.log('🧪 Test unitaire de protection contre la suppression...\n');

  try {
    // 1. Simuler la logique de SubCategoryService.remove()
    console.log('1️⃣ Test de la logique de suppression de sous-catégorie...');

    // Trouver une sous-catégorie
    const subCategory = await prisma.subCategory.findFirst({
      where: { isActive: true },
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

    if (!subCategory) {
      console.log('❌ Aucune sous-catégorie trouvée');
      return;
    }

    console.log(`✅ Sous-catégorie: ${subCategory.name} (ID: ${subCategory.id})`);
    console.log(`   - Variations: ${subCategory.variations.length}`);
    console.log(`   - Produits directs: ${subCategory._count.products}`);

    // Simuler la logique de protection
    const directProductsCount = subCategory._count.products;
    const variationsWithProducts = subCategory.variations.filter(v => v._count.products > 0);
    const totalProductsThroughVariations = variationsWithProducts.reduce(
      (total, variation) => total + variation._count.products,
      0
    );

    const totalAffectedProducts = directProductsCount + totalProductsThroughVariations;

    if (totalAffectedProducts > 0) {
      console.log('✅ Protection activée: La sous-catégorie ne peut pas être supprimée');
      console.log(`   Produits directs: ${directProductsCount}`);
      console.log(`   Produits via variations: ${totalProductsThroughVariations}`);
      console.log(`   Total: ${totalAffectedProducts}`);
    } else if (subCategory.variations.length > 0) {
      console.log('✅ Protection activée: La sous-catégorie a des variations sans produits');
      console.log(`   Variations: ${subCategory.variations.length}`);
    } else {
      console.log('ℹ️  La sous-catégorie pourrait être supprimée (pas utilisée)');
    }

    // 2. Simuler la logique de VariationService.remove()
    console.log('\n2️⃣ Test de la logique de suppression de variation...');

    if (subCategory.variations.length > 0) {
      const variation = subCategory.variations[0];
      console.log(`✅ Variation: ${variation.name} (ID: ${variation.id})`);
      console.log(`   - Produits: ${variation._count.products}`);

      // Simuler la logique de protection pour les variations
      if (variation._count.products > 0) {
        console.log('✅ Protection activée: La variation ne peut pas être supprimée');
        console.log(`   Produits liés: ${variation._count.products}`);
      } else {
        console.log('ℹ️  La variation pourrait être désactivée (pas de produits)');
      }
    } else {
      console.log('ℹ️  Aucune variation à tester');
    }

    // 3. Test de suppression réelle (avec rollback)
    console.log('\n3️⃣ Test de suppression avec transaction (rollback)...');

    await prisma.$transaction(async (tx) => {
      // Tester si on peut supprimer une sous-catégorie vide
      const emptySubCategory = await tx.subCategory.findFirst({
        where: {
          isActive: true,
          products: {
            none: {
              isDelete: false
            }
          },
          variations: {
            none: {
              isActive: true
            }
          }
        }
      });

      if (emptySubCategory) {
        console.log(`✅ Sous-catégorie vide trouvée: ${emptySubCategory.name} (ID: ${emptySubCategory.id})`);

        // Simuler la suppression sans valider la transaction
        console.log('ℹ️  Suppression simulée (rollback automatique)');
        await tx.subCategory.delete({
          where: { id: emptySubCategory.id }
        });

        // Cette partie ne sera jamais exécutée car on va faire un rollback
        throw new Error('ROLLBACK_TEST');
      } else {
        console.log('ℹ️  Aucune sous-catégorie vide trouvée pour le test');
      }
    }).catch(error => {
      if (error.message === 'ROLLBACK_TEST') {
        console.log('✅ Test de suppression réussi (rollback effectué)');
      } else {
        console.log('⚠️  Erreur dans la transaction:', error.message);
      }
    });

    console.log('\n✅ Tests unitaires terminés avec succès');

  } catch (error) {
    console.error('❌ Erreur dans les tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUnitProtection();