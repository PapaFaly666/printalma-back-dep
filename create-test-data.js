const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  console.log('🛠️ Création de données de test pour valider les protections...\n');

  try {
    // 1. Récupérer ou créer une catégorie
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Vêtements',
          slug: 'vetements',
          description: 'Catégorie de vêtements pour test',
        }
      });
      console.log('✅ Catégorie créée:', category.name);
    } else {
      console.log('✅ Catégorie existante:', category.name);
    }

    // 2. Créer une sous-catégorie avec variations
    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'Sous-catégorie de T-shirts',
        categoryId: category.id,
        displayOrder: 1,
      }
    });
    console.log('✅ Sous-catégorie créée:', subCategory.name);

    // 3. Créer des variations pour cette sous-catégorie
    const variation1 = await prisma.variation.create({
      data: {
        name: 'Col V',
        slug: 'col-v',
        description: 'T-shirt avec col en V',
        subCategoryId: subCategory.id,
        displayOrder: 1,
      }
    });
    console.log('✅ Variation créée:', variation1.name);

    const variation2 = await prisma.variation.create({
      data: {
        name: 'Col Rond',
        slug: 'col-rond',
        description: 'T-shirt avec col rond',
        subCategoryId: subCategory.id,
        displayOrder: 2,
      }
    });
    console.log('✅ Variation créée:', variation2.name);

    // 4. Créer une autre sous-catégorie sans variations
    const emptySubCategory = await prisma.subCategory.create({
      data: {
        name: 'Accessoires',
        slug: 'accessoires',
        description: 'Sous-catégorie vide pour test',
        categoryId: category.id,
        displayOrder: 2,
      }
    });
    console.log('✅ Sous-catégorie vide créée:', emptySubCategory.name);

    // 5. Créer un produit qui utilise une variation
    const product = await prisma.product.create({
      data: {
        name: 'T-Shirt Col V Test',
        description: 'Produit de test pour valider les protections',
        price: 25.99,
        stock: 100,
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation1.id,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        isDelete: false,
        isValidated: true,
      }
    });
    console.log('✅ Produit créé:', product.name);

    // 6. Créer un produit qui utilise seulement la sous-catégorie
    const product2 = await prisma.product.create({
      data: {
        name: 'T-Shirt Standard Test',
        description: 'Produit de test lié seulement à la sous-catégorie',
        price: 19.99,
        stock: 50,
        categoryId: category.id,
        subCategoryId: subCategory.id,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        isDelete: false,
        isValidated: true,
      }
    });
    console.log('✅ Produit créé (sans variation):', product2.name);

    // 7. Créer une variation sans produit
    const variation3 = await prisma.variation.create({
      data: {
        name: 'Manches Longues',
        slug: 'manches-longues',
        description: 'Variation sans produit pour test',
        subCategoryId: subCategory.id,
        displayOrder: 3,
      }
    });
    console.log('✅ Variation sans produit créée:', variation3.name);

    console.log('\n🎯 Données de test créées avec succès !');
    console.log('\n📋 Résumé:');
    console.log(`- 1 Catégorie: ${category.name}`);
    console.log(`- 2 Sous-catégories: ${subCategory.name} (avec produits), ${emptySubCategory.name} (vide)`);
    console.log(`- 3 Variations: ${variation1.name} (avec produit), ${variation2.name} (sans produit), ${variation3.name} (sans produit)`);
    console.log(`- 2 Produits: ${product.name} (avec variation), ${product2.name} (sans variation)`);

    return {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      emptySubCategoryId: emptySubCategory.id,
      variationIds: [variation1.id, variation2.id, variation3.id],
      productIds: [product.id, product2.id]
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    throw error;
  }
}

module.exports = { createTestData };

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  createTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}