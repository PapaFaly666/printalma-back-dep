// Test de l'API pour simuler la suppression d'une variation utilisée par des produits
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiSuppressionVariationUtilisee() {
  console.log('🔧 Test API: Simulation de la suppression d\'une variation utilisée\n');

  try {
    // Étape 1: Trouver une variation utilisée par des produits
    const variationWithProducts = await prisma.variation.findFirst({
      where: {
        products: {
          some: {
            isDelete: false
          }
        }
      },
      include: {
        subCategory: true,
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

    if (!variationWithProducts) {
      console.log('ℹ️  Aucune variation utilisée par des produits n\'a été trouvée');
      return;
    }

    const variationId = variationWithProducts.id;
    const productsCount = variationWithProducts._count.products;

    console.log(`📋 Variation trouvée: ${variationWithProducts.name} (ID: ${variationId})`);
    console.log(`   Sous-catégorie: ${variationWithProducts.subCategory.name}`);
    console.log(`   Produits utilisant cette variation: ${productsCount}\n`);

    // Étape 2: Simuler la logique du service (même logique que dans variation.service.ts)
    const productsDirectCount = await prisma.product.count({
      where: {
        variationId: variationId,
        isDelete: false
      }
    });

    console.log(`🔍 Vérification directe: ${productsDirectCount} produit(s) trouvé(s)`);

    // Étape 3: Simuler la réponse du service avec erreur
    const errorResponse = {
      success: false,
      error: 'VARIATION_IN_USE',
      message: `La variation est utilisée par ${productsDirectCount} produit(s). Elle ne peut pas être supprimée.`,
      details: {
        variationId: variationId,
        subCategoryId: variationWithProducts.subCategoryId,
        productsCount: productsDirectCount,
        message: `${productsDirectCount} produit(s) utilisent directement cette variation`,
        produits: await prisma.product.findMany({
          where: {
            variationId: variationId,
            isDelete: false
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true
          },
          take: 3 // Limiter à 3 produits pour l'exemple
        })
      }
    };

    console.log('\n🛡️  RÉPONSE API (erreur 409):');
    console.log(JSON.stringify(errorResponse, null, 2));

    console.log('\n🎯 Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiSuppressionVariationUtilisee();