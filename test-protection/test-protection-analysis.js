/**
 * Test d'analyse de la protection de la hiérarchie
 * Ce test révèle que le schéma actuel NE PROTÈGE PAS les catégories/sous-catégories/variations
 * lorsqu'elles sont utilisées par des produits
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Analyse de la protection de la hiérarchie dans le schéma actuel\n');

  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // ÉTAPE 1: Créer une hiérarchie complète
    console.log('📂 Étape 1: Création de la hiérarchie...');

    const category = await prisma.category.create({
      data: {
        name: `Sport Test ${timestamp}`,
        slug: `sport-test-${timestamp}`,
        description: `Catégorie de test pour le sport - ${timestamp}`,
        displayOrder: 1,
        isActive: true
      }
    });

    const subCategory = await prisma.subCategory.create({
      data: {
        name: `Chaussures Test ${randomSuffix}`,
        slug: `chaussures-test-${randomSuffix}`,
        description: `Sous-catégorie de test pour les chaussures - ${randomSuffix}`,
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });

    const variation = await prisma.variation.create({
      data: {
        name: `Running Test ${randomSuffix}`,
        slug: `running-test-${randomSuffix}`,
        description: `Variation running pour test - ${randomSuffix}`,
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });

    console.log(`✅ Hiérarchie créée:`);
    console.log(`   - Catégorie: ${category.name} (ID: ${category.id})`);
    console.log(`   - Sous-catégorie: ${subCategory.name} (ID: ${subCategory.id})`);
    console.log(`   - Variation: ${variation.name} (ID: ${variation.id})`);

    // ÉTAPE 2: Créer un produit utilisant cette hiérarchie
    console.log('\n🛍️ Étape 2: Création d\'un produit utilisant cette hiérarchie...');

    const product = await prisma.product.create({
      data: {
        name: `Chaussures Running Test ${timestamp}`,
        description: `Chaussures running premium - ${timestamp}`,
        price: 129.99,
        suggestedPrice: 149.99,
        stock: 30,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        isReadyProduct: true,
        isValidated: true,
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        colorVariations: {
          create: {
            name: `Noir Test ${randomSuffix}`,
            colorCode: '#000000',
            images: {
              create: {
                view: 'FRONT',
                url: `https://example.com/chaussures-noir-${timestamp}.jpg`,
                publicId: `chaussures_noir_${timestamp}`,
                naturalWidth: 800,
                naturalHeight: 600
              }
            }
          }
        },
        sizes: {
          create: [
            { sizeName: '39' },
            { sizeName: '40' },
            { sizeName: '41' }
          ]
        }
      }
    });

    console.log(`✅ Produit créé: ${product.name} (ID: ${product.id})`);
    console.log(`   - categoryId: ${product.categoryId}`);
    console.log(`   - subCategoryId: ${product.subCategoryId}`);
    console.log(`   - variationId: ${product.variationId}`);

    // ÉTAPE 3: Vérifier les liens avant suppression
    console.log('\n🔗 Étape 3: Vérification des liens avant suppression...');

    const productBeforeDelete = await prisma.product.findUnique({
      where: { id: product.id },
      select: { categoryId: true, subCategoryId: true, variationId: true }
    });

    console.log(`État du produit avant suppression:`);
    console.log(`   - categoryId: ${productBeforeDelete.categoryId} (${productBeforeDelete.categoryId ? 'défini' : 'NULL'})`);
    console.log(`   - subCategoryId: ${productBeforeDelete.subCategoryId} (${productBeforeDelete.subCategoryId ? 'défini' : 'NULL'})`);
    console.log(`   - variationId: ${productBeforeDelete.variationId} (${productBeforeDelete.variationId ? 'défini' : 'NULL'})`);

    // ÉTAPE 4: Supprimer la VARIATION et observer l'impact
    console.log('\n🗑️ Étape 4: Suppression de la variation utilisée...');

    await prisma.variation.delete({
      where: { id: variation.id }
    });
    console.log(`✅ Variation ${variation.name} supprimée`);

    // Vérifier l'impact sur le produit
    const productAfterVariationDelete = await prisma.product.findUnique({
      where: { id: product.id },
      select: { categoryId: true, subCategoryId: true, variationId: true }
    });

    console.log(`État du produit après suppression de la variation:`);
    console.log(`   - categoryId: ${productAfterVariationDelete.categoryId} (${productAfterVariationDelete.categoryId ? 'défini' : 'NULL'})`);
    console.log(`   - subCategoryId: ${productAfterVariationDelete.subCategoryId} (${productAfterVariationDelete.subCategoryId ? 'défini' : 'NULL'})`);
    console.log(`   - variationId: ${productAfterVariationDelete.variationId} (${productAfterVariationDelete.variationId ? 'défini' : 'NULL'}) ⚠️`);

    // ÉTAPE 5: Supprimer la SOUS-CATÉGORIE et observer l'impact
    console.log('\n🗑️ Étape 5: Suppression de la sous-catégorie utilisée...');

    await prisma.subCategory.delete({
      where: { id: subCategory.id }
    });
    console.log(`✅ Sous-catégorie ${subCategory.name} supprimée`);

    // Vérifier l'impact sur le produit
    const productAfterSubCategoryDelete = await prisma.product.findUnique({
      where: { id: product.id },
      select: { categoryId: true, subCategoryId: true, variationId: true }
    });

    console.log(`État du produit après suppression de la sous-catégorie:`);
    console.log(`   - categoryId: ${productAfterSubCategoryDelete.categoryId} (${productAfterSubCategoryDelete.categoryId ? 'défini' : 'NULL'})`);
    console.log(`   - subCategoryId: ${productAfterSubCategoryDelete.subCategoryId} (${productAfterSubCategoryDelete.subCategoryId ? 'défini' : 'NULL'}) ⚠️`);
    console.log(`   - variationId: ${productAfterSubCategoryDelete.variationId} (${productAfterSubCategoryDelete.variationId ? 'défini' : 'NULL'})`);

    // ÉTAPE 6: Supprimer la CATÉGORIE et observer l'impact
    console.log('\n🗑️ Étape 6: Suppression de la catégorie utilisée...');

    await prisma.category.delete({
      where: { id: category.id }
    });
    console.log(`✅ Catégorie ${category.name} supprimée`);

    // Vérifier l'impact final sur le produit
    const productAfterCategoryDelete = await prisma.product.findUnique({
      where: { id: product.id },
      select: { categoryId: true, subCategoryId: true, variationId: true }
    });

    console.log(`État final du produit après suppression de la catégorie:`);
    console.log(`   - categoryId: ${productAfterCategoryDelete.categoryId} (${productAfterCategoryDelete.categoryId ? 'défini' : 'NULL'}) ⚠️`);
    console.log(`   - subCategoryId: ${productAfterCategoryDelete.subCategoryId} (${productAfterCategoryDelete.subCategoryId ? 'défini' : 'NULL'})`);
    console.log(`   - variationId: ${productAfterCategoryDelete.variationId} (${productAfterCategoryDelete.variationId ? 'défini' : 'NULL'})`);

    // ÉTAPE 7: Vérifier que le produit existe toujours mais est "orphelin"
    console.log('\n👻 Étape 7: Vérification du produit "orphelin"...');

    const orphanProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        subCategory: true,
        variation: true,
        colorVariations: true,
        sizes: true
      }
    });

    console.log(`Produit orphelin:`);
    console.log(`   - Nom: ${orphanProduct.name}`);
    console.log(`   - Catégorie: ${orphanProduct.category ? orphanProduct.category.name : 'NULL'} ⚠️`);
    console.log(`   - Sous-catégorie: ${orphanProduct.subCategory ? orphanProduct.subCategory.name : 'NULL'} ⚠️`);
    console.log(`   - Variation: ${orphanProduct.variation ? orphanProduct.variation.name : 'NULL'} ⚠️`);
    console.log(`   - Variations couleur: ${orphanProduct.colorVariations.length}`);
    console.log(`   - Tailles: ${orphanProduct.sizes.length}`);

    // Nettoyer le produit orphelin
    console.log('\n🧹 Étape 8: Nettoyage du produit orphelin...');

    await prisma.productStock.deleteMany({
      where: { productId: product.id }
    });

    await prisma.productSize.deleteMany({
      where: { productId: product.id }
    });

    const imageIds = orphanProduct.colorVariations.flatMap(cv => cv.images?.map(img => img.id) || []);
    if (imageIds.length > 0) {
      await prisma.delimitation.deleteMany({
        where: { productImageId: { in: imageIds } }
      });
    }

    await prisma.productImage.deleteMany({
      where: { colorVariationId: { in: orphanProduct.colorVariations.map(cv => cv.id) } }
    });

    await prisma.colorVariation.deleteMany({
      where: { productId: product.id }
    });

    await prisma.product.delete({
      where: { id: product.id }
    });
    console.log('✅ Produit orphelin supprimé');

    console.log('\n🚨 ANALYSE RÉVÉLÉE:');
    console.log('❌ PROBLÈME: Le schéma actuel NE PROTÈGE PAS la hiérarchie!');
    console.log('');
    console.log('📋 Comportement observé:');
    console.log('   1. Les catégories, sous-catégories et variations peuvent être supprimées');
    console.log('   2. Les produits liés deviennent "orphelins" (leurs clés étrangères deviennent NULL)');
    console.log('   3. Les produits continuent de fonctionner mais perdent leur hiérarchie');
    console.log('');
    console.log('🔍 Cause dans le schéma:');
    console.log('   - Product.category: @relation("ProductCategory", fields: [categoryId], references: [id])');
    console.log('   - Product.subCategory: @relation("ProductSubCategory", fields: [subCategoryId], references: [id])');
    console.log('   - Product.variation: @relation("ProductVariation", fields: [variationId], references: [id])');
    console.log('');
    console.log('   ❌ Pas de "onDelete: Restrict" ou "onDelete: Cascade" défini');
    console.log('   ✅ Prisma utilise par défaut "onDelete: SetNull"');
    console.log('');
    console.log('💡 SOLUTIONS POSSIBLES:');
    console.log('   1. Ajouter "onDelete: Restrict" pour empêcher la suppression');
    console.log('   2. Ajouter "onDelete: Cascade" pour supprimer en cascade');
    console.log('   3. Ajouter une validation au niveau applicatif');
    console.log('');
    console.log('⚠️ RISQUES ACTUELS:');
    console.log('   - Perte de données structurelles');
    console.log('   - Produits orphelins dans la base');
    console.log('   - Incohérence des données');
    console.log('   - Impact sur les filtres et recherches');

  } catch (error) {
    console.error('\n❌ Erreur durant l\'analyse:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Connexion à la base de données fermée');
  }
}

main();