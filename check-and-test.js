const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndTest() {
  console.log('🔍 Recherche d\'une commande existante...\n');

  // Chercher une commande récente
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      paymentMethod: true,
      transactionId: true,
      totalAmount: true,
    }
  });

  if (!order) {
    console.log('❌ Aucune commande trouvée dans la base');
    console.log('   → Créez une commande via l\'interface frontend pour tester');
    return;
  }

  console.log('✅ Commande trouvée:');
  console.log(`   - Order Number: ${order.orderNumber}`);
  console.log(`   - Payment Status: ${order.paymentStatus}`);
  console.log(`   - Payment Method: ${order.paymentMethod}`);
  console.log(`   - Transaction ID: ${order.transactionId || 'null'}`);
  console.log(`   - Amount: ${order.totalAmount} FCFA`);
  console.log('');

  // Tester le callback sur cette commande
  const axios = require('axios');

  console.log('📞 Test du callback SUCCESS sur cette commande...\n');

  try {
    const response = await axios.post('http://localhost:3004/orange-money/callback', {
      status: 'SUCCESS',
      transactionId: `TXN-TEST-${Date.now()}`,
      amount: {
        unit: 'XOF',
        value: order.totalAmount
      },
      code: 'PRINTALMA001',
      reference: `OM-${order.orderNumber}-${Date.now()}`,
      metadata: {
        orderId: order.id.toString(),
        orderNumber: order.orderNumber,
        customerName: 'Test Client'
      }
    });

    console.log('✅ Callback envoyé avec succès');
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    console.log('');

    // Vérifier le nouveau statut
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        paymentStatus: true,
        transactionId: true,
      }
    });

    console.log('📊 Statut après callback:');
    console.log(`   - Payment Status: ${updatedOrder.paymentStatus}`);
    console.log(`   - Transaction ID: ${updatedOrder.transactionId}`);
    console.log('');

    if (updatedOrder.paymentStatus === 'PAID') {
      console.log('✅ SUCCESS: Le callback a bien mis à jour la commande en PAID');

      // Tester la redirection
      const statusResponse = await axios.get(`http://localhost:3004/orange-money/payment-status/${order.orderNumber}`);

      console.log('');
      console.log('📍 Test de redirection:');
      console.log(JSON.stringify(statusResponse.data, null, 2));

      if (statusResponse.data.shouldRedirect) {
        console.log('');
        console.log('✅ REDIRECTION: shouldRedirect = true');
        console.log(`   → URL: ${statusResponse.data.redirectUrl}`);
      } else {
        console.log('');
        console.log('❌ ERREUR: shouldRedirect devrait être true');
      }
    } else {
      console.log(`❌ ERREUR: PaymentStatus = ${updatedOrder.paymentStatus} (devrait être PAID)`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }

  await prisma.$disconnect();
}

checkAndTest().catch(console.error);
