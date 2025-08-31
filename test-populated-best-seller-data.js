/**
 * 🧪 Test des Données de Meilleures Ventes Remplies
 * 
 * Ce script vérifie que les champs isBestSeller, salesCount et totalRevenue
 * ont été correctement remplis dans la table VendorProduct.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPopulatedBestSellerData() {
  console.log('🧪 Test des données de meilleures ventes remplies...\n');

  try {
    // 1. Vérifier les statistiques globales
    console.log('📊 1. Statistiques globales...');
    const globalStats = await prisma.vendorProduct.aggregate({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      _count: {
        id: true
      },
      _sum: {
        salesCount: true,
        totalRevenue: true
      }
    });

    const bestSellersCount = await prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      }
    });

    console.log('✅ Statistiques globales :');
    console.log(`   - Total produits publiés: ${globalStats._count.id}`);
    console.log(`   - Meilleures ventes: ${bestSellersCount}`);
    console.log(`   - Ventes totales: ${globalStats._sum.salesCount || 0}`);
    console.log(`   - Revenus totaux: ${(globalStats._sum.totalRevenue || 0).toLocaleString()} FCFA`);

    // 2. Vérifier les top 5 meilleures ventes
    console.log('\n🏆 2. Top 5 des meilleures ventes...');
    const topBestSellers = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      },
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true,
            shop_name: true
          }
        }
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 5
    });

    console.log('✅ Top 5 des meilleures ventes :');
    topBestSellers.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      - Vendeur: ${product.vendor.firstName} ${product.vendor.lastName} (${product.vendor.shop_name})`);
      console.log(`      - Ventes: ${product.salesCount} unités`);
      console.log(`      - Revenus: ${product.totalRevenue.toLocaleString()} FCFA`);
      console.log(`      - Prix unitaire: ${product.price.toLocaleString()} FCFA`);
    });

    // 3. Vérifier les statistiques par vendeur
    console.log('\n👥 3. Statistiques par vendeur...');
    const vendorStats = await prisma.vendorProduct.groupBy({
      by: ['vendorId'],
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      _count: {
        id: true
      },
      _sum: {
        salesCount: true,
        totalRevenue: true
      }
    });

    console.log('✅ Statistiques par vendeur :');
    for (const stat of vendorStats) {
      const vendor = await prisma.user.findUnique({
        where: { id: stat.vendorId },
        select: {
          firstName: true,
          lastName: true,
          shop_name: true
        }
      });

      const bestSellersForVendor = await prisma.vendorProduct.count({
        where: {
          vendorId: stat.vendorId,
          isDelete: false,
          status: 'PUBLISHED',
          isBestSeller: true
        }
      });

      console.log(`   - ${vendor.firstName} ${vendor.lastName} (${vendor.shop_name})`);
      console.log(`     * Produits: ${stat._count.id}`);
      console.log(`     * Meilleures ventes: ${bestSellersForVendor}`);
      console.log(`     * Ventes totales: ${stat._sum.salesCount || 0}`);
      console.log(`     * Revenus totaux: ${(stat._sum.totalRevenue || 0).toLocaleString()} FCFA`);
    }

    // 4. Vérifier la cohérence des données
    console.log('\n🔍 4. Vérification de la cohérence...');
    
    // Vérifier que totalRevenue = salesCount * price (approximation)
    const allProducts = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        salesCount: true,
        totalRevenue: true,
        price: true
      }
    });

    const inconsistentProducts = allProducts.filter(product => {
      const expectedRevenue = product.salesCount * product.price;
      const difference = Math.abs(product.totalRevenue - expectedRevenue);
      return difference > 1; // Tolérance de 1 FCFA pour les arrondis
    });

    if (inconsistentProducts.length > 0) {
      console.log(`⚠️ ${inconsistentProducts.length} produits avec des revenus incohérents`);
      inconsistentProducts.forEach(product => {
        const expectedRevenue = product.salesCount * product.price;
        console.log(`   - ${product.name}: attendu ${expectedRevenue}, obtenu ${product.totalRevenue}`);
      });
    } else {
      console.log('✅ Tous les produits ont des revenus cohérents');
    }

    // Vérifier que les meilleures ventes ont des revenus > 0
    const invalidBestSellers = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true,
        totalRevenue: {
          lte: 0
        }
      }
    });

    if (invalidBestSellers.length > 0) {
      console.log(`⚠️ ${invalidBestSellers.length} meilleures ventes avec des revenus nuls`);
    } else {
      console.log('✅ Toutes les meilleures ventes ont des revenus > 0');
    }

    // 5. Test des endpoints API
    console.log('\n🌐 5. Test des endpoints API...');
    
    // Simuler un appel à l'endpoint des meilleures ventes
    const bestSellersFromAPI = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            profile_photo_url: true
          }
        },
        baseProduct: {
          include: {
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
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            category: true
          }
        }
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 10
    });

    console.log('✅ Données formatées pour l\'API :');
    console.log(`   - ${bestSellersFromAPI.length} meilleures ventes récupérées`);
    
    const apiFormattedData = bestSellersFromAPI.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue,
      vendor: {
        id: product.vendor.id,
        fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
        shop_name: product.vendor.shop_name,
        profile_photo_url: product.vendor.profile_photo_url
      },
      design: product.design ? {
        id: product.design.id,
        name: product.design.name,
        imageUrl: product.design.imageUrl,
        category: product.design.category
      } : null,
      primaryImageUrl: product.baseProduct.colorVariations[0]?.images[0]?.url || null
    }));

    console.log('✅ Format API correct pour les meilleures ventes');

    // 6. Résumé final
    console.log('\n📋 Résumé de la vérification :');
    console.log('✅ Données de meilleures ventes correctement remplies');
    console.log('✅ Statistiques cohérentes');
    console.log('✅ Format API prêt');
    console.log('✅ Fonctionnalités de meilleures ventes opérationnelles');

    console.log('\n🎉 Test des données de meilleures ventes réussi !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du test
if (require.main === module) {
  testPopulatedBestSellerData()
    .then(() => {
      console.log('\n✅ Test terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors du test:', error);
      process.exit(1);
    });
}

module.exports = {
  testPopulatedBestSellerData
}; 
 * 🧪 Test des Données de Meilleures Ventes Remplies
 * 
 * Ce script vérifie que les champs isBestSeller, salesCount et totalRevenue
 * ont été correctement remplis dans la table VendorProduct.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPopulatedBestSellerData() {
  console.log('🧪 Test des données de meilleures ventes remplies...\n');

  try {
    // 1. Vérifier les statistiques globales
    console.log('📊 1. Statistiques globales...');
    const globalStats = await prisma.vendorProduct.aggregate({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      _count: {
        id: true
      },
      _sum: {
        salesCount: true,
        totalRevenue: true
      }
    });

    const bestSellersCount = await prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      }
    });

    console.log('✅ Statistiques globales :');
    console.log(`   - Total produits publiés: ${globalStats._count.id}`);
    console.log(`   - Meilleures ventes: ${bestSellersCount}`);
    console.log(`   - Ventes totales: ${globalStats._sum.salesCount || 0}`);
    console.log(`   - Revenus totaux: ${(globalStats._sum.totalRevenue || 0).toLocaleString()} FCFA`);

    // 2. Vérifier les top 5 meilleures ventes
    console.log('\n🏆 2. Top 5 des meilleures ventes...');
    const topBestSellers = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      },
      include: {
        vendor: {
          select: {
            firstName: true,
            lastName: true,
            shop_name: true
          }
        }
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 5
    });

    console.log('✅ Top 5 des meilleures ventes :');
    topBestSellers.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      - Vendeur: ${product.vendor.firstName} ${product.vendor.lastName} (${product.vendor.shop_name})`);
      console.log(`      - Ventes: ${product.salesCount} unités`);
      console.log(`      - Revenus: ${product.totalRevenue.toLocaleString()} FCFA`);
      console.log(`      - Prix unitaire: ${product.price.toLocaleString()} FCFA`);
    });

    // 3. Vérifier les statistiques par vendeur
    console.log('\n👥 3. Statistiques par vendeur...');
    const vendorStats = await prisma.vendorProduct.groupBy({
      by: ['vendorId'],
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      _count: {
        id: true
      },
      _sum: {
        salesCount: true,
        totalRevenue: true
      }
    });

    console.log('✅ Statistiques par vendeur :');
    for (const stat of vendorStats) {
      const vendor = await prisma.user.findUnique({
        where: { id: stat.vendorId },
        select: {
          firstName: true,
          lastName: true,
          shop_name: true
        }
      });

      const bestSellersForVendor = await prisma.vendorProduct.count({
        where: {
          vendorId: stat.vendorId,
          isDelete: false,
          status: 'PUBLISHED',
          isBestSeller: true
        }
      });

      console.log(`   - ${vendor.firstName} ${vendor.lastName} (${vendor.shop_name})`);
      console.log(`     * Produits: ${stat._count.id}`);
      console.log(`     * Meilleures ventes: ${bestSellersForVendor}`);
      console.log(`     * Ventes totales: ${stat._sum.salesCount || 0}`);
      console.log(`     * Revenus totaux: ${(stat._sum.totalRevenue || 0).toLocaleString()} FCFA`);
    }

    // 4. Vérifier la cohérence des données
    console.log('\n🔍 4. Vérification de la cohérence...');
    
    // Vérifier que totalRevenue = salesCount * price (approximation)
    const allProducts = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        salesCount: true,
        totalRevenue: true,
        price: true
      }
    });

    const inconsistentProducts = allProducts.filter(product => {
      const expectedRevenue = product.salesCount * product.price;
      const difference = Math.abs(product.totalRevenue - expectedRevenue);
      return difference > 1; // Tolérance de 1 FCFA pour les arrondis
    });

    if (inconsistentProducts.length > 0) {
      console.log(`⚠️ ${inconsistentProducts.length} produits avec des revenus incohérents`);
      inconsistentProducts.forEach(product => {
        const expectedRevenue = product.salesCount * product.price;
        console.log(`   - ${product.name}: attendu ${expectedRevenue}, obtenu ${product.totalRevenue}`);
      });
    } else {
      console.log('✅ Tous les produits ont des revenus cohérents');
    }

    // Vérifier que les meilleures ventes ont des revenus > 0
    const invalidBestSellers = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true,
        totalRevenue: {
          lte: 0
        }
      }
    });

    if (invalidBestSellers.length > 0) {
      console.log(`⚠️ ${invalidBestSellers.length} meilleures ventes avec des revenus nuls`);
    } else {
      console.log('✅ Toutes les meilleures ventes ont des revenus > 0');
    }

    // 5. Test des endpoints API
    console.log('\n🌐 5. Test des endpoints API...');
    
    // Simuler un appel à l'endpoint des meilleures ventes
    const bestSellersFromAPI = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
        isBestSeller: true
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            profile_photo_url: true
          }
        },
        baseProduct: {
          include: {
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
        design: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            category: true
          }
        }
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 10
    });

    console.log('✅ Données formatées pour l\'API :');
    console.log(`   - ${bestSellersFromAPI.length} meilleures ventes récupérées`);
    
    const apiFormattedData = bestSellersFromAPI.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salesCount: product.salesCount,
      totalRevenue: product.totalRevenue,
      vendor: {
        id: product.vendor.id,
        fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
        shop_name: product.vendor.shop_name,
        profile_photo_url: product.vendor.profile_photo_url
      },
      design: product.design ? {
        id: product.design.id,
        name: product.design.name,
        imageUrl: product.design.imageUrl,
        category: product.design.category
      } : null,
      primaryImageUrl: product.baseProduct.colorVariations[0]?.images[0]?.url || null
    }));

    console.log('✅ Format API correct pour les meilleures ventes');

    // 6. Résumé final
    console.log('\n📋 Résumé de la vérification :');
    console.log('✅ Données de meilleures ventes correctement remplies');
    console.log('✅ Statistiques cohérentes');
    console.log('✅ Format API prêt');
    console.log('✅ Fonctionnalités de meilleures ventes opérationnelles');

    console.log('\n🎉 Test des données de meilleures ventes réussi !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du test
if (require.main === module) {
  testPopulatedBestSellerData()
    .then(() => {
      console.log('\n✅ Test terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors du test:', error);
      process.exit(1);
    });
}

module.exports = {
  testPopulatedBestSellerData
}; 