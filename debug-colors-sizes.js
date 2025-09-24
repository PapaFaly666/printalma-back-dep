const { PrismaClient } = require('@prisma/client');

async function debugColorsSizes() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Debugging colors and sizes for VendorProduct...\n');

    // Get wizard products (products with designId null)
    const wizardProducts = await prisma.vendorProduct.findMany({
      where: {
        designId: null,
        isDelete: false
      },
      select: {
        id: true,
        name: true,
        status: true,
        colors: true,
        sizes: true,
        baseProductId: true,
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true
          }
        },
        baseProduct: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 5
    });

    console.log(`Found ${wizardProducts.length} WIZARD products\n`);

    wizardProducts.forEach((product, index) => {
      console.log(`--- Product ${index + 1}: ID ${product.id} ---`);
      console.log(`Name: ${product.name}`);
      console.log(`Status: ${product.status}`);
      console.log(`Base Product: ${product.baseProduct.name} (ID: ${product.baseProduct.id})`);
      console.log(`Vendor: ${product.vendor.shop_name || product.vendor.firstName + ' ' + product.vendor.lastName}`);
      console.log(`Colors:`, product.colors);
      console.log(`Colors type:`, typeof product.colors);
      console.log(`Sizes:`, product.sizes);
      console.log(`Sizes type:`, typeof product.sizes);

      if (product.colors) {
        try {
          const parsedColors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
          console.log(`Parsed colors:`, parsedColors);
          console.log(`Colors array length:`, Array.isArray(parsedColors) ? parsedColors.length : 'Not an array');
        } catch (e) {
          console.log(`Error parsing colors:`, e.message);
        }
      }

      if (product.sizes) {
        try {
          const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          console.log(`Parsed sizes:`, parsedSizes);
          console.log(`Sizes array length:`, Array.isArray(parsedSizes) ? parsedSizes.length : 'Not an array');
        } catch (e) {
          console.log(`Error parsing sizes:`, e.message);
        }
      }

      console.log('\n');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugColorsSizes();