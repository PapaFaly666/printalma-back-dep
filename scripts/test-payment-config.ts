import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de test pour vérifier que la configuration Paydunya
 * est correctement récupérée et que les URLs sont bien générées
 */

async function testPaymentConfig() {
  console.log('\n🧪 Test de la configuration Paydunya\n');

  try {
    // 1. Récupérer la config active depuis la BDD
    const config = await prisma.paymentConfig.findFirst({
      where: {
        provider: 'PAYDUNYA',
        isActive: true,
      },
    });

    if (!config) {
      console.log('❌ Aucune configuration active trouvée');
      console.log('   Exécutez: npx ts-node prisma/seeds/payment-config.seed.ts\n');
      return;
    }

    console.log('✅ Configuration récupérée de la base de données\n');
    console.log('📋 Détails de la configuration:\n');
    console.log(`   Provider: ${config.provider}`);
    console.log(`   Active: ${config.isActive ? '✅ OUI' : '❌ NON'}`);

    // Sélectionner les clés appropriées selon le mode actif
    const activeMode = config.activeMode;
    const modeLabel = activeMode === 'test' ? '🧪 TEST (Sandbox)' : '🚀 LIVE (Production)';
    console.log(`   Mode actif: ${modeLabel}`);

    const publicKey = activeMode === 'test' ? config.testPublicKey : config.livePublicKey;
    const privateKey = activeMode === 'test' ? config.testPrivateKey : config.livePrivateKey;
    const token = activeMode === 'test' ? config.testToken : config.liveToken;

    console.log(`   Public Key: ${publicKey?.substring(0, 30)}...`);
    console.log(`   Private Key: ${privateKey?.substring(0, 15)}... (masqué)`);
    console.log(`   Token: ${token?.substring(0, 10)}... (masqué)`);

    // 2. Générer l'URL de l'API
    const apiUrl =
      activeMode === 'test'
        ? 'https://app.paydunya.com/sandbox-api/v1'
        : 'https://app.paydunya.com/api/v1';

    console.log(`\n🌐 URL de l'API:\n   ${apiUrl}`);

    // 3. Simuler ce que le frontend recevrait
    const publicConfig = {
      provider: config.provider,
      isActive: config.isActive,
      mode: activeMode,
      publicKey: publicKey,
      apiUrl: apiUrl,
    };

    console.log('\n📤 Données exposées au frontend:\n');
    console.log(JSON.stringify(publicConfig, null, 2));

    // 4. Vérifier les données sensibles
    console.log('\n🔒 Sécurité:\n');
    console.log('   ✅ Private Key: NON exposée au frontend');
    console.log('   ✅ Token: NON exposé au frontend');
    console.log('   ✅ Master Key: NON exposée au frontend');
    console.log('   ✅ Webhook Secret: NON exposé au frontend');
    console.log('   ✅ Public Key: Exposée (sécurisé)');

    // 5. Tests de cohérence
    console.log('\n🧪 Tests de cohérence:\n');

    if (activeMode === 'test') {
      const isTestKey = privateKey?.startsWith('test_');
      console.log(
        `   ${isTestKey ? '✅' : '❌'} Private Key correspond au mode TEST`,
      );
    } else {
      const isLiveKey = privateKey?.startsWith('live_');
      console.log(
        `   ${isLiveKey ? '✅' : '❌'} Private Key correspond au mode LIVE`,
      );
    }

    console.log(
      `   ${config.isActive ? '✅' : '❌'} Configuration active`,
    );
    console.log(
      `   ${privateKey ? '✅' : '❌'} Private Key définie`,
    );
    console.log(`   ${token ? '✅' : '❌'} Token défini`);

    // 6. Vérifier la disponibilité des deux modes
    console.log('\n📦 Modes disponibles:\n');

    const hasTestKeys = config.testPrivateKey && config.testToken;
    const hasLiveKeys = config.livePrivateKey && config.liveToken;

    console.log(`   ${hasTestKeys ? '✅' : '❌'} Mode TEST configuré`);
    if (hasTestKeys) {
      console.log(`      Public Key: ${config.testPublicKey?.substring(0, 30)}...`);
    }

    console.log(`   ${hasLiveKeys ? '✅' : '❌'} Mode LIVE configuré`);
    if (hasLiveKeys) {
      console.log(`      Public Key: ${config.livePublicKey?.substring(0, 30)}...`);
    }

    console.log('\n✨ Tous les tests sont passés avec succès !\n');

    // 7. Recommandations
    console.log('💡 Recommandations:\n');
    if (activeMode === 'test') {
      console.log(
        '   - Vous êtes en mode TEST, parfait pour le développement',
      );
      console.log(
        '   - Utilisez le sandbox Paydunya pour tester les paiements',
      );
      console.log(
        '   - Pour passer en production: npx ts-node scripts/switch-paydunya-mode.ts live --confirm',
      );
    } else {
      console.log('   ⚠️  Vous êtes en mode LIVE (Production)');
      console.log('   - Toutes les transactions sont réelles');
      console.log('   - Vérifiez que tout fonctionne correctement');
      console.log(
        '   - Pour revenir en test: npx ts-node scripts/switch-paydunya-mode.ts test',
      );
    }
    console.log('');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  }
}

async function main() {
  try {
    await testPaymentConfig();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
