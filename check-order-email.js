/**
 * Script pour vérifier si une commande a un email
 * Usage: node check-order-email.js <ORDER_NUMBER>
 * Exemple: node check-order-email.js ORD-1234567890
 */

const { PrismaClient } = require('./generated/prisma/client');
const prisma = new PrismaClient();

async function checkOrderEmail(orderNumber) {
  try {
    console.log(`\n🔍 Recherche de la commande ${orderNumber}...\n`);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        email: true,
        phoneNumber: true,
        shippingName: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            productId: true,
            vendorProductId: true,
            mockupUrl: true,
            product: {
              select: {
                name: true,
              }
            },
            vendorProduct: {
              select: {
                name: true,
                finalImageUrl: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      console.error(`❌ Commande ${orderNumber} introuvable`);
      process.exit(1);
    }

    console.log('📦 Informations de la commande:');
    console.log('  • ID:', order.id);
    console.log('  • Numéro:', order.orderNumber);
    console.log('  • Email:', order.email || '❌ AUCUN EMAIL');
    console.log('  • Téléphone:', order.phoneNumber);
    console.log('  • Nom:', order.shippingName);
    console.log('  • Statut paiement:', order.paymentStatus);
    console.log('  • Montant total:', order.totalAmount, 'FCFA');
    console.log('  • Date:', order.createdAt);
    console.log('  • Nombre d\'articles:', order.orderItems.length);

    console.log('\n📸 Images des produits:');
    order.orderItems.forEach((item, index) => {
      console.log(`\n  Article ${index + 1}:`);
      if (item.vendorProductId) {
        console.log('    Type: Produit vendeur');
        console.log('    Nom:', item.vendorProduct?.name || 'N/A');
        console.log('    Image (finalImageUrl):', item.vendorProduct?.finalImageUrl || '❌ AUCUNE');
      } else {
        console.log('    Type: Produit normal');
        console.log('    Nom:', item.product?.name || 'N/A');
        console.log('    Image (mockupUrl):', item.mockupUrl || '❌ AUCUNE');
      }
    });

    if (!order.email) {
      console.log('\n⚠️  PROBLÈME: Cette commande n\'a pas d\'email !');
      console.log('   L\'email ne peut pas être envoyé.');
      console.log('\n💡 Solution:');
      console.log('   1. Assurez-vous que le champ "email" est fourni lors de la création de commande');
      console.log('   2. Vérifiez le payload envoyé depuis ModernOrderFormPage');
    } else {
      console.log(`\n✅ Cette commande a un email: ${order.email}`);
      console.log('   Vous pouvez tester l\'envoi avec:');
      console.log(`   node test-send-email-order.js ${orderNumber}`);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer le numéro de commande depuis les arguments
const orderNumber = process.argv[2];

if (!orderNumber) {
  console.error('❌ Usage: node check-order-email.js <ORDER_NUMBER>');
  console.error('   Exemple: node check-order-email.js ORD-1234567890');
  process.exit(1);
}

checkOrderEmail(orderNumber);
