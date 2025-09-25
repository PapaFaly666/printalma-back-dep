const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDbValues() {
  console.log('🔍 Checking direct database values for adminValidated field...');

  const products = await prisma.vendorProduct.findMany({
    where: {
      id: {
        in: [177, 176, 175] // The three products from the logs
      }
    },
    select: {
      id: true,
      vendorName: true,
      adminValidated: true,
      isValidated: true,
      validatedBy: true,
      status: true
    }
  });

  console.log('📊 Database results:');
  products.forEach(product => {
    console.log(`Product ${product.id} (${product.vendorName}):`);
    console.log(`  - adminValidated: ${product.adminValidated}`);
    console.log(`  - isValidated: ${product.isValidated}`);
    console.log(`  - validatedBy: ${product.validatedBy}`);
    console.log(`  - status: ${product.status}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkDbValues().catch(console.error);