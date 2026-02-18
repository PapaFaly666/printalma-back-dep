/**
 * Script pour configurer PayDunya en base de données
 * Ce script insère ou met à jour la configuration PayDunya avec les clés TEST et LIVE
 *
 * Usage:
 *   npx ts-node scripts/setup-paydunya-config.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

async function setupPaydunyaConfig() {
  console.log('🔧 Configuration de PayDunya en base de données...\n');

  try {
    // Vérifier si une config existe déjà
    const existingConfig = await prisma.paymentConfig.findUnique({
      where: { provider: 'PAYDUNYA' },
    });

    // Récupérer les clés depuis .env
    const testMasterKey = process.env.PAYDUNYA_MASTER_KEY;
    const testPrivateKey = process.env.PAYDUNYA_PRIVATE_KEY;
    const testPublicKey = process.env.PAYDUNYA_PUBLIC_KEY;
    const testToken = process.env.PAYDUNYA_TOKEN;

    // Clés LIVE (actuellement commentées dans .env)
    // const liveMasterKey = process.env.PAYDUNYA_MASTER_KEY; // Identique pour test et live
    // const livePrivateKey = 'live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG';
    // const livePublicKey = 'live_public_JzyUBGQTafgpOPqRulSDGDVfHzz';
    // const liveToken = 'lt8YNn0GPW6DTIWcCZ8f';

    // Vérifier que les clés TEST sont présentes
    if (!testPrivateKey || !testToken) {
      console.error('❌ Erreur: Les clés PayDunya TEST ne sont pas définies dans .env');
      console.error('   Vérifiez PAYDUNYA_PRIVATE_KEY et PAYDUNYA_TOKEN');
      process.exit(1);
    }

    if (existingConfig) {
      // Mise à jour de la configuration existante
      console.log('📝 Configuration existante trouvée, mise à jour...');

      const updated = await prisma.paymentConfig.update({
        where: { provider: 'PAYDUNYA' },
        data: {
          isActive: true,
          activeMode: 'test', // Mode par défaut

          // Clés TEST
          testMasterKey,
          testPrivateKey,
          testToken,
          testPublicKey,

          // Clés LIVE (à décommenter quand vous êtes prêt pour la production)
          // liveMasterKey: testMasterKey, // Même clé pour test et live
          // livePrivateKey: 'live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG',
          // livePublicKey: 'live_public_JzyUBGQTafgpOPqRulSDGDVfHzz',
          // liveToken: 'lt8YNn0GPW6DTIWcCZ8f',

          metadata: {},
        },
      });

      console.log('✅ Configuration PayDunya mise à jour avec succès!\n');
      console.log('📊 Détails de la configuration:');
      console.log(`   Provider: ${updated.provider}`);
      console.log(`   Active: ${updated.isActive ? 'Oui' : 'Non'}`);
      console.log(`   Mode actif: ${updated.activeMode.toUpperCase()}`);
      console.log(`   Master Key: ${maskKey(updated.testMasterKey)}`);
      console.log(`   Private Key (TEST): ${maskKey(updated.testPrivateKey)}`);
      console.log(`   Token (TEST): ${maskKey(updated.testToken)}`);
      console.log(`   Public Key (TEST): ${maskKey(updated.testPublicKey)}`);

    } else {
      // Création d'une nouvelle configuration
      console.log('🆕 Création d\'une nouvelle configuration...');

      const created = await prisma.paymentConfig.create({
        data: {
          provider: 'PAYDUNYA',
          isActive: true,
          activeMode: 'test', // Mode par défaut

          // Clés TEST
          testMasterKey,
          testPrivateKey,
          testToken,
          testPublicKey,

          // Clés LIVE (à décommenter quand vous êtes prêt pour la production)
          // liveMasterKey: testMasterKey, // Même clé pour test et live
          // livePrivateKey: 'live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG',
          // livePublicKey: 'live_public_JzyUBGQTafgpOPqRulSDGDVfHzz',
          // liveToken: 'lt8YNn0GPW6DTIWcCZ8f',

          metadata: {},
        },
      });

      console.log('✅ Configuration PayDunya créée avec succès!\n');
      console.log('📊 Détails de la configuration:');
      console.log(`   Provider: ${created.provider}`);
      console.log(`   Active: ${created.isActive ? 'Oui' : 'Non'}`);
      console.log(`   Mode actif: ${created.activeMode.toUpperCase()}`);
      console.log(`   Master Key: ${maskKey(created.testMasterKey)}`);
      console.log(`   Private Key (TEST): ${maskKey(created.testPrivateKey)}`);
      console.log(`   Token (TEST): ${maskKey(created.testToken)}`);
      console.log(`   Public Key (TEST): ${maskKey(created.testPublicKey)}`);
    }

    console.log('\n💡 Notes importantes:');
    console.log('   - Le mode actif est TEST (sandbox)');
    console.log('   - Les clés LIVE sont commentées dans le script');
    console.log('   - Pour passer en production, décommentez les clés LIVE et basculez le mode');
    console.log('   - Le système utilisera maintenant les clés de la BDD au lieu du .env');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Masque une clé pour l'affichage sécurisé
 */
function maskKey(key: string | null): string {
  if (!key) return 'non configuré';
  if (key.length < 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// Exécuter le script
setupPaydunyaConfig()
  .then(() => {
    console.log('\n✨ Configuration terminée!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
