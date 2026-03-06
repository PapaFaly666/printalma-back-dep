/**
 * Script pour vérifier le statut de paiement d'une commande
 * Usage: node check-payment-status.js <ORDER_NUMBER>
 */

const { PrismaClient } = require('./generated/prisma/client');
const prisma = new PrismaClient();

async function checkPaymentStatus(orderNumber) {
  try {
    console.log(`\n🔍 Vérification du statut de paiement pour ${orderNumber}...\n`);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        paymentStatus: true,
        paymentMethod: true,
        transactionId: true,
        paymentUrl: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!order) {
      console.error(`❌ Commande ${orderNumber} introuvable`);
      process.exit(1);
    }

    console.log('📦 Informations de la commande:');
    console.log('  • Numéro:', order.orderNumber);
    console.log('  • Email:', order.email || '❌ AUCUN EMAIL');
    console.log('  • Statut de paiement:', order.paymentStatus);
    console.log('  • Méthode de paiement:', order.paymentMethod || 'N/A');
    console.log('  • Transaction ID:', order.transactionId || 'N/A');
    console.log('  • URL de paiement:', order.paymentUrl || 'N/A');
    console.log('  • Montant:', order.totalAmount, 'FCFA');
    console.log('  • Créée le:', order.createdAt);
    console.log('  • Mise à jour le:', order.updatedAt);

    console.log('\n📊 Diagnostic:');

    if (!order.email) {
      console.log('❌ PROBLÈME: Pas d\'email - L\'email ne pourra pas être envoyé');
    } else {
      console.log('✅ Email présent:', order.email);
    }

    if (order.paymentStatus === 'PAID') {
      console.log('✅ Statut de paiement: PAID');
      console.log('   👉 L\'email devrait avoir été envoyé automatiquement');
      console.log('   💡 Vérifiez les logs du serveur pour voir si l\'email a été envoyé');
    } else if (order.paymentStatus === 'PENDING') {
      console.log('⚠️  Statut de paiement: PENDING');
      console.log('   👉 L\'email NE SERA PAS envoyé tant que le statut n\'est pas PAID');
      console.log('\n💡 Actions à faire:');
      console.log('   1. Vérifier que le webhook de paiement fonctionne');
      console.log('   2. Vérifier que le webhook appelle updatePaymentStatus()');
      console.log('   3. Ou mettre à jour manuellement le statut avec:');
      console.log(`      curl -X PATCH http://localhost:3004/orders/${orderNumber}/payment-status \\`);
      console.log(`        -H "Content-Type: application/json" \\`);
      console.log(`        -d '{"paymentStatus": "PAID", "transactionId": "${order.transactionId || 'manual'}"}'`);
    } else {
      console.log(`⚠️  Statut de paiement: ${order.paymentStatus}`);
      console.log('   👉 L\'email ne sera pas envoyé avec ce statut');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const orderNumber = process.argv[2];
if (!orderNumber) {
  console.error('❌ Usage: node check-payment-status.js <ORDER_NUMBER>');
  console.error('   Exemple: node check-payment-status.js ORD-1234567890');
  process.exit(1);
}

checkPaymentStatus(orderNumber);
