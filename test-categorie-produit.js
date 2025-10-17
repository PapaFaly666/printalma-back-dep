// Script de test pour créer une catégorie, l'affecter à un produit et tester la suppression
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCategoryWithProduct() {
  console.log('🛠️ Création d\'une catégorie avec produit pour tester les protections...\n');

  try {
    // 1. Créer une nouvelle catégorie
    console.log('1️⃣ Création d\'une nouvelle catégorie...');
    const category = await prisma.category.create({
      data: {
        name: 'Vêtements Test',
        slug: 'vetements-test',
        description: 'Catégorie de test pour validation des protections',
        displayOrder: 999,
        isActive: true
      }
    });
    console.log(`✅ Catégorie créée: "${category.name}" (ID: ${category.id})`);

    // 2. Créer une sous-catégorie pour cette catégorie
    console.log('\n2️⃣ Création d\'une sous-catégorie...');
    const subCategory = await prisma.subCategory.create({
      data: {
        name: 'Sous-catégorie Test',
        slug: 'sous-categorie-test',
        description: 'Sous-catégorie de test',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Sous-catégorie créée: "${subCategory.name}" (ID: ${subCategory.id})`);

    // 3. Créer une variation pour cette sous-catégorie
    console.log('\n3️⃣ Création d\'une variation...');
    const variation = await prisma.variation.create({
      data: {
        name: 'Variation Test',
        slug: 'variation-test',
        description: 'Variation de test',
        subCategoryId: subCategory.id,
        displayOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Variation créée: "${variation.name}" (ID: ${variation.id})`);

    // 4. Créer un produit utilisant toute la hiérarchie
    console.log('\n4️⃣ Création d\'un produit utilisant la hiérarchie complète...');
    const product = await prisma.product.create({
      data: {
        name: 'Produit Hiérarchique Test',
        description: 'Produit de test utilisant catégorie, sous-catégorie et variation',
        price: 49.99,
        stock: 100,
        categoryId: category.id,
        subCategoryId: subCategory.id,
        variationId: variation.id,
        status: 'PUBLISHED',
        genre: 'UNISEXE',
        isDelete: false,
        isValidated: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Produit créé: "${product.name}" (ID: ${product.id})`);
    console.log(`   - Prix: ${product.price}€`);
    console.log(`   - Stock: ${product.stock}`);
    console.log(`   - Catégorie: ${category.name}`);
    console.log(`   - Sous-catégorie: ${subCategory.name}`);
    console.log(`   - Variation: ${variation.name}`);

    // 5. Créer un produit qui utilise seulement la catégorie
    console.log('\n5️⃣ Création d\'un produit utilisant seulement la catégorie...');
    const productCategoryOnly = await prisma.product.create({
      data: {
        name: 'Produit Catégorie Seulement',
        description: 'Produit de test utilisant seulement la catégorie principale',
        price: 29.99,
        stock: 50,
        categoryId: category.id,
        subCategoryId: null,
        variationId: null,
        status: 'PUBLISHED',
        genre: 'HOMME',
        isDelete: false,
        isValidated: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Produit créé: "${productCategoryOnly.name}" (ID: ${productCategoryOnly.id})`);
    console.log(`   - Catégorie: ${category.name} (sans sous-catégorie ni variation)`);

    // 6. Afficher l'état final
    console.log('\n📊 ÉTAT FINAL DES RESSOURCES:');
    console.log(`   Catégorie: "${category.name}" (ID: ${category.id})`);

    const categoryProducts = await prisma.product.count({
      where: {
        categoryId: category.id,
        isDelete: false
      }
    });
    console.log(`   Produits dans cette catégorie: ${categoryProducts}`);

    const subCategories = await prisma.subCategory.count({
      where: {
        categoryId: category.id,
        isActive: true
      }
    });
    console.log(`   Sous-catégories actives: ${subCategories}`);

    console.log('\n🎯 ÉTAT PRÉPARÉ POUR LES TESTS DE SUPPRESSION');
    console.log('   • La catégorie ne peut pas être supprimée (contient des produits)');
    console.log('   • La sous-catégorie ne peut pas être supprimée (contient une variation)');
    console.log('   • La variation ne peut pas être supprimée (utilisée par un produit)');

    return {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id,
      productId: product.id,
      productCategoryOnlyId: productCategoryOnly.id,
      totals: {
        categoryProducts,
        subCategories
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Test de suppression de la catégorie
async function testCategoryDeletion(categoryId) {
  console.log('\n🧪 Test de suppression de la catégorie...');
  console.log(`   ID de la catégorie: ${categoryId}`);

  try {
    // Tenter de supprimer la catégorie
    await prisma.category.delete({
      where: { id: categoryId }
    });

    console.log('❌ ERREUR INATTENDUE: La catégorie a été supprimée !');
    console.log('   Ceci indique un problème avec les protections de suppression');
    return false;

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Protection active: La catégorie ne peut pas être supprimée');
      console.log('   Message: Foreign key constraint violated');
      console.log('   La protection fonctionne au niveau de la base de données');
      return true;
    } else {
      console.log(`⚠️  Erreur inattendue: ${error.message}`);
      return false;
    }
  }
}

// Test via les services (si le serveur est démarré)
async function testCategoryDeletionViaService(categoryId) {
  console.log('\n🧪 Test de suppression via le service...');

  // Simuler SubCategoryService.remove()
  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: 18 } // Utiliser la sous-catégorie vide du test précédent
    });

    if (subCategory) {
      console.log(`Test de suppression de la sous-catégorie vide: "${subCategory.name}" (ID: ${subCategory.id})`);

      // Vérifier les produits
      const productsCount = await prisma.product.count({
        where: {
          subCategoryId: subCategory.id,
          isDelete: false
        }
      });

      console.log(`   Produits liés: ${productsCount}`);

      if (productsCount > 0) {
        console.log('❌ Cette sous-catégorie a des produits, elle devrait être protégée');
      } else {
        console.log('✅ Cette sous-catégorie est vide, elle peut être supprimée');

        // Simuler la suppression
        try {
          await prisma.subCategory.delete({
            where: { id: subCategory.id }
          });
          console.log('✅ Sous-catégorie vide supprimée avec succès');
        } catch (error) {
          console.log(`⚠️  Erreur lors de la suppression: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.log('⚠️  Erreur lors du test:', error.message);
  }
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    const categoryId = parseInt(args[args.indexOf('--test') + 1]) || 1;
    await testCategoryDeletion(categoryId);
  } else if (args.includes('--test-service')) {
    await testCategoryDeletionViaService();
  } else {
    await createCategoryWithProduct();
  }
}

// Exécuter si ce fichier est appelé directement
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { createCategoryWithProduct, testCategoryDeletion };