import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSeed() {
  console.log('🔍 Checking database content...\n');

  try {
    const counts = {
      users: await prisma.user.count(),
      superAdmins: await prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
      vendors: await prisma.user.count({ where: { role: 'VENDEUR' } }),
      clients: await prisma.user.count({ where: { role: null } }),
      categories: await prisma.category.count(),
      subCategories: await prisma.subCategory.count(),
      variations: await prisma.variation.count(),
      products: await prisma.product.count(),
      colorVariations: await prisma.colorVariation.count(),
      orders: await prisma.order.count(),
      ordersPending: await prisma.order.count({ where: { status: 'PENDING' } }),
      ordersConfirmed: await prisma.order.count({ where: { status: 'CONFIRMED' } }),
      ordersShipped: await prisma.order.count({ where: { status: 'SHIPPED' } }),
      ordersDelivered: await prisma.order.count({ where: { status: 'DELIVERED' } }),
      ordersCancelled: await prisma.order.count({ where: { status: 'CANCELLED' } }),
      fundsRequests: await prisma.vendorFundsRequest.count(),
      fundsRequestsPending: await prisma.vendorFundsRequest.count({ where: { status: 'PENDING' } }),
      fundsRequestsApproved: await prisma.vendorFundsRequest.count({ where: { status: 'APPROVED' } }),
      fundsRequestsPaid: await prisma.vendorFundsRequest.count({ where: { status: 'PAID' } }),
      fundsRequestsRejected: await prisma.vendorFundsRequest.count({ where: { status: 'REJECTED' } }),
      vendorCommissions: await prisma.vendorCommission.count(),
      vendorEarnings: await prisma.vendorEarnings.count(),
    };

    console.log('📊 DATABASE CONTENT SUMMARY:');
    console.log('═'.repeat(60));
    console.log('');

    console.log('👥 USERS:');
    console.log(`   Total: ${counts.users}`);
    console.log(`   ├─ Super Admins: ${counts.superAdmins}`);
    console.log(`   ├─ Admins: ${counts.admins}`);
    console.log(`   ├─ Vendors: ${counts.vendors}`);
    console.log(`   └─ Clients: ${counts.clients}`);
    console.log('');

    console.log('🏷️  CATEGORIES:');
    console.log(`   Main Categories: ${counts.categories}`);
    console.log(`   Sub-Categories: ${counts.subCategories}`);
    console.log(`   Variations: ${counts.variations}`);
    console.log('');

    console.log('🛍️  PRODUCTS:');
    console.log(`   Products: ${counts.products}`);
    console.log(`   Color Variations: ${counts.colorVariations}`);
    console.log('');

    console.log('📦 ORDERS:');
    console.log(`   Total: ${counts.orders}`);
    console.log(`   ├─ Pending: ${counts.ordersPending}`);
    console.log(`   ├─ Confirmed: ${counts.ordersConfirmed}`);
    console.log(`   ├─ Shipped: ${counts.ordersShipped}`);
    console.log(`   ├─ Delivered: ${counts.ordersDelivered}`);
    console.log(`   └─ Cancelled: ${counts.ordersCancelled}`);
    console.log('');

    console.log('💰 FUNDS REQUESTS:');
    console.log(`   Total: ${counts.fundsRequests}`);
    console.log(`   ├─ Pending: ${counts.fundsRequestsPending}`);
    console.log(`   ├─ Approved: ${counts.fundsRequestsApproved}`);
    console.log(`   ├─ Paid: ${counts.fundsRequestsPaid}`);
    console.log(`   └─ Rejected: ${counts.fundsRequestsRejected}`);
    console.log('');

    console.log('💵 VENDOR FINANCES:');
    console.log(`   Commissions: ${counts.vendorCommissions}`);
    console.log(`   Earnings Tracked: ${counts.vendorEarnings}`);
    console.log('');

    console.log('═'.repeat(60));

    // Afficher quelques exemples d'utilisateurs
    console.log('\n📝 SAMPLE USERS:');
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        email: true,
        role: true,
        shop_name: true,
      },
    });

    sampleUsers.forEach(user => {
      const roleDisplay = user.role || 'CLIENT';
      const shop = user.shop_name ? ` (${user.shop_name})` : '';
      console.log(`   ${user.email} - ${roleDisplay}${shop}`);
    });

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

checkSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
