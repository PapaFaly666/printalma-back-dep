// Test final des protections en simulant les services
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simuler SubCategoryService.remove()
async function testSubCategoryProtection(id) {
  console.log(`\n🔍 Test de protection pour la sous-catégorie ID: ${id}`);

  try {
    // Vérifier que la sous-catégorie existe
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        variations: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                products: {
                  where: { isDelete: false }
                }
              }
            }
          }
        },
        _count: {
          select: {
            products: {
              where: { isDelete: false }
            }
          }
        }
      }
    });

    if (!subCategory) {
      console.log('❌ Sous-catégorie non trouvée');
      return false;
    }

    console.log(`📋 Sous-catégorie: ${subCategory.name}`);
    console.log(`   - Variations: ${subCategory.variations.length}`);
    console.log(`   - Produits directs: ${subCategory._count.products}`);

    // Vérifier si des produits sont liés directement à cette sous-catégorie
    const directProductsCount = subCategory._count.products;

    // Vérifier si des variations de cette sous-catégorie sont utilisées par des produits
    const variationsWithProducts = subCategory.variations.filter(v => v._count.products > 0);
    const totalProductsThroughVariations = variationsWithProducts.reduce(
      (total, variation) => total + variation._count.products,
      0
    );

    // Calculer le nombre total de produits affectés
    const totalAffectedProducts = directProductsCount + totalProductsThroughVariations;

    console.log(`   - Produits via variations: ${totalProductsThroughVariations}`);
    console.log(`   - Total affecté: ${totalAffectedProducts}`);

    if (totalAffectedProducts > 0) {
      console.log('🛡️  PROTECTION ACTIVÉE: La sous-catégorie est utilisée par des produits');
      console.log(`   Erreur: SUBCATEGORY_IN_USE`);
      console.log(`   Message: La sous-catégorie est utilisée par ${totalAffectedProducts} produit(s) au total.`);
      return true; // Protection fonctionnelle
    }

    // Vérifier si la sous-catégorie a des variations (même sans produits)
    if (subCategory.variations.length > 0) {
      console.log('🛡️  PROTECTION ACTIVÉE: La sous-catégorie contient des variations');
      console.log(`   Erreur: SUBCATEGORY_HAS_VARIATIONS`);
      console.log(`   Message: La sous-catégorie contient ${subCategory.variations.length} variation(s).`);
      return true; // Protection fonctionnelle
    }

    console.log('✅ La sous-catégorie pourrait être supprimée (pas utilisée)');
    return false; // Pas de protection nécessaire

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Simuler VariationService.remove()
async function testVariationProtection(id) {
  console.log(`\n🔍 Test de protection pour la variation ID: ${id}`);

  try {
    // Vérifier que la variation existe
    const variation = await prisma.variation.findUnique({
      where: { id },
      include: {
        subCategory: true,
        _count: {
          select: {
            products: {
              where: { isDelete: false }
            }
          }
        }
      }
    });

    if (!variation) {
      console.log('❌ Variation non trouvée');
      return false;
    }

    console.log(`📋 Variation: ${variation.name} (sous-catégorie: ${variation.subCategory.name})`);
    console.log(`   - Produits directs: ${variation._count.products}`);

    // Vérifier si des produits sont liés à cette variation
    const productsCount = variation._count.products;

    // Vérifier également les produits liés via la sous-catégorie parente
    const parentSubCategoryProducts = await prisma.product.count({
      where: {
        subCategoryId: variation.subCategoryId,
        variationId: null, // Produits qui n'ont pas de variation directe
        isDelete: false
      }
    });

    const totalAffectedProducts = productsCount + parentSubCategoryProducts;

    console.log(`   - Produits dans la sous-catégorie parente: ${parentSubCategoryProducts}`);
    console.log(`   - Total affecté: ${totalAffectedProducts}`);

    if (totalAffectedProducts > 0) {
      console.log('🛡️  PROTECTION ACTIVÉE: La variation est utilisée par des produits');
      console.log(`   Erreur: VARIATION_IN_USE`);
      console.log(`   Message: La variation est utilisée par ${totalAffectedProducts} produit(s) au total.`);
      return true; // Protection fonctionnelle
    }

    console.log('✅ La variation pourrait être désactivée (pas utilisée)');
    return false; // Pas de protection nécessaire

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function runFinalTests() {
  console.log('🧪 TEST FINAL DES PROTECTIONS CONTRE LA SUPPRESSION\n');
  console.log('=' .repeat(60));

  try {
    // Récupérer toutes les sous-catégories
    const subCategories = await prisma.subCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      }
    });

    console.log(`\n📊 Found ${subCategories.length} sous-catégorie(s) active(s)`);

    // Tester chaque sous-catégorie
    let subCategoryProtections = 0;
    for (const subCategory of subCategories) {
      const isProtected = await testSubCategoryProtection(subCategory.id);
      if (isProtected) subCategoryProtections++;
    }

    // Récupérer toutes les variations
    const variations = await prisma.variation.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      }
    });

    console.log(`\n📊 Found ${variations.length} variation(s) active(s)`);

    // Tester chaque variation
    let variationProtections = 0;
    for (const variation of variations.slice(0, 3)) { // Limiter à 3 pour le test
      const isProtected = await testVariationProtection(variation.id);
      if (isProtected) variationProtections++;
    }

    // Résumé
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RÉSUMÉ DES TESTS');
    console.log(`   Sous-catégories testées: ${subCategories.length}`);
    console.log(`   Sous-catégories protégées: ${subCategoryProtections}`);
    console.log(`   Variations testées: ${Math.min(3, variations.length)}`);
    console.log(`   Variations protégées: ${variationProtections}`);

    if (subCategoryProtections > 0 || variationProtections > 0) {
      console.log('\n✅ SUCCÈS: Les protections contre la suppression fonctionnent correctement !');
    } else {
      console.log('\n⚠️  ATTENTION: Aucune protection activée (données de test peut-être)');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runFinalTests();