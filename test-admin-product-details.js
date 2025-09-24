const { PrismaClient } = require('@prisma/client');

async function testAdminProductDetails() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing getAdminProductDetails logic...\n');

    // Test with known base product IDs from our wizard products
    const baseProductIds = [33, 34]; // Mugs and Polo

    for (const baseProductId of baseProductIds) {
      console.log(`--- Testing baseProductId: ${baseProductId} ---`);

      const baseProduct = await prisma.product.findUnique({
        where: { id: baseProductId },
        include: {
          categories: {
            select: {
              id: true,
              name: true
            }
          },
          themes: {
            select: {
              id: true,
              name: true
            }
          },
          colorVariations: {
            include: {
              images: {
                select: {
                  id: true,
                  url: true,
                  view: true,
                  delimitations: true
                }
              }
            }
          },
          productSizes: {
            select: {
              id: true,
              sizeName: true
            }
          }
        }
      });

      if (!baseProduct) {
        console.log(`❌ Product ${baseProductId} not found`);
        continue;
      }

      console.log(`✅ Product found: ${baseProduct.name} (ID: ${baseProduct.id})`);
      console.log(`Description: ${baseProduct.description || 'None'}`);
      console.log(`Price: ${baseProduct.price}`);
      console.log(`Categories: ${baseProduct.categories.length}`);
      console.log(`Themes: ${baseProduct.themes.length}`);
      console.log(`Color variations: ${baseProduct.colorVariations.length}`);
      console.log(`Product sizes: ${baseProduct.productSizes.length}`);

      // Test images
      const mockupImages = baseProduct.colorVariations?.flatMap(color =>
        color.images?.map(image => ({
          id: image.id,
          url: image.url,
          viewType: image.view,
          colorName: color.name,
          colorCode: color.colorCode
        })) || []
      ) || [];

      console.log(`Mockup images: ${mockupImages.length}`);
      if (mockupImages.length > 0) {
        mockupImages.forEach((img, index) => {
          console.log(`  Image ${index + 1}: ${img.url} (${img.viewType}, ${img.colorName})`);
        });
      }

      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminProductDetails();