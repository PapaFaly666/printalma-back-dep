const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testManuelContraintes() {
  console.log('🧪 TEST MANUEL DES CONTRAINTES DE SUPPRESSION\n');

  try {
    // ÉTAPE 1: Créer la hiérarchie complète
    console.log('📁 ÉTAPE 1: Création de la hiérarchie');

    const category = await prisma.category.create({
      data: {
        name: 'Catégorie Manuel Test',
        slug: 'categorie-manuel-test',
        description: 'Catégorie pour test manuel des contraintes',
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: ${category.name} (ID: ${category.id})`);

    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Sous-catégorie Manuel Test',
        slug: 'sous-categorie-manuel-test',
        description: 'Sous-catégorie pour test manuel',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: ${subCategory.name} (ID: ${subCategory.id})`);

    const variation = await prisma.variation.create({
      data: {
        name: 'Variation Manuel Test',
        slug: 'variation-manuel-test',
        description: 'Variation pour test manuel',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation créée: ${variation.name} (ID: ${variation.id})`);

    // ÉTAPE 2: Créer un produit lié à cette hiérarchie
    console.log('\n📦 ÉTAPE 2: Création d\'un produit avec toutes les relations');

    const product = await prisma.product.create({
      data: {
        name: 'Produit Manuel Test Contraintes',
        description: 'Produit pour tester manuellement les contraintes de suppression',
        price: 19.99,
        stock: 25,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id
      }
    });
    console.log(`✅ Produit créé: ${product.name} (ID: ${product.id})`);
    console.log(`   Relations: Catégorie(${product.categoryId}) → Sous-catégorie(${product.subCategoryId}) → Variation(${product.variationId})`);

    // Vérification visuelle des données
    console.log('\n🔍 Vérification des données créées:');
    const productCheck = await prisma.product.findUnique({
      where: { id: product.id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        subCategoryId: true,
        variationId: true,
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        variation: { select: { name: true } }
      }
    });
    console.log(`Produit: ${productCheck.name}`);
    console.log(`- Catégorie: ${productCheck.category?.name || 'NULL'} (ID: ${productCheck.categoryId})`);
    console.log(`- Sous-catégorie: ${productCheck.subCategory?.name || 'NULL'} (ID: ${productCheck.subCategoryId})`);
    console.log(`- Variation: ${productCheck.variation?.name || 'NULL'} (ID: ${productCheck.variationId})`);

    // ÉTAPE 3: Tests de suppression avec vérification manuelle
    console.log('\n🗑️  ÉTAPE 3: Tests de suppression');

    // Test 1: Tenter de supprimer la variation
    console.log('\n➡️  TEST 1: Suppression de la VARIATION');
    console.log(`Tentative de suppression de la variation ID: ${variation.id}`);
    console.log(`Cette variation est utilisée par le produit ID: ${product.id}`);

    try {
      await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log('❌ ERREUR CRITIQUE: La variation a été supprimée malgré les produits liés !');

      // Vérifier l'état du produit après suppression
      const productAfterVariationDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          categoryId: true,
          subCategoryId: true,
          variationId: true,
          variation: { select: { name: true } }
        }
      });
      console.log(`État du produit après suppression de la variation:`);
      console.log(`- variationId: ${productAfterVariationDeletion.variationId}`);
      console.log(`- variation.name: ${productAfterVariationDeletion.variation?.name || 'NULL/UNDEFINED'}`);

    } catch (error) {
      console.log(`✅ BON: La variation est protégée !`);
      console.log(`   Code d'erreur: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    }

    // Test 2: Tenter de supprimer la sous-catégorie
    console.log('\n➡️  TEST 2: Suppression de la SOUS-CATÉGORIE');
    console.log(`Tentative de suppression de la sous-catégorie ID: ${subCategory.id}`);
    console.log(`Cette sous-catégorie est utilisée par le produit ID: ${product.id}`);

    try {
      await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log('❌ ERREUR CRITIQUE: La sous-catégorie a été supprimée malgré les produits liés !');

      // Vérifier l'état du produit après suppression
      const productAfterSubCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          categoryId: true,
          subCategoryId: true,
          variationId: true,
          subCategory: { select: { name: true } }
        }
      });
      console.log(`État du produit après suppression de la sous-catégorie:`);
      console.log(`- subCategoryId: ${productAfterSubCategoryDeletion.subCategoryId}`);
      console.log(`- subCategory.name: ${productAfterSubCategoryDeletion.subCategory?.name || 'NULL/UNDEFINED'}`);

    } catch (error) {
      console.log(`✅ BON: La sous-catégorie est protégée !`);
      console.log(`   Code d'erreur: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    }

    // Test 3: Tenter de supprimer la catégorie
    console.log('\n➡️  TEST 3: Suppression de la CATÉGORIE');
    console.log(`Tentative de suppression de la catégorie ID: ${category.id}`);
    console.log(`Cette catégorie est utilisée par le produit ID: ${product.id}`);

    try {
      await prisma.category.delete({
        where: { id: category.id }
      });
      console.log('❌ ERREUR CRITIQUE: La catégorie a été supprimée malgré les produits liés !');

      // Vérifier l'état du produit après suppression
      const productAfterCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          categoryId: true,
          subCategoryId: true,
          variationId: true,
          category: { select: { name: true } }
        }
      });
      console.log(`État du produit après suppression de la catégorie:`);
      console.log(`- categoryId: ${productAfterCategoryDeletion.categoryId}`);
      console.log(`- category.name: ${productAfterCategoryDeletion.category?.name || 'NULL/UNDEFINED'}`);

    } catch (error) {
      console.log(`✅ BON: La catégorie est protégée !`);
      console.log(`   Code d'erreur: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    }

    // ÉTAPE 4: Vérification finale et nettoyage
    console.log('\n🧹 ÉTAPE 4: Nettoyage contrôlé');
    console.log('Suppression du produit en premier...');

    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('✅ Produit supprimé');

    // Maintenant tenter de supprimer les entités restantes
    console.log('\nTentatives de suppression après suppression du produit:');

    try {
      await prisma.variation.delete({ where: { id: variation.id } });
      console.log('✅ Variation supprimée après suppression du produit');
    } catch (error) {
      console.log(`❌ Impossible de supprimer la variation: ${error.message}`);
    }

    try {
      await prisma.subCategory.delete({ where: { id: subCategory.id } });
      console.log('✅ Sous-catégorie supprimée');
    } catch (error) {
      console.log(`❌ Impossible de supprimer la sous-catégorie: ${error.message}`);
    }

    try {
      await prisma.category.delete({ where: { id: category.id } });
      console.log('✅ Catégorie supprimée');
    } catch (error) {
      console.log(`❌ Impossible de supprimer la catégorie: ${error.message}`);
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DU TEST MANUEL');
    console.log('================================');
    console.log('Ce test démontre le comportement réel des contraintes de suppression.');
    console.log('Si les suppressions des étapes 3 ont réussi: ❌ PROBLÈME DE SÉCURITÉ');
    console.log('Si les suppressions des étapes 3 ont échoué: ✅ CONTRAINTES FONCTIONNELLES');

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test
testManuelContraintes().catch(console.error);