const { PrismaClient } = require('@prisma/client');

async function testFilter() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing new filter criteria...\n');

    const where = {
      OR: [
        // Produits traditionnels en attente
        {
          status: 'PENDING',
          isValidated: false,
          designId: { not: null }
        },
        // Produits WIZARD - inclure tous les statuts pour validation admin
        {
          designId: null,
          // Inclure produits WIZARD même s'ils sont publiés/draft pour validation admin
        }
      ],
      isDelete: false
    };

    const products = await prisma.vendorProduct.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        designId: true,
        isValidated: true,
        adminValidated: true,
        colors: true,
        sizes: true,
        baseProduct: {
          select: {
            id: true,
            name: true
          }
        },
        vendor: {
          select: {
            shop_name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${products.length} products with new filter criteria\n`);

    products.forEach((product, index) => {
      console.log(`--- Product ${index + 1}: ID ${product.id} ---`);
      console.log(`Name: ${product.name}`);
      console.log(`Status: ${product.status}`);
      console.log(`DesignId: ${product.designId}`);
      console.log(`IsValidated: ${product.isValidated}`);
      console.log(`AdminValidated: ${product.adminValidated}`);
      console.log(`Base Product: ${product.baseProduct.name} (ID: ${product.baseProduct.id})`);
      console.log(`Vendor: ${product.vendor.shop_name || product.vendor.firstName + ' ' + product.vendor.lastName}`);
      console.log(`Colors: ${Array.isArray(product.colors) ? product.colors.length : 'Not array'} items`);
      console.log(`Sizes: ${Array.isArray(product.sizes) ? product.sizes.length : 'Not array'} items\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFilter();