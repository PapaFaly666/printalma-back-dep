const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestProduct() {
  try {
    // First check if we already have a product using our test subcategory
    const existingProduct = await prisma.product.findFirst({
      where: {
        subCategoryId: 13,
        isDelete: false
      }
    });

    if (existingProduct) {
      console.log('✅ Found existing test product:', existingProduct.id);
      return existingProduct;
    }

    // Create a test product that uses our test subcategory and variation
    const product = await prisma.product.create({
      data: {
        name: 'Test Product Protected',
        description: 'Produit de test pour vérifier la protection de suppression',
        price: 10.99,
        stock: 100,
        category: {
          connect: { id: 5 }  // Goodies category
        },
        subCategory: {
          connect: { id: 13 }  // Our test subcategory
        },
        variation: {
          connect: { id: 28 }  // Our test variation
        }
      }
    });

    console.log('✅ Created test product:', product.id);
    return product;
  } catch (error) {
    console.error('❌ Error creating test product:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProduct();