/**
 * Script de test pour envoyer manuellement une facture
 * Usage: node test-send-invoice.js ORD-1772467529522
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSendInvoice(orderNumber) {
  try {
    console.log(`🔍 Recherche de la commande ${orderNumber}...`);

    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: true,
            colorVariation: true,
            vendorProduct: true,
          }
        },
        user: true
      }
    });

    if (!order) {
      console.error(`❌ Commande ${orderNumber} introuvable`);
      process.exit(1);
    }

    console.log(`✅ Commande trouvée:`);
    console.log(`   - Numéro: ${order.orderNumber}`);
    console.log(`   - Email: ${order.email || 'AUCUN ❌'}`);
    console.log(`   - Statut paiement: ${order.paymentStatus}`);
    console.log(`   - Montant total: ${order.totalAmount} FCFA`);
    console.log(`   - Nom client: ${order.shippingName || 'N/A'}`);
    console.log(`   - Téléphone: ${order.phoneNumber}`);
    console.log(`   - Articles: ${order.orderItems.length}`);

    if (!order.email) {
      console.error(`\n❌ PROBLÈME: Pas d'email dans cette commande!`);
      console.log(`\n💡 Solution: L'email doit être fourni lors de la création de la commande.`);
      console.log(`   Vérifiez que le formulaire envoie bien le champ "email".`);
      process.exit(1);
    }

    console.log(`\n📧 Email présent: ${order.email}`);
    console.log(`\n🎯 Pour tester l'envoi de facture, vous devez:`);
    console.log(`   1. Vous assurer que le callback PayDunya a été reçu`);
    console.log(`   2. Ou utiliser le endpoint public: PATCH /orders/${orderNumber}/payment-status`);
    console.log(`\n📝 Exemple de requête:`);
    console.log(`curl -X PATCH http://localhost:3004/orders/${orderNumber}/payment-status \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"paymentStatus": "PAID"}'`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const orderNumber = process.argv[2];
if (!orderNumber) {
  console.error('Usage: node test-send-invoice.js <orderNumber>');
  process.exit(1);
}

testSendInvoice(orderNumber);
