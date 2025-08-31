const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectDatabase() {
  console.log('🔍 Test direct de la base de données...\n');

  try {
    // 1. Vérifier les conditions exactes du service
    console.log('📋 Conditions du service Best Sellers:');
    const conditions = {
      isBestSeller: true,
      isValidated: true,
      status: 'PUBLISHED',
      isDelete: false,
      salesCount: { gte: 1 }
    };
    console.log(JSON.stringify(conditions, null, 2));

    // 2. Tester chaque condition séparément
    console.log('\n🔍 Test de chaque condition:');
    
    const isBestSeller = await prisma.vendorProduct.count({ where: { isBestSeller: true } });
    console.log(`✅ isBestSeller: true -> ${isBestSeller} produits`);

    const isValidated = await prisma.vendorProduct.count({ where: { isValidated: true } });
    console.log(`✅ isValidated: true -> ${isValidated} produits`);

    const isPublished = await prisma.vendorProduct.count({ where: { status: 'PUBLISHED' } });
    console.log(`✅ status: 'PUBLISHED' -> ${isPublished} produits`);

    const notDeleted = await prisma.vendorProduct.count({ where: { isDelete: false } });
    console.log(`✅ isDelete: false -> ${notDeleted} produits`);

    const hasSales = await prisma.vendorProduct.count({ where: { salesCount: { gte: 1 } } });
    console.log(`✅ salesCount >= 1 -> ${hasSales} produits`);

    // 3. Test avec toutes les conditions
    console.log('\n🔍 Test avec toutes les conditions:');
    const allConditions = await prisma.vendorProduct.findMany({
      where: conditions,
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    console.log(`📊 Produits avec toutes les conditions: ${allConditions.length}`);

    if (allConditions.length > 0) {
      console.log('\n📦 Détails du premier produit:');
      const product = allConditions[0];
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
        vendor: {
          id: product.vendor.id,
          firstName: product.vendor.firstName,
          lastName: product.vendor.lastName
        },
        baseProduct: {
          id: product.baseProduct.id,
          name: product.baseProduct.name
        }
      });
    }

    // 4. Test avec les conditions du service mais sans les includes
    console.log('\n🔍 Test avec conditions du service (sans includes):');
    const serviceConditions = await prisma.vendorProduct.findMany({
      where: conditions,
      orderBy: [
        { bestSellerRank: 'asc' },
        { salesCount: 'desc' },
        { totalRevenue: 'desc' }
      ],
      take: 5,
      skip: 0
    });

    console.log(`📊 Produits avec conditions du service: ${serviceConditions.length}`);

    if (serviceConditions.length > 0) {
      console.log('\n📦 Premier produit (sans includes):');
      const product = serviceConditions[0];
      console.log({
        id: product.id,
        name: product.name,
        isBestSeller: product.isBestSeller,
        isValidated: product.isValidated,
        status: product.status,
        isDelete: product.isDelete,
        salesCount: product.salesCount,
        totalRevenue: product.totalRevenue,
        bestSellerRank: product.bestSellerRank
      });
    }

    // 5. Test avec includes pour voir s'il y a un problème de relations
    console.log('\n🔍 Test avec includes:');
    try {
      const withIncludes = await prisma.vendorProduct.findMany({
        where: conditions,
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
        },
        take: 1
      });

      console.log(`📊 Produits avec includes: ${withIncludes.length}`);
      
      if (withIncludes.length > 0) {
        console.log('\n📦 Premier produit (avec includes):');
        const product = withIncludes[0];
        console.log({
          id: product.id,
          name: product.name,
          baseProduct: {
            id: product.baseProduct.id,
            name: product.baseProduct.name,
            categoriesCount: product.baseProduct.categories.length,
            colorVariationsCount: product.baseProduct.colorVariations.length
          },
          vendor: {
            id: product.vendor.id,
            firstName: product.vendor.firstName,
            lastName: product.vendor.lastName,
            profile_photo_url: product.vendor.profile_photo_url,
            shop_name: product.vendor.shop_name
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
  testDirectDatabase();
}

module.exports = { testDirectDatabase }; 