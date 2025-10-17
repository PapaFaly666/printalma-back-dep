// Test complet qui simule le comportement des services avec les corrections
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompletSimulationServices() {
  console.log('🧪 Test Complet: Simulation des Services Corrigés\n');

  try {
    // ===============================================
    // ÉTAPE 1: Simuler SubCategoryService.findAll()
    // ===============================================
    console.log('📋 ÉTAPE 1: Simulation SubCategoryService.findAll()');

    const subCategoriesService = await prisma.subCategory.findMany({
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

    console.log(`✅ ${subCategoriesService.length} sous-catégorie(s) trouvée(s):`);
    subCategoriesService.forEach((subCat, index) => {
      console.log(`   ${index + 1}. ${subCat.name}`);
      console.log(`      - Catégorie: ${subCat.category.name}`);
      console.log(`      - Variations (actives): ${subCat._count.variations}`);
      console.log(`      - Produits (non supprimés): ${subCat._count.products}`);
    });

    // ===============================================
    // ÉTAPE 2: Simuler VariationService.findAll()
    // ===============================================
    console.log('\n📋 ÉTAPE 2: Simulation VariationService.findAll()');

    const variationsService = await prisma.variation.findMany({
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

    console.log(`✅ ${variationsService.length} variation(s) trouvée(s):`);
    variationsService.forEach((variation, index) => {
      console.log(`   ${index + 1}. ${variation.name}`);
      console.log(`      - Sous-catégorie: ${variation.subCategory.name}`);
      console.log(`      - Produits (non supprimés): ${variation._count.products}`);
    });

    // ===============================================
    // ÉTAPE 3: Test avec une sous-catégorie spécifique
    // ===============================================
    console.log('\n🎯 ÉTAPE 3: Test spécifique avec T-Shirts');

    const subCategoryTShirts = await prisma.subCategory.findFirst({
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

    if (subCategoryTShirts) {
      console.log(`✅ Sous-catégorie trouvée: ${subCategoryTShirts.name}`);
      console.log(`   - Catégorie: ${subCategoryTShirts.category.name}`);
      console.log(`   - Variations: ${subCategoryTShirts._count.variations}`);
      console.log(`   - Produits directs: ${subCategoryTShirts._count.products}`);

      // Récupérer les variations de cette sous-catégorie
      const variationsOfTShirts = await prisma.variation.findMany({
        where: {
          subCategoryId: subCategoryTShirts.id,
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

      console.log(`   Variations de T-Shirts:`);
      variationsOfTShirts.forEach((variation) => {
        console.log(`     - ${variation.name}: ${variation._count.products} produit(s)`);
      });

      // ===============================================
      // ÉTAPE 4: Créer un produit de test
      // ===============================================
      console.log('\n🏗️ ÉTAPE 4: Création d\'un produit de test');

      const firstVariation = variationsOfTShirts[0];
      if (firstVariation) {
        console.log(`Création d'un produit dans la variation: ${firstVariation.name}`);

        // État AVANT création
        const avantCreation = {
          subCategoryProducts: subCategoryTShirts._count.products,
          variationProducts: firstVariation._count.products
        };
        console.log(`État AVANT création:`);
        console.log(`   - Produits sous-catégorie: ${avantCreation.subCategoryProducts}`);
        console.log(`   - Produits variation: ${avantCreation.variationProducts}`);

        // Créer le produit
        const newProduct = await prisma.product.create({
          data: {
            name: `Test Service ${Date.now()}`,
            description: 'Produit de test pour vérifier les services',
            price: 99.99,
            stock: 10,
            status: 'PUBLISHED',
            categoryId: subCategoryTShirts.categoryId,
            subCategoryId: subCategoryTShirts.id,
            variationId: firstVariation.id,
            genre: 'UNISEXE',
            isReadyProduct: false,
            colorVariations: {
              create: [{
                name: 'Test Noir',
                colorCode: '#000000'
              }]
            }
          }
        });

        console.log(`✅ Produit créé: ID ${newProduct.id}`);

        // ===============================================
        // ÉTAPE 5: Vérifier les compteurs APRÈS création
        // ===============================================
        console.log('\n📊 ÉTAPE 5: Vérification des compteurs APRÈS création');

        // Re-vérifier avec la même logique que les services
        const subCategoryApres = await prisma.subCategory.findUnique({
          where: { id: subCategoryTShirts.id },
          include: {
            _count: {
              select: {
                variations: { where: { isActive: true } },
                products: { where: { isDelete: false } }
              }
            }
          }
        });

        const variationApres = await prisma.variation.findUnique({
          where: { id: firstVariation.id },
          include: {
            _count: {
              select: {
                products: { where: { isDelete: false } }
              }
            }
          }
        });

        const apresCreation = {
          subCategoryProducts: subCategoryApres._count.products,
          variationProducts: variationApres._count.products
        };

        console.log(`État APRÈS création:`);
        console.log(`   - Produits sous-catégorie: ${apresCreation.subCategoryProducts} (${apresCreation.subCategoryProducts - avantCreation.subCategoryProducts > 0 ? '+1 ✅' : 'inchangé ❌'})`);
        console.log(`   - Produits variation: ${apresCreation.variationProducts} (${apresCreation.variationProducts - avantCreation.variationProducts > 0 ? '+1 ✅' : 'inchangé ❌'})`);

        // ===============================================
        // ÉTAPE 6: Test des services APRÈS création
        // ===============================================
        console.log('\n🔄 ÉTAPE 6: Test des services après création');

        const subCategoriesApresService = await prisma.subCategory.findMany({
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

        const tShirtsApresService = subCategoriesApresService.find(sc => sc.id === subCategoryTShirts.id);

        if (tShirtsApresService) {
          console.log(`✅ Sous-catégorie T-Shirts dans le service:`);
          console.log(`   - Variations: ${tShirtsApresService._count.variations}`);
          console.log(`   - Produits: ${tShirtsApresService._count.products}`);

          if (tShirtsApresService._count.products > avantCreation.subCategoryProducts) {
            console.log(`   ✅ Le compteur a bien été mis à jour dans le service!`);
          } else {
            console.log(`   ❌ Le compteur n'a pas changé dans le service...`);
          }
        }

        const variationsApresService = await prisma.variation.findMany({
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

        const variationApresService = variationsApresService.find(v => v.id === firstVariation.id);

        if (variationApresService) {
          console.log(`✅ Variation "${variationApresService.name}" dans le service:`);
          console.log(`   - Produits: ${variationApresService._count.products}`);

          if (variationApresService._count.products > avantCreation.variationProducts) {
            console.log(`   ✅ Le compteur a bien été mis à jour dans le service!`);
          } else {
            console.log(`   ❌ Le compteur n'a pas changé dans le service...`);
          }
        }

        // Nettoyage
        console.log('\n🧹 Nettoyage: suppression du produit de test...');
        await prisma.product.delete({
          where: { id: newProduct.id }
        });
        console.log('✅ Produit de test supprimé');

      } else {
        console.log('❌ Aucune variation trouvée pour T-Shirts');
      }
    } else {
      console.log('❌ Sous-catégorie T-Shirts non trouvée');
    }

    console.log('\n🎉 Test terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCompletSimulationServices();