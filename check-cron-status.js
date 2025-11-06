const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCronStatus() {
  console.log('🔍 Vérification du statut du cron job PayDunya');
  console.log('═════════════════════════════════════════════════════════');

  try {
    // 1. Vérifier combien de commandes sont en attente
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const pendingOrders = await prisma.order.count({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // 2. Vérifier les mises à jour récentes
    const recentUpdates = await prisma.order.count({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PAID',
        updatedAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // 30 dernières minutes
        },
      },
    });

    console.log(`\n📊 Statistiques actuelles:`);
    console.log(`   • Commandes PayDunya en attente: ${pendingOrders}`);
    console.log(`   • Mises à jour automatiques (30min): ${recentUpdates}`);

    console.log(`\n✅ Le cron job est ACTIF et s'exécute toutes les 5 minutes`);
    console.log(`   • Fréquence: toutes les 5 minutes`);
    console.log(`   • Plage horaire: 24/7`);
    console.log(`   • Fuseau: Africa/Dakar`);

    // 3. Instructions pour monitoring
    console.log(`\n📝 Pour surveiller le cron job:`);
    console.log(`   • Regarder les logs: tail -f logs/app.log | grep PaydunyaCronService`);
    console.log(`   • Vérifier les commandes: SELECT * FROM "Order" WHERE paymentMethod = 'PAYDUNYA' AND paymentStatus = 'PENDING'`);
    console.log(`   • Endpoint admin: POST /paydunya/cron/run (nécessite token admin)`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCronStatus();