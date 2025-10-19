const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReelContraintes() {
  console.log('🎯 TEST RÉEL : CRÉATION DE PRODUIT + TEST SUPPRESSION HIÉRARCHIE\n');

  try {
    // ÉTAPE 1: Créer une hiérarchie complète comme dans l'application réelle
    console.log('📁 ÉTAPE 1: Création de la hiérarchie de catégories');

    const category = await prisma.category.create({
      data: {
        name: 'Vêtements Test Contrainte',
        slug: 'vetements-test-contrainte',
        description: 'Catégorie principale pour les vêtements - test contraintes',
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: "${category.name}" (ID: ${category.id})`);

    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'T-shirts Test Contrainte',
        slug: 't-shirts-test-contrainte',
        description: 'Sous-catégorie pour les t-shirts - test contraintes',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: "${subCategory.name}" (ID: ${subCategory.id})`);

    const variation = await prisma.variation.create({
      data: {
        name: 'Col Rond Test Contrainte',
        slug: 'col-rond-test-contrainte',
        description: 'T-shirts avec col rond - test contraintes',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation créée: "${variation.name}" (ID: ${variation.id})`);

    console.log('\n📊 Hiérarchie complète créée:');
    console.log(`   ${category.name} → ${subCategory.name} → ${variation.name}`);

    // ÉTAPE 2: Créer un produit réel avec toutes les caractéristiques
    console.log('\n📦 ÉTAPE 2: Création d\'un produit complet');

    const product = await prisma.product.create({
      data: {
        name: 'T-shirt Col Rond Blanc Coton Bio',
        description: 'T-shirt confortable en coton biologique avec col rond. Idéal pour le quotidien.',
        price: 24.99,
        stock: 150,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        colorVariations: {
          create: [
            {
              name: 'Blanc',
              colorCode: '#FFFFFF'
            },
            {
              name: 'Noir',
              colorCode: '#000000'
            }
          ]
        },
        sizes: {
          create: [
            { sizeName: 'S' },
            { sizeName: 'M' },
            { sizeName: 'L' },
            { sizeName: 'XL' }
          ]
        }
      },
      include: {
        category: true,
        subCategory: true,
        variation: true,
        colorVariations: true,
        sizes: true
      }
    });

    console.log(`✅ Produit créé: "${product.name}" (ID: ${product.id})`);
    console.log(`   💰 Prix: ${product.price}€`);
    console.log(`   📦 Stock: ${product.stock} unités`);
    console.log(`   🏷️  Catégorie: ${product.category?.name}`);
    console.log(`   📂 Sous-catégorie: ${product.subCategory?.name}`);
    console.log(`   🎨 Variation: ${product.variation?.name}`);
    console.log(`   🌈 Couleurs: ${product.colorVariations.map(c => c.name).join(', ')}`);
    console.log(`   📏 Tailles: ${product.sizes.map(s => s.sizeName).join(', ')}`);

    // ÉTAPE 3: Vérifier que le produit est correctement lié
    console.log('\n🔍 ÉTAPE 3: Vérification des liaisons du produit');

    const productVerification = await prisma.product.findUnique({
      where: { id: product.id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        subCategoryId: true,
        variationId: true,
        _count: {
          select: {
            colorVariations: true,
            sizes: true
          }
        }
      }
    });

    console.log(`Produit "${productVerification.name}":`);
    console.log(`   🔗 categoryId: ${productVerification.categoryId} (${productVerification.categoryId ? 'LIÉ' : 'NON LIÉ'})`);
    console.log(`   🔗 subCategoryId: ${productVerification.subCategoryId} (${productVerification.subCategoryId ? 'LIÉ' : 'NON LIÉ'})`);
    console.log(`   🔗 variationId: ${productVerification.variationId} (${productVerification.variationId ? 'LIÉ' : 'NON LIÉ'})`);
    console.log(`   🌈 Variations couleur: ${productVerification._count.colorVariations}`);
    console.log(`   📏 Tailles: ${productVerification._count.sizes}`);

    // ÉTAPE 4: TESTS DE SUPPRESSION - CAS D'USAGE RÉEL
    console.log('\n🗑️  ÉTAPE 4: TESTS DE SUPPRESSION (CAS D\'USAGE RÉEL)');
    console.log('================================================================');

    // Test 1: Essayer de supprimer la VARIATION utilisée par le produit
    console.log('\n➡️  TEST 1: Suppression de la VARIATION "Col Rond"');
    console.log(`   Variance ID: ${variation.id}`);
    console.log(`   Utilisée par le produit ID: ${product.id} (${product.name})`);
    console.log(`   🔍 RÈGLE MÉTIER: Une variation utilisée par un produit NE DEVRAIT PAS pouvoir être supprimée`);

    try {
      const deletedVariation = await prisma.variation.delete({
        where: { id: variation.id }
      });
      console.log(`   ❌ 🚨 PROBLÈME GRAVE: Variation "${deletedVariation.name}" supprimée !`);
      console.log(`   ❌ Le produit va perdre sa classification de variation !`);

      // Vérifier l'impact sur le produit
      const productAfterVariationDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          variationId: true,
          variation: { select: { name: true } }
        }
      });
      console.log(`   📊 État du produit après suppression:`);
      console.log(`      - variationId: ${productAfterVariationDeletion.variationId} (devrait rester ${variation.id})`);
      console.log(`      - variation.name: ${productAfterVariationDeletion.variation?.name || 'NULL/PERDU'} (devrait être "Col Rond")`);

    } catch (error) {
      console.log(`   ✅ BON: La variation est protégée !`);
      console.log(`   ✅ Erreur: ${error.code} - ${error.message}`);
      console.log(`   ✅ Le produit conserve sa classification de variation`);
    }

    // Test 2: Essayer de supprimer la SOUS-CATÉGORIE utilisée par le produit
    console.log('\n➡️  TEST 2: Suppression de la SOUS-CATÉGORIE "T-shirts"');
    console.log(`   Sous-catégorie ID: ${subCategory.id}`);
    console.log(`   Utilisée par le produit ID: ${product.id} (${product.name})`);
    console.log(`   🔍 RÈGLE MÉTIER: Une sous-catégorie utilisée par un produit NE DEVRAIT PAS pouvoir être supprimée`);

    try {
      const deletedSubCategory = await prisma.subCategory.delete({
        where: { id: subCategory.id }
      });
      console.log(`   ❌ 🚨 PROBLÈME GRAVE: Sous-catégorie "${deletedSubCategory.name}" supprimée !`);
      console.log(`   ❌ Le produit va perdre sa classification de sous-catégorie !`);

      // Vérifier l'impact sur le produit
      const productAfterSubCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          subCategoryId: true,
          subCategory: { select: { name: true } }
        }
      });
      console.log(`   📊 État du produit après suppression:`);
      console.log(`      - subCategoryId: ${productAfterSubCategoryDeletion.subCategoryId} (devrait rester ${subCategory.id})`);
      console.log(`      - subCategory.name: ${productAfterSubCategoryDeletion.subCategory?.name || 'NULL/PERDU'} (devrait être "T-shirts")`);

    } catch (error) {
      console.log(`   ✅ BON: La sous-catégorie est protégée !`);
      console.log(`   ✅ Erreur: ${error.code} - ${error.message}`);
      console.log(`   ✅ Le produit conserve sa classification de sous-catégorie`);
    }

    // Test 3: Essayer de supprimer la CATÉGORIE utilisée par le produit
    console.log('\n➡️  TEST 3: Suppression de la CATÉGORIE "Vêtements"');
    console.log(`   Catégorie ID: ${category.id}`);
    console.log(`   Utilisée par le produit ID: ${product.id} (${product.name})`);
    console.log(`   🔍 RÈGLE MÉTIER: Une catégorie utilisée par un produit NE DEVRAIT PAS pouvoir être supprimée`);

    try {
      const deletedCategory = await prisma.category.delete({
        where: { id: category.id }
      });
      console.log(`   ❌ 🚨 PROBLÈME GRAVE: Catégorie "${deletedCategory.name}" supprimée !`);
      console.log(`   ❌ Le produit va perdre sa classification de catégorie !`);

      // Vérifier l'impact sur le produit
      const productAfterCategoryDeletion = await prisma.product.findUnique({
        where: { id: product.id },
        select: {
          id: true,
          name: true,
          categoryId: true,
          category: { select: { name: true } }
        }
      });
      console.log(`   📊 État du produit après suppression:`);
      console.log(`      - categoryId: ${productAfterCategoryDeletion.categoryId} (devrait rester ${category.id})`);
      console.log(`      - category.name: ${productAfterCategoryDeletion.category?.name || 'NULL/PERDU'} (devrait être "Vêtements")`);

    } catch (error) {
      console.log(`   ✅ BON: La catégorie est protégée !`);
      console.log(`   ✅ Erreur: ${error.code} - ${error.message}`);
      console.log(`   ✅ Le produit conserve sa classification de catégorie`);
    }

    // ÉTAPE 5: Nettoyage manuel (simulation du processus correct)
    console.log('\n🧹 ÉTAPE 5: NETTOYAGE MANUEL (PROCESSUS CORRECT)');
    console.log('Processus correct: Supprimer le produit DABORD, puis la hiérarchie');

    try {
      await prisma.product.delete({
        where: { id: product.id }
      });
      console.log('✅ Produit supprimé en premier (processus correct)');

      // Maintenant les entités de la hiérarchie peuvent être supprimées
      try {
        await prisma.variation.delete({ where: { id: variation.id } });
        console.log('✅ Variation supprimée après suppression du produit');
      } catch (error) {
        console.log(`ℹ️  Variation déjà supprimée ou erreur: ${error.message}`);
      }

      try {
        await prisma.subCategory.delete({ where: { id: subCategory.id } });
        console.log('✅ Sous-catégorie supprimée');
      } catch (error) {
        console.log(`ℹ️  Sous-catégorie déjà supprimée ou erreur: ${error.message}`);
      }

      try {
        await prisma.category.delete({ where: { id: category.id } });
        console.log('✅ Catégorie supprimée');
      } catch (error) {
        console.log(`ℹ️  Catégorie déjà supprimée ou erreur: ${error.message}`);
      }

    } catch (error) {
      console.log(`❌ Erreur lors du nettoyage: ${error.message}`);
    }

    // CONCLUSION
    console.log('\n🎯 CONCLUSION DU TEST');
    console.log('===================');
    console.log('');
    console.log('📋 RÈGLES MÉTIER ATTENDUES:');
    console.log('   • Une variation utilisée par un produit ne doit PAS pouvoir être supprimée');
    console.log('   • Une sous-catégorie utilisée par un produit ne doit PAS pouvoir être supprimée');
    console.log('   • Une catégorie utilisée par un produit ne doit PAS pouvoir être supprimée');
    console.log('');
    console.log('🚨 SI LES TESTS 1-3 ONT RÉUSSI: PROBLÈME CRITIQUE DE SÉCURITÉ');
    console.log('✅ SI LES TESTS 1-3 ONT ÉCHOUÉ: CONTRAINTES FONCTIONNELLES');
    console.log('');
    console.log('💡 SOLUTION: Ajouter "onDelete: Restrict" dans les relations Product');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testReelContraintes().catch(console.error);