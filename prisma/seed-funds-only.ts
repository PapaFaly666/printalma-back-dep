import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFundsRequestsQuick() {
  console.log('💰 Seeding funds requests (quick version)...\n');

  try {
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDEUR' },
      include: { vendorEarnings: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
    });

    console.log(`✅ Found ${vendors.length} vendors, ${admins.length} admins, ${deliveredOrders.length} delivered orders\n`);

    let totalCreated = 0;

    // Mettre à jour d'abord les earnings des vendeurs
    for (const vendor of vendors) {
      const randomEarnings = 500 + Math.random() * 4500; // Entre 500 et 5000
      await prisma.vendorEarnings.update({
        where: { vendorId: vendor.id },
        data: {
          totalEarnings: randomEarnings,
          availableAmount: randomEarnings * 0.7, // 70% disponible
          pendingAmount: randomEarnings * 0.3, // 30% en attente
          thisMonthEarnings: randomEarnings * 0.3,
          lastMonthEarnings: randomEarnings * 0.2,
        },
      });
    }

    console.log('✅ Vendor earnings updated\n');

    // Créer des demandes d'appel de fonds (30 demandes)
    const paymentMethods = ['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'];
    const statuses = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];

    for (let i = 0; i < 30; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const earnings = await prisma.vendorEarnings.findUnique({
        where: { vendorId: vendor.id },
      });

      if (!earnings || earnings.availableAmount === 0) continue;

      const requestedPercentage = 0.5 + Math.random() * 0.5;
      const requestedAmount = earnings.availableAmount * requestedPercentage;
      const commissionRate = 0.10;
      const amount = requestedAmount * (1 - commissionRate);

      const rand = Math.random();
      let status;
      if (rand < 0.3) status = 'PAID';
      else if (rand < 0.5) status = 'APPROVED';
      else if (rand < 0.7) status = 'PENDING';
      else status = 'REJECTED';

      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const processedBy = (status !== 'PENDING') ? admins[Math.floor(Math.random() * admins.length)].id : null;
      const processedAt = (status !== 'PENDING') ? new Date(createdDate.getTime() + 86400000) : null;

      await prisma.vendorFundsRequest.create({
        data: {
          vendorId: vendor.id,
          amount,
          requestedAmount,
          description: `Demande de retrait ${i + 1}`,
          paymentMethod: paymentMethod as any,
          phoneNumber: paymentMethod !== 'BANK_TRANSFER' ? vendor.phone : null,
          bankIban: paymentMethod === 'BANK_TRANSFER' ? `SN${Math.floor(10000000000000000000 + Math.random() * 90000000000000000000)}` : null,
          status: status as any,
          availableBalance: earnings.availableAmount,
          commissionRate,
          rejectReason: status === 'REJECTED' ? 'Documents manquants' : null,
          adminNote: (status === 'APPROVED' || status === 'PAID') ? 'Demande validée' : null,
          processedBy,
          processedAt,
          requestedAt: createdDate,
          validatedAt: status === 'APPROVED' || status === 'PAID' ? processedAt : null,
          createdAt: createdDate,
          updatedAt: processedAt || createdDate,
        },
      });

      totalCreated++;
    }

    console.log(`✅ ${totalCreated} funds requests created\n`);

    // Afficher un résumé
    const counts = {
      total: await prisma.vendorFundsRequest.count(),
      pending: await prisma.vendorFundsRequest.count({ where: { status: 'PENDING' } }),
      approved: await prisma.vendorFundsRequest.count({ where: { status: 'APPROVED' } }),
      paid: await prisma.vendorFundsRequest.count({ where: { status: 'PAID' } }),
      rejected: await prisma.vendorFundsRequest.count({ where: { status: 'REJECTED' } }),
    };

    console.log('📊 FUNDS REQUESTS SUMMARY:');
    console.log(`   Total: ${counts.total}`);
    console.log(`   ├─ Pending: ${counts.pending}`);
    console.log(`   ├─ Approved: ${counts.approved}`);
    console.log(`   ├─ Paid: ${counts.paid}`);
    console.log(`   └─ Rejected: ${counts.rejected}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

seedFundsRequestsQuick()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
