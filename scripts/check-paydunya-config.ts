/**
 * Script pour vérifier la configuration PayDunya en base de données
 *
 * Usage:
 *   npx ts-node scripts/check-paydunya-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaydunyaConfig() {
  console.log('🔍 Vérification de la configuration PayDunya...\n');

  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'PAYDUNYA' },
    });

    if (!config) {
      console.log('❌ Aucune configuration PayDunya trouvée en base de données');
      console.log('💡 Exécutez: npx ts-node scripts/setup-paydunya-config.ts');
      return;
    }

    console.log('✅ Configuration PayDunya trouvée!\n');
    console.log('📊 Détails:');
    console.log(`   ID: ${config.id}`);
    console.log(`   Provider: ${config.provider}`);
    console.log(`   Active: ${config.isActive ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Mode actif: ${config.activeMode.toUpperCase()}`);
    console.log('');

    console.log('🔑 Clés TEST:');
    console.log(`   Master Key: ${maskKey(config.testMasterKey)}`);
    console.log(`   Private Key: ${maskKey(config.testPrivateKey)}`);
    console.log(`   Token: ${maskKey(config.testToken)}`);
    console.log(`   Public Key: ${maskKey(config.testPublicKey)}`);
    console.log('');

    console.log('🔑 Clés LIVE:');
    console.log(`   Master Key: ${maskKey(config.liveMasterKey)}`);
    console.log(`   Private Key: ${maskKey(config.livePrivateKey)}`);
    console.log(`   Token: ${maskKey(config.liveToken)}`);
    console.log(`   Public Key: ${maskKey(config.livePublicKey)}`);
    console.log('');

    // Vérifier que les clés du mode actif sont présentes
    const activeKeys = config.activeMode === 'test'
      ? {
          masterKey: config.testMasterKey,
          privateKey: config.testPrivateKey,
          token: config.testToken,
        }
      : {
          masterKey: config.liveMasterKey,
          privateKey: config.livePrivateKey,
          token: config.liveToken,
        };

    const hasRequiredKeys = activeKeys.privateKey && activeKeys.token;

    console.log('🎯 État du mode actif (' + config.activeMode.toUpperCase() + '):');
    if (hasRequiredKeys) {
      console.log('   ✅ Toutes les clés requises sont configurées');
      console.log('   ✅ Le système peut utiliser PayDunya');
    } else {
      console.log('   ❌ Clés manquantes pour le mode actif');
      console.log('   ❌ PayDunya ne fonctionnera pas correctement');
    }

    console.log('');
    console.log('📅 Timestamps:');
    console.log(`   Créé le: ${config.createdAt.toLocaleString('fr-FR')}`);
    console.log(`   Mis à jour le: ${config.updatedAt.toLocaleString('fr-FR')}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function maskKey(key: string | null): string {
  if (!key) return '❌ Non configuré';
  if (key.length < 8) return '****';
  return `✅ ${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

checkPaydunyaConfig();
