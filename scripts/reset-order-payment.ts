import { PrismaClient } from '@prisma/client';

/**
 * Script pour permettre à un utilisateur de réessayer un paiement
 * en créant un nouveau token PayDunya pour une commande existante
 *
 * Usage:
 *   npx ts-node scripts/reset-order-payment.ts <orderNumber>
 */

const prisma = new PrismaClient();

async function resetOrderPayment(orderNumber: string) {
  console.log(`🔄 Réinitialisation du paiement pour la commande: ${orderNumber}\n`);

  try {
    // 1. Trouver la commande
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        paymentAttemptsHistory: {
          orderBy: { attemptedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!order) {
      console.error(`❌ Commande non trouvée: ${orderNumber}`);
      process.exit(1);
    }

    console.log(`📦 Commande trouvée:`);
    console.log(`   Numéro: ${order.orderNumber}`);
    console.log(`   Statut: ${order.status}`);
    console.log(`   Paiement: ${order.paymentStatus}`);
    console.log(`   Méthode: ${order.paymentMethod}`);
    console.log(`   Montant: ${order.totalAmount} FCFA`);
    console.log(`   Email: ${order.email}`);
    console.log(`   Token actuel: ${order.transactionId || 'Aucun'}`);
    console.log(`   Tentatives: ${order.paymentAttempts}`);
    console.log();

    // 2. Afficher l'historique des tentatives
    if (order.paymentAttemptsHistory.length > 0) {
      console.log(`📊 Historique des tentatives (${order.paymentAttemptsHistory.length}):`);
      order.paymentAttemptsHistory.forEach((attempt, index) => {
        console.log(`   ${index + 1}. ${attempt.status} - ${attempt.paytechToken || 'No token'} - ${attempt.attemptedAt.toISOString()}`);
        if (attempt.failureReason) {
          console.log(`      ↳ Raison: ${attempt.failureReason} (${attempt.failureCategory})`);
        }
      });
      console.log();
    }

    // 3. Vérifier si on peut réessayer
    if (order.paymentStatus === 'PAID') {
      console.log(`✅ Cette commande est déjà payée. Aucune action nécessaire.`);
      process.exit(0);
    }

    if (order.paymentMethod !== 'PAYDUNYA') {
      console.log(`❌ Cette commande n'utilise pas PayDunya (méthode: ${order.paymentMethod})`);
      process.exit(1);
    }

    // 4. Proposer les actions possibles
    console.log(`🎯 Actions disponibles:`);
    console.log(`   1. Réinitialiser le token (permet une nouvelle tentative)`);
    console.log(`   2. Marquer comme FAILED définitivement`);
    console.log(`   3. Annuler (aucune action)`);
    console.log();

    // Pour l'instant, on réinitialise automatiquement
    console.log(`🔧 Réinitialisation du token pour permettre un nouveau paiement...`);

    // Supprimer le token actuel pour permettre un nouveau paiement
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        transactionId: null,
        // On garde le statut PENDING pour permettre un retry
        paymentStatus: 'PENDING',
        status: 'PENDING'
      }
    });

    console.log(`✅ Token réinitialisé avec succès!`);
    console.log();
    console.log(`📋 Prochaines étapes:`);
    console.log(`   1. L'utilisateur peut maintenant créer un nouveau paiement`);
    console.log(`   2. Un nouveau token PayDunya sera généré`);
    console.log(`   3. L'utilisateur pourra effectuer le paiement normalement`);
    console.log();
    console.log(`💡 Note: L'ancien token ne peut plus être utilisé (PayDunya refuse les tokens déjà initiés)`);

  } catch (error: any) {
    console.error(`❌ Erreur:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier les arguments
const orderNumber = process.argv[2];

if (!orderNumber) {
  console.error(`❌ Usage: npx ts-node scripts/reset-order-payment.ts <orderNumber>`);
  console.error(`   Example: npx ts-node scripts/reset-order-payment.ts ORD-1771235613689`);
  process.exit(1);
}

resetOrderPayment(orderNumber).catch(console.error);
