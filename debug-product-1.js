const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProduct1() {
  console.log('🔍 Debug spécifique du VendorProduct ID 1 (Mugs)...\n');

  try {
    // Récupérer le produit ID 1 avec toutes ses relations
    const product = await prisma.vendorProduct.findUnique({
      where: { id: 1 },
      include: {
        baseProduct: {
          include: {
            categories: true,
            colorVariations: {
              include: {
                images: {
                  include: {
                    delimitations: true
                  }
                }
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile_photo_url: true,
            shop_name: true
          }
        }
      }
    });

    if (!product) {
      console.log('❌ Produit ID 1 non trouvé');
      return;
    }

    console.log('📦 Détails du produit ID 1:');
    console.log({
      id: product.id,
      name: product.name,
      isBestSeller: product.isBestSeller,
      isValidated: product.isValidated,
      status: product.status,
      isDelete: product.isDelete,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue,
      bestSellerRank: product.bestSellerRank,
      baseProductId: product.baseProductId,
      vendorId: product.vendorId
    });

    console.log('\n📋 Base Product:');
    console.log({
      id: product.baseProduct.id,
      name: product.baseProduct.name,
      categoriesCount: product.baseProduct.categories.length,
      colorVariationsCount: product.baseProduct.colorVariations.length
    });

    console.log('\n📋 Categories:');
    for (const cat of product.baseProduct.categories) {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    }

    console.log('\n📋 Color Variations:');
    for (const colorVar of product.baseProduct.colorVariations) {
      console.log(`   - ${colorVar.name} (ID: ${colorVar.id}): ${colorVar.images.length} images`);
      for (const image of colorVar.images) {
        console.log(`     * Image ${image.id}: ${image.delimitations.length} délimitations`);
      }
    }

    console.log('\n📋 Vendor:');
    console.log({
      id: product.vendor.id,
      firstName: product.vendor.firstName,
      lastName: product.vendor.lastName,
      profile_photo_url: product.vendor.profile_photo_url,
      shop_name: product.vendor.shop_name
    });

    // Vérifier si le produit passe les conditions du service
    console.log('\n🔍 Vérification des conditions du service:');
    const conditions = {
      isBestSeller: true,
      isValidated: true,
      status: 'PUBLISHED',
      isDelete: false,
      salesCount: { gte: 1 }
    };

    const passesConditions = await prisma.vendorProduct.findFirst({
      where: {
        id: 1,
        ...conditions
      }
    });

    console.log(`✅ Passe les conditions: ${passesConditions ? 'OUI' : 'NON'}`);

    // Test avec includes pour voir s'il y a une erreur
    console.log('\n🔍 Test avec includes complets:');
    try {
      const withIncludes = await prisma.vendorProduct.findFirst({
        where: {
          id: 1,
          ...conditions
        },
        include: {
          baseProduct: {
            include: {
              categories: true,
              colorVariations: {
                include: {
                  images: {
                    include: {
                      delimitations: true
                    }
                  }
                }
              }
            }
          },
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profile_photo_url: true,
              shop_name: true
            }
          }
        }
      });

      console.log(`✅ Trouvé avec includes: ${withIncludes ? 'OUI' : 'NON'}`);
      
      if (withIncludes) {
        console.log('📦 Détails avec includes:');
        console.log({
          id: withIncludes.id,
          name: withIncludes.name,
          baseProduct: {
            id: withIncludes.baseProduct.id,
            name: withIncludes.baseProduct.name,
            categoriesCount: withIncludes.baseProduct.categories.length,
            colorVariationsCount: withIncludes.baseProduct.colorVariations.length
          },
          vendor: {
            id: withIncludes.vendor.id,
            firstName: withIncludes.vendor.firstName,
            lastName: withIncludes.vendor.lastName
          }
        });
      }
    } catch (error) {
      console.log('❌ Erreur avec includes:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugProduct1();
}

module.exports = { debugProduct1 }; 