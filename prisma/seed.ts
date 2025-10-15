import { PrismaClient } from '@prisma/client';
import { seedCategories } from './seed-categories';
import { seedUsers } from './seed-users';
import { seedProducts } from './seed-products';
import { seedOrders } from './seed-orders';
import { seedFundsRequests } from './seed-funds-requests';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Categories (3 niveaux)
    console.log('📁 Step 1/5: Categories...');
    const categoryData = await seedCategories();
    console.log('');

    // 2. Seed Users (Admin, Vendors, Clients)
    console.log('👥 Step 2/5: Users...');
    const users = await seedUsers();
    console.log('');

    // 3. Seed Products
    console.log('🛍️  Step 3/5: Products...');
    const products = await seedProducts(categoryData);
    console.log('');

    // 4. Seed Orders
    console.log('📦 Step 4/5: Orders...');
    const orders = await seedOrders(users, products);
    console.log('');

    // 5. Seed Funds Requests
    console.log('💰 Step 5/5: Funds Requests...');
    await seedFundsRequests(users, orders);
    console.log('');

    console.log('✅ Database seeding completed successfully!\n');

    // Afficher un résumé
    console.log('📊 SEEDING SUMMARY:');
    console.log('═'.repeat(50));

    const counts = {
      users: await prisma.user.count(),
      superAdmins: await prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      vendors: await prisma.user.count({ where: { role: 'VENDEUR' } }),
      categories: await prisma.category.count(),
      subCategories: await prisma.subCategory.count(),
      variations: await prisma.variation.count(),
      products: await prisma.product.count(),
      colorVariations: await prisma.colorVariation.count(),
      orders: await prisma.order.count(),
      ordersPending: await prisma.order.count({ where: { status: 'PENDING' } }),
      ordersDelivered: await prisma.order.count({ where: { status: 'DELIVERED' } }),
      fundsRequests: await prisma.vendorFundsRequest.count(),
      fundsRequestsPending: await prisma.vendorFundsRequest.count({ where: { status: 'PENDING' } }),
      fundsRequestsPaid: await prisma.vendorFundsRequest.count({ where: { status: 'PAID' } }),
      vendorCommissions: await prisma.vendorCommission.count(),
      vendorEarnings: await prisma.vendorEarnings.count(),
    };

    console.log(`👥 Users Total: ${counts.users}`);
    console.log(`   ├─ Super Admins: ${counts.superAdmins}`);
    console.log(`   ├─ Admins: ${counts.admins}`);
    console.log(`   └─ Vendors: ${counts.vendors}`);
    console.log('');

    console.log(`🏷️  Categories: ${counts.categories}`);
    console.log(`   ├─ Sub-Categories: ${counts.subCategories}`);
    console.log(`   └─ Variations: ${counts.variations}`);
    console.log('');

    console.log(`🛍️  Products: ${counts.products}`);
    console.log(`   └─ Color Variations: ${counts.colorVariations}`);
    console.log('');

    console.log(`📦 Orders: ${counts.orders}`);
    console.log(`   ├─ Pending: ${counts.ordersPending}`);
    console.log(`   └─ Delivered: ${counts.ordersDelivered}`);
    console.log('');

    console.log(`💰 Funds Requests: ${counts.fundsRequests}`);
    console.log(`   ├─ Pending: ${counts.fundsRequestsPending}`);
    console.log(`   └─ Paid: ${counts.fundsRequestsPaid}`);
    console.log('');

    console.log(`💵 Vendor Commissions: ${counts.vendorCommissions}`);
    console.log(`📈 Vendor Earnings Tracked: ${counts.vendorEarnings}`);
    console.log('');

    console.log('═'.repeat(50));
    console.log('\n🎉 All done! Your database is now populated with test data.');
    console.log('\n📝 Default credentials:');
    console.log('   Super Admin: superadmin@printalma.com / password123');
    console.log('   Admin: admin1@printalma.com / password123');
    console.log('   Vendor Example: ahmed.diop@vendor.com / password123');
    console.log('   Client Example: sophie.martin@client.com / password123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
