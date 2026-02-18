import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initialise la configuration Paydunya avec les clés TEST et LIVE
 * Un seul enregistrement contient les deux configurations
 */
async function seedPaymentConfig() {
  console.log('🔧 Initialisation de la configuration Paydunya...\n');

  try {
    const config = await prisma.paymentConfig.upsert({
      where: { provider: 'paydunya' },
      update: {
        isActive: true,
        activeMode: 'test',
        // Clés TEST
        testPrivateKey: 'test_private_uImFqxfqokHqbqHI4PXJ24huucO',
        testPublicKey: 'test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt',
        testToken: 'BuVS3uuAKsg9bYyGcT9B',
        testMasterKey: null,
        // Clés LIVE
        livePrivateKey: 'live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG',
        livePublicKey: 'live_public_JzyUBGQTafgpOPqRulSDGDVfHzz',
        liveToken: 'lt8YNn0GPW6DTIWcCZ8f',
        liveMasterKey: null,
        // Métadonnées
        webhookSecret: null,
        metadata: {
          description: 'Configuration Paydunya complète (TEST + LIVE)',
          testApiUrl: 'https://app.paydunya.com/sandbox-api/v1',
          liveApiUrl: 'https://app.paydunya.com/api/v1',
          createdBy: 'seed',
        },
      },
      create: {
        provider: 'paydunya',
        isActive: true,
        activeMode: 'test',
        // Clés TEST
        testPrivateKey: 'test_private_uImFqxfqokHqbqHI4PXJ24huucO',
        testPublicKey: 'test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt',
        testToken: 'BuVS3uuAKsg9bYyGcT9B',
        testMasterKey: null,
        // Clés LIVE
        livePrivateKey: 'live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG',
        livePublicKey: 'live_public_JzyUBGQTafgpOPqRulSDGDVfHzz',
        liveToken: 'lt8YNn0GPW6DTIWcCZ8f',
        liveMasterKey: null,
        // Métadonnées
        webhookSecret: null,
        metadata: {
          description: 'Configuration Paydunya complète (TEST + LIVE)',
          testApiUrl: 'https://app.paydunya.com/sandbox-api/v1',
          liveApiUrl: 'https://app.paydunya.com/api/v1',
          createdBy: 'seed',
        },
      },
    });

    console.log('✅ Configuration Paydunya créée/mise à jour\n');

    console.log('📋 Mode TEST:');
    console.log(`   Public Key:  ${config.testPublicKey?.substring(0, 30)}...`);
    console.log(`   Private Key: ${config.testPrivateKey?.substring(0, 20)}... (masqué)`);
    console.log(`   Token:       ${config.testToken?.substring(0, 15)}... (masqué)`);
    console.log(`   API URL:     https://app.paydunya.com/sandbox-api/v1\n`);

    console.log('📋 Mode LIVE:');
    console.log(`   Public Key:  ${config.livePublicKey?.substring(0, 30)}...`);
    console.log(`   Private Key: ${config.livePrivateKey?.substring(0, 20)}... (masqué)`);
    console.log(`   Token:       ${config.liveToken?.substring(0, 15)}... (masqué)`);
    console.log(`   API URL:     https://app.paydunya.com/api/v1\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 Configuration Paydunya initialisée !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Mode actuel:  ${config.activeMode === 'test' ? '🧪 TEST (Sandbox)' : '🚀 LIVE (Production)'}`);
    console.log(`État:         ${config.isActive ? '✅ Actif' : '❌ Inactif'}\n`);

    console.log('🔄 Pour basculer en PRODUCTION:');
    console.log('   Méthode 1 - Script:');
    console.log('   $ npx ts-node scripts/switch-paydunya-mode.ts live --confirm\n');

    console.log('   Méthode 2 - API:');
    console.log('   POST /admin/payment-config/paydunya/switch');
    console.log('   Body: { "mode": "live" }\n');

    console.log('✨ Configuration terminée avec succès !\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPaymentConfig();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
