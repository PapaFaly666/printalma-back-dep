import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLivePayment() {
  console.log('🧪 Test de création de paiement en mode LIVE\n');

  // Vérifier la configuration
  const config = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  console.log('📋 Configuration actuelle:');
  console.log('   Mode:', config?.activeMode);
  console.log('   Clés LIVE:', config?.liveMasterKey ? 'Configurées ✅' : 'Manquantes ❌');
  console.log('');

  // Récupérer une commande en attente
  const order = await prisma.order.findFirst({
    where: {
      paymentStatus: 'PENDING',
      paymentMethod: 'PAYDUNYA'
    }
  });

  if (!order) {
    console.log('❌ Aucune commande en attente trouvée');
    await prisma.$disconnect();
    return;
  }

  console.log('📦 Commande trouvée:', order.orderNumber);
  console.log('   Montant:', order.totalAmount, 'FCFA');
  console.log('');

  // Simuler la construction de l'URL selon la logique du code
  const mode = config?.activeMode || 'test';
  const baseUrl = mode === 'live'
    ? 'https://paydunya.com/checkout/invoice'
    : 'https://app.paydunya.com/sandbox-checkout/invoice';

  console.log('🔗 URLs qui seront générées:');
  console.log('   Mode:', mode);
  console.log('   Base URL:', baseUrl);
  console.log('   Format final:', `${baseUrl}/{TOKEN}`);
  console.log('');

  if (mode === 'live') {
    console.log('✅ Le système est configuré pour générer des URLs de PRODUCTION');
    console.log('   Exemple: https://paydunya.com/checkout/invoice/abc123xyz');
  } else {
    console.log('⚠️  Le système est toujours en mode TEST');
    console.log('   Exemple: https://app.paydunya.com/sandbox-checkout/invoice/test_abc123');
  }

  await prisma.$disconnect();
}

testLivePayment().catch(console.error);
