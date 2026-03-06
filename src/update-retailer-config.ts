/**
 * Script pour mettre à jour les credentials du compte retailer Orange Money
 * Exécution: npx ts-node src/update-retailer-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRetailerConfig() {
  console.log('🔧 Mise à jour de la configuration retailer Orange Money...\n');

  try {
    // Récupérer la config actuelle
    const currentConfig = await prisma.paymentConfig.findUnique({
      where: { provider: 'ORANGE_MONEY' },
    });

    if (!currentConfig) {
      console.error('❌ Aucune configuration Orange Money trouvée dans la base de données');
      console.log('\nCréez d\'abord une config Orange Money dans la table PaymentConfig');
      process.exit(1);
    }

    console.log('📊 Configuration actuelle :');
    console.log(`   Provider: ${currentConfig.provider}`);
    console.log(`   Mode actif: ${currentConfig.activeMode}`);
    console.log(`   Est actif: ${currentConfig.isActive}`);
    console.log(`   Metadata actuel: ${JSON.stringify(currentConfig.metadata, null, 2)}\n`);

    // Mettre à jour avec vos credentials
    const updatedConfig = await prisma.paymentConfig.update({
      where: { provider: 'ORANGE_MONEY' },
      data: {
        metadata: {
          ...(currentConfig.metadata as object || {}),
          retailerMsisdn: '221775588834',
          testRetailerPin: '6667',
          liveRetailerPin: '6667',
        },
      },
    });

    console.log('✅ Configuration mise à jour avec succès !\n');
    console.log('📊 Nouvelle configuration :');
    console.log(`   Provider: ${updatedConfig.provider}`);
    console.log(`   Mode actif: ${updatedConfig.activeMode}`);
    console.log(`   Metadata mis à jour: ${JSON.stringify(updatedConfig.metadata, null, 2)}\n`);

    console.log('🎉 Configuration appliquée !');
    console.log('\n🧪 Testez maintenant avec :');
    console.log('   curl -X POST http://localhost:3004/orange-money/cashin \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"amount": 100, "customerPhone": "221771234567", "customerName": "Test", "description": "Test"}\'');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateRetailerConfig();
