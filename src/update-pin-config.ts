/**
 * Script pour mettre à jour le PIN dans la configuration
 * À exécuter UNE FOIS que vous connaissez le bon PIN
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePin() {
  console.log('🔧 Mise à jour du PIN dans la configuration...\n');

  // ⚠️ REMPLACEZ 'VOTRE_PIN_ICI' par votre vrai PIN
  const NEW_PIN = 'VOTRE_PIN_ICI';  // ← À MODIFIER

  if (NEW_PIN === 'VOTRE_PIN_ICI') {
    console.error('❌ ERREUR : Vous devez d\'abord modifier le PIN dans ce script !');
    console.log('\nOuvrez le fichier :');
    console.log('  src/update-pin-config.ts');
    console.log('\nModifiez la ligne :');
    console.log('  const NEW_PIN = \'VOTRE_PIN_ICI\';');
    console.log('\nPar exemple :');
    console.log('  const NEW_PIN = \'9818\';  // Votre vrai PIN\n');
    process.exit(1);
  }

  try {
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'ORANGE_MONEY' },
    });

    if (!config) {
      console.error('❌ Configuration Orange Money introuvable');
      process.exit(1);
    }

    await prisma.paymentConfig.update({
      where: { provider: 'ORANGE_MONEY' },
      data: {
        metadata: {
          ...(config.metadata as object || {}),
          testRetailerPin: NEW_PIN,
          liveRetailerPin: NEW_PIN,
        },
      },
    });

    console.log('✅ PIN mis à jour avec succès !');
    console.log(`   Nouveau PIN: ${NEW_PIN}\n`);

    console.log('🧪 Vous pouvez maintenant tester le Cash In :');
    console.log('   node test-pin-' + NEW_PIN + '.js\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePin();
