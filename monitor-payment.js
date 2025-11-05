#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const ORDER_ID = 87;
const CHECK_INTERVAL = 5000; // 5 secondes
const MAX_DURATION = 300000; // 5 minutes

let previousStatus = null;
let checkCount = 0;
const startTime = Date.now();

console.log('🔍 SURVEILLANCE DU PAIEMENT PAYDUNYA');
console.log('=' .repeat(60));
console.log(`Commande ID: ${ORDER_ID}`);
console.log(`Intervalle de vérification: ${CHECK_INTERVAL / 1000}s`);
console.log(`Durée maximale: ${MAX_DURATION / 1000}s`);
console.log('=' .repeat(60));
console.log('\nEn attente du paiement...\n');
console.log('💡 Effectuez le paiement maintenant dans votre navigateur');
console.log('   Appuyez sur Ctrl+C pour arrêter la surveillance\n');

async function checkPaymentStatus() {
  try {
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        transactionId: true,
        paymentAttempts: true,
        lastPaymentAttemptAt: true,
        updatedAt: true,
      }
    });

    if (!order) {
      console.log('❌ Commande non trouvée');
      return false;
    }

    checkCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // Afficher uniquement si le statut change
    if (!previousStatus ||
        previousStatus.paymentStatus !== order.paymentStatus ||
        previousStatus.status !== order.status) {

      const timestamp = new Date().toLocaleTimeString('fr-FR');
      console.log(`[${timestamp}] Check #${checkCount} (${elapsed}s écoulées)`);
      console.log('─'.repeat(60));
      console.log(`  📦 Numéro: ${order.orderNumber}`);
      console.log(`  📊 Statut commande: ${order.status}`);
      console.log(`  💳 Statut paiement: ${order.paymentStatus}`);
      console.log(`  🔢 Tentatives: ${order.paymentAttempts}`);
      console.log(`  🔑 Transaction: ${order.transactionId || 'N/A'}`);
      console.log('─'.repeat(60));

      // Détecter les changements importants
      if (previousStatus) {
        if (previousStatus.paymentStatus !== order.paymentStatus) {
          console.log(`\n🔔 CHANGEMENT DE STATUT DE PAIEMENT:`);
          console.log(`   ${previousStatus.paymentStatus} → ${order.paymentStatus}`);
        }
        if (previousStatus.status !== order.status) {
          console.log(`\n🔔 CHANGEMENT DE STATUT DE COMMANDE:`);
          console.log(`   ${previousStatus.status} → ${order.status}`);
        }
      }

      // Vérifier si le paiement est terminé
      if (order.paymentStatus === 'PAID') {
        console.log('\n✅ PAIEMENT CONFIRMÉ !');
        console.log('=' .repeat(60));
        console.log('Le webhook a été reçu et traité avec succès.');
        console.log(`Transaction ID: ${order.transactionId}`);
        console.log(`Temps écoulé: ${elapsed} secondes`);
        console.log('=' .repeat(60));
        return true; // Arrêter la surveillance
      }

      if (order.paymentStatus === 'FAILED') {
        console.log('\n❌ PAIEMENT ÉCHOUÉ');
        console.log('=' .repeat(60));
        console.log('Le paiement a échoué. Vérifiez les logs pour plus de détails.');
        console.log(`Tentatives: ${order.paymentAttempts}`);
        console.log('=' .repeat(60));
        return true; // Arrêter la surveillance
      }

      previousStatus = { ...order };
      console.log('');
    }

    // Vérifier la durée maximale
    if (Date.now() - startTime > MAX_DURATION) {
      console.log('\n⏱️  TIMEOUT: Durée maximale de surveillance atteinte');
      console.log('Le paiement n\'a pas été complété dans les 5 minutes.');
      console.log('Vous pouvez relancer la surveillance ou vérifier manuellement.');
      return true;
    }

    return false; // Continuer la surveillance

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return true; // Arrêter en cas d'erreur
  }
}

// Fonction principale de surveillance
async function monitor() {
  const shouldStop = await checkPaymentStatus();

  if (shouldStop) {
    await prisma.$disconnect();
    process.exit(0);
  } else {
    setTimeout(monitor, CHECK_INTERVAL);
  }
}

// Gérer Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Surveillance arrêtée par l\'utilisateur');
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrer la surveillance
monitor().catch(async (error) => {
  console.error('Erreur fatale:', error);
  await prisma.$disconnect();
  process.exit(1);
});
