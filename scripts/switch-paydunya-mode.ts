import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script utilitaire pour basculer entre TEST et LIVE
 * Usage: npx ts-node scripts/switch-paydunya-mode.ts [test|live|status]
 *
 * Le basculement change simplement le champ activeMode dans l'enregistrement unique
 */

async function switchMode(mode: 'test' | 'live') {
  console.log(`\n🔄 Basculement vers le mode ${mode.toUpperCase()}...\n`);

  try {
    // Récupérer la config existante
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'PAYDUNYA' },
    });

    if (!config) {
      console.log('❌ Configuration Paydunya non trouvée');
      console.log('   Exécutez: npx ts-node prisma/seeds/payment-config.seed.ts\n');
      return;
    }

    // Vérifier que les clés pour le mode cible existent
    const hasKeys = mode === 'test'
      ? config.testPrivateKey && config.testToken
      : config.livePrivateKey && config.liveToken;

    if (!hasKeys) {
      console.log(`❌ Les clés ${mode.toUpperCase()} ne sont pas configurées`);
      console.log('   Configurez-les d\'abord via l\'API admin ou le seed\n');
      return;
    }

    // Basculer le mode actif
    const activated = await prisma.paymentConfig.update({
      where: { provider: 'PAYDUNYA' },
      data: { activeMode: mode },
    });

    const publicKey = mode === 'test' ? activated.testPublicKey : activated.livePublicKey;

    console.log('✅ Basculement réussi !');
    console.log(`   Provider:     ${activated.provider}`);
    console.log(`   Mode:         ${activated.activeMode.toUpperCase()}`);
    console.log(`   État:         ${activated.isActive ? '✅ ACTIF' : '❌ Inactif'}`);
    console.log(`   Public Key:   ${publicKey?.substring(0, 25)}...`);
    console.log(`   Mise à jour:  ${activated.updatedAt}\n`);

    if (mode === 'live') {
      console.log('⚠️  ATTENTION: Vous êtes maintenant en mode PRODUCTION !');
      console.log('   ⚡ Toutes les transactions seront RÉELLES et FACTURÉES');
      console.log('   💰 Les paiements seront effectivement débités');
      console.log('   🔴 URL API: https://app.paydunya.com/api/v1\n');
    } else {
      console.log('✅ Mode TEST activé - Environnement sécurisé');
      console.log('   🧪 Transactions sandbox uniquement');
      console.log('   🎯 Aucun paiement réel');
      console.log('   🟢 URL API: https://app.paydunya.com/sandbox-api/v1\n');
    }
  } catch (error) {
    console.error('❌ Erreur lors du basculement:', error.message);
    throw error;
  }
}

async function showCurrentConfig() {
  console.log('\n📋 Configuration Paydunya:\n');

  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'PAYDUNYA' },
    });

    if (!config) {
      console.log('❌ Aucune configuration trouvée pour Paydunya');
      console.log('   Exécutez: npx ts-node prisma/seeds/payment-config.seed.ts\n');
      return;
    }

    // Afficher les informations du mode actif
    const currentMode = config.activeMode;
    const isTest = currentMode === 'test';
    const activePublicKey = isTest ? config.testPublicKey : config.livePublicKey;
    const activeApiUrl = isTest
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    console.log(`Mode actif: ${currentMode.toUpperCase()} ${isTest ? '🧪' : '🚀'}`);
    console.log(`État:       ${config.isActive ? '✅ Actif' : '❌ Inactif'}`);
    console.log(`Public Key: ${activePublicKey?.substring(0, 30)}...`);
    console.log(`API URL:    ${activeApiUrl}`);
    console.log(`Mis à jour: ${config.updatedAt}\n`);

    // Afficher la disponibilité des deux modes
    console.log('Modes disponibles:\n');

    const hasTestKeys = config.testPrivateKey && config.testToken;
    const hasLiveKeys = config.livePrivateKey && config.liveToken;

    console.log(`${hasTestKeys ? '✅' : '❌'} TEST  ${currentMode === 'test' ? '(ACTIF)' : ''}`);
    if (hasTestKeys) {
      console.log(`   Public Key: ${config.testPublicKey?.substring(0, 30)}...`);
    }

    console.log(`\n${hasLiveKeys ? '✅' : '❌'} LIVE  ${currentMode === 'live' ? '(ACTIF)' : ''}`);
    if (hasLiveKeys) {
      console.log(`   Public Key: ${config.livePublicKey?.substring(0, 30)}...`);
    }

    console.log('');

    if (currentMode === 'live') {
      console.log('⚠️  Mode PRODUCTION ACTIF - Paiements réels\n');
    } else {
      console.log('✅ Mode TEST ACTIF - Environnement sandbox\n');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'status') {
    await showCurrentConfig();
    console.log('Usage:');
    console.log('  npx ts-node scripts/switch-paydunya-mode.ts test    # Basculer en mode TEST');
    console.log('  npx ts-node scripts/switch-paydunya-mode.ts live    # Basculer en mode LIVE');
    console.log('  npx ts-node scripts/switch-paydunya-mode.ts status  # Afficher la config actuelle\n');
    return;
  }

  if (command === 'test' || command === 'live') {
    // Demander confirmation pour le mode LIVE
    if (command === 'live') {
      console.log('\n⚠️  ATTENTION: Vous allez passer en mode PRODUCTION !');
      console.log('   Toutes les transactions seront réelles et facturées.');
      console.log('\n   Pour continuer, relancez avec: --confirm\n');

      if (!args.includes('--confirm')) {
        console.log('❌ Basculement annulé (confirmation requise)\n');
        return;
      }
    }

    await switchMode(command as 'test' | 'live');
  } else {
    console.log(`❌ Commande invalide: ${command}`);
    console.log('   Utilisez: test, live, ou status\n');
  }
}

main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
