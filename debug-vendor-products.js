const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugVendorProducts() {
  console.log('🔍 Debug des VendorProduct dans la base de données...\n');

  try {
    // Récupérer tous les VendorProduct
    const vendorProducts = await prisma.vendorProduct.findMany({
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    console.log(`📊 Total VendorProduct trouvés: ${vendorProducts.length}\n`);

    if (vendorProducts.length === 0) {
      console.log('❌ Aucun VendorProduct trouvé');
      return;
    }

    // Afficher les détails de chaque produit
    for (const product of vendorProducts) {
      console.log(`\n📦 Produit ID: ${product.id}`);
      console.log(`   Nom: ${product.name}`);
      console.log(`   Prix: ${product.price}€`);
      console.log(`   Ventes: ${product.salesCount}`);
      console.log(`   CA: ${product.totalRevenue}€`);
      console.log(`   Vues: ${product.viewsCount}`);
      console.log(`   Best Seller: ${product.isBestSeller}`);
      console.log(`   Rang: ${product.bestSellerRank}`);
      console.log(`   Publié: ${product.isPublished}`);
      console.log(`   Approuvé: ${product.isApproved}`);
      console.log(`   Validé: ${product.isValidated}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Supprimé: ${product.isDelete}`);
      console.log(`   Vendeur: ${product.vendor?.firstName} ${product.vendor?.lastName}`);
      console.log(`   Produit de base: ${product.baseProduct?.name}`);
    }

    // Vérifier les conditions du service
    console.log('\n🔍 Vérification des conditions du service Best Sellers...');
    
    const bestSellerConditions = await prisma.vendorProduct.findMany({
      where: {
        isBestSeller: true,
        isValidated: true,
        status: 'PUBLISHED',
        isDelete: false,
        salesCount: {
          gte: 1
        }
      }
    });

    console.log(`✅ Produits avec conditions best-seller: ${bestSellerConditions.length}`);

    // Vérifier chaque condition séparément
    const isBestSeller = await prisma.vendorProduct.count({ where: { isBestSeller: true } });
    const isValidated = await prisma.vendorProduct.count({ where: { isValidated: true } });
    const isPublished = await prisma.vendorProduct.count({ where: { status: 'PUBLISHED' } });
    const notDeleted = await prisma.vendorProduct.count({ where: { isDelete: false } });
    const hasSales = await prisma.vendorProduct.count({ where: { salesCount: { gte: 1 } } });

    console.log(`\n📋 Répartition par condition:`);
    console.log(`   isBestSeller: ${isBestSeller}`);
    console.log(`   isValidated: ${isValidated}`);
    console.log(`   status: 'PUBLISHED': ${isPublished}`);
    console.log(`   isDelete: false: ${notDeleted}`);
    console.log(`   salesCount >= 1: ${hasSales}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugVendorProducts();
}

module.exports = { debugVendorProducts }; 