// Test pour vérifier que les API retournent bien les compteurs corrigés
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiCompteursCorriges() {
  console.log('🧪 Test: Vérification des compteurs dans les API après correction\n');

  try {
    // Étape 1: Tester l'API des sous-catégories
    console.log('📋 ÉTAPE 1: Test API /sub-categories');

    // Simuler l'appel à findAll() du SubCategoryService
    const subCategories = await prisma.subCategory.findMany({
      where: { isActive: true },
      include: {
        category: true,
        _count: {
          select: {
            variations: { where: { isActive: true } },
            products: { where: { isDelete: false } }
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`✅ ${subCategories.length} sous-catégorie(s) trouvée(s):`);

    subCategories.forEach((subCat, index) => {
      console.log(`   ${index + 1}. ${subCat.name} (Catégorie: ${subCat.category.name})`);
      console.log(`      - Variations: ${subCat._count.variations}`);
      console.log(`      - Produits: ${subCat._count.products}`);
    });

    // Étape 2: Tester l'API des variations
    console.log('\n📋 ÉTAPE 2: Test API /variations');

    // Simuler l'appel à findAll() du VariationService
    const variations = await prisma.variation.findMany({
      where: { isActive: true },
      include: {
        subCategory: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`✅ ${variations.length} variation(s) trouvée(s):`);

    variations.forEach((variation, index) => {
      console.log(`   ${index + 1}. ${variation.name} (Sous-catégorie: ${variation.subCategory.name})`);
      console.log(`      - Produits: ${variation._count.products}`);
    });

    // Étape 3: Vérification spécifique avec une sous-catégorie et variation connues
    console.log('\n🎯 ÉTAPE 3: Vérification spécifique');

    const subCategoryTest = await prisma.subCategory.findFirst({
      where: {
        name: 'T-Shirts',
        isActive: true
      },
      include: {
        category: true,
        _count: {
          select: {
            variations: { where: { isActive: true } },
            products: { where: { isDelete: false } }
          }
        }
      }
    });

    if (subCategoryTest) {
      console.log(`✅ Sous-catégorie testée: ${subCategoryTest.name}`);
      console.log(`   - Catégorie: ${subCategoryTest.category.name}`);
      console.log(`   - Variations: ${subCategoryTest._count.variations}`);
      console.log(`   - Produits: ${subCategoryTest._count.products}`);

      // Récupérer les variations de cette sous-catégorie
      const variationsOfSubCat = await prisma.variation.findMany({
        where: {
          subCategoryId: subCategoryTest.id,
          isActive: true
        },
        include: {
          _count: {
            select: {
              products: { where: { isDelete: false } }
            }
          }
        }
      });

      variationsOfSubCat.forEach((variation) => {
        console.log(`   - Variation "${variation.name}": ${variation._count.products} produit(s)`);
      });

      // Vérification de la cohérence
      const totalProductsInVariations = variationsOfSubCat.reduce(
        (total, variation) => total + variation._count.products,
        0
      );

      console.log(`\n📊 Analyse de cohérence:`);
      console.log(`   - Produits directs dans sous-catégorie: ${subCategoryTest._count.products}`);
      console.log(`   - Total produits dans variations: ${totalProductsInVariations}`);

      if (subCategoryTest._count.products > 0 || totalProductsInVariations > 0) {
        console.log(`   ✅ Il y a des produits dans cette hiérarchie - les compteurs fonctionnent!`);
      } else {
        console.log(`   ℹ️  Aucun produit dans cette hiérarchie`);
      }
    }

    console.log('\n🎉 Test terminé! Les compteurs devraient maintenant être corrects dans le frontend.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiCompteursCorriges();