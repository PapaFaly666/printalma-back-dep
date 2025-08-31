const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBestSellers() {
  try {
    console.log('🔍 Vérification des meilleures ventes...\n');

    // 1. Vérifier les produits marqués comme best-sellers
    console.log('🏆 Produits marqués comme best-sellers:');
    const bestSellers = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true,
        isDelete: false
      },
      include: {
        baseProduct: true,
        vendor: true
      }
    });
    
    console.log(`Total: ${bestSellers.length} produits best-sellers`);
    bestSellers.forEach((product, index) => {
      console.log(`\n${index + 1}. Produit ID: ${product.id}`);
      console.log(`   - Nom: ${product.name}`);
      console.log(`   - Vendeur: ${product.vendor?.firstName} ${product.vendor?.lastName}`);
      console.log(`   - Status: ${product.status}`);
      console.log(`   - Sales Count: ${product.salesCount || 0}`);
      console.log(`   - Total Revenue: ${product.totalRevenue || 0}`);
      console.log(`   - Best Seller Rank: ${product.bestSellerRank || 'Non défini'}`);
    });

    // 2. Vérifier tous les produits pour voir s'il y en a qui devraient être best-sellers
    console.log('\n📊 Tous les produits (pour comparaison):');
    const allProducts = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        status: true,
        isBestSeller: true,
        salesCount: true,
        totalRevenue: true,
        bestSellerRank: true
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 10
    });
    
    console.log(`Top 10 par revenus:`);
    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Produit ID: ${product.id}`);
      console.log(`   - Nom: ${product.name}`);
      console.log(`   - Status: ${product.status}`);
      console.log(`   - Is Best Seller: ${product.isBestSeller}`);
      console.log(`   - Sales Count: ${product.salesCount || 0}`);
      console.log(`   - Total Revenue: ${product.totalRevenue || 0}`);
      console.log(`   - Best Seller Rank: ${product.bestSellerRank || 'Non défini'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBestSellers(); 