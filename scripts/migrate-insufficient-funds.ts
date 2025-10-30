import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de migration pour mettre à jour les commandes existantes
 * avec des fonds insuffisants dans les notes mais pas dans les nouveaux champs
 */
async function migrateInsufficientFundsOrders() {
  console.log('🔄 Début de la migration des commandes avec fonds insuffisants...\n');

  try {
    // Trouver toutes les commandes avec "INSUFFICIENT FUNDS" dans les notes
    const ordersWithInsufficientFunds = await prisma.order.findMany({
      where: {
        OR: [
          {
            notes: {
              contains: 'INSUFFICIENT FUNDS',
            },
          },
          {
            notes: {
              contains: 'insufficient_funds',
            },
          },
          {
            notes: {
              contains: 'Fonds insuffisants',
            },
          },
        ],
        // Et qui n'ont pas encore le flag
        hasInsufficientFunds: false,
      },
      select: {
        id: true,
        orderNumber: true,
        notes: true,
        paymentStatus: true,
      },
    });

    console.log(`✅ Trouvé ${ordersWithInsufficientFunds.length} commande(s) à migrer\n`);

    if (ordersWithInsufficientFunds.length === 0) {
      console.log('✅ Aucune commande à migrer. Terminé !');
      return;
    }

    let migratedCount = 0;

    for (const order of ordersWithInsufficientFunds) {
      console.log(`\n📦 Migration de la commande ${order.orderNumber}...`);

      try {
        // Extraire la raison d'échec des notes si possible
        let failureReason = 'insufficient_funds';
        if (order.notes) {
          const reasonMatch = order.notes.match(/"reason"\s*:\s*"([^"]+)"/);
          if (reasonMatch) {
            failureReason = reasonMatch[1];
          }
        }

        // Mettre à jour la commande
        await prisma.order.update({
          where: { id: order.id },
          data: {
            hasInsufficientFunds: true,
            lastPaymentFailureReason: failureReason,
            lastPaymentAttemptAt: new Date(), // Date actuelle comme fallback
            paymentAttempts: 1, // Au moins 1 tentative puisqu'il y a eu un échec
          },
        });

        // Créer un PaymentAttempt rétroactif basé sur les notes
        let amount = 0;
        let errorCode = null;
        let errorMessage = null;

        if (order.notes) {
          // Essayer d'extraire des informations des notes
          const codeMatch = order.notes.match(/"code"\s*:\s*"([^"]+)"/);
          const messageMatch = order.notes.match(/"message"\s*:\s*"([^"]+)"/);

          if (codeMatch) errorCode = codeMatch[1];
          if (messageMatch) errorMessage = messageMatch[1];
        }

        // Créer le PaymentAttempt
        await prisma.paymentAttempt.create({
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: amount, // On ne peut pas récupérer l'amount des notes
            currency: 'XOF',
            status: 'FAILED',
            failureReason: failureReason,
            failureCategory: 'insufficient_funds',
            failureCode: errorCode,
            failureMessage: errorMessage,
            attemptNumber: 1,
            isRetry: false,
            attemptedAt: new Date(),
            failedAt: new Date(),
          },
        });

        console.log(`   ✅ Commande ${order.orderNumber} migrée avec succès`);
        console.log(`      - hasInsufficientFunds: true`);
        console.log(`      - PaymentAttempt créé`);
        migratedCount++;
      } catch (error) {
        console.error(`   ❌ Erreur lors de la migration de ${order.orderNumber}:`, error.message);
      }
    }

    console.log(`\n✅ Migration terminée !`);
    console.log(`   Total: ${ordersWithInsufficientFunds.length} commande(s) trouvée(s)`);
    console.log(`   Migrées: ${migratedCount} commande(s)`);
    console.log(`   Échecs: ${ordersWithInsufficientFunds.length - migratedCount} commande(s)\n`);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
migrateInsufficientFundsOrders()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
