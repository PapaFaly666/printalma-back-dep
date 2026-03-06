/**
 * Script pour mettre à jour le numéro de téléphone retailer
 * Nouveau numéro : 221777438767 (au lieu de 221775588834)
 * PIN : 9393 (nouveau PIN après changement)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePhoneNumber() {
  console.log('🔧 Mise à jour du numéro de téléphone retailer...\n');

  try {
    // Récupérer la config actuelle
    const currentConfig = await prisma.paymentConfig.findUnique({
      where: { provider: 'ORANGE_MONEY' },
    });

    if (!currentConfig) {
      console.error('❌ Aucune configuration Orange Money trouvée');
      process.exit(1);
    }

    console.log('📊 Configuration actuelle :');
    console.log(`   Numéro actuel: ${(currentConfig.metadata as any)?.retailerMsisdn || 'Non défini'}`);
    console.log(`   PIN actuel: ${(currentConfig.metadata as any)?.liveRetailerPin || 'Non défini'}\n`);

    // Mettre à jour avec le BON numéro et le NOUVEAU PIN
    const updatedConfig = await prisma.paymentConfig.update({
      where: { provider: 'ORANGE_MONEY' },
      data: {
        metadata: {
          ...(currentConfig.metadata as object || {}),
          retailerMsisdn: '221777438767',  // ✅ BON NUMÉRO
          testRetailerPin: '9393',          // Nouveau PIN (après changement)
          liveRetailerPin: '9393',          // Nouveau PIN (après changement)
        },
      },
    });

    console.log('✅ Configuration mise à jour avec succès !\n');
    console.log('📊 Nouvelle configuration :');
    console.log(`   Nouveau numéro: 221777438767`);
    console.log(`   Nouveau PIN: 9393`);
    console.log(`   Metadata complet: ${JSON.stringify(updatedConfig.metadata, null, 2)}\n`);

    console.log('🎉 Configuration appliquée !');
    console.log('\n⚠️  ATTENTION :');
    console.log('   Vous devez d\'abord changer votre PIN de 0000 à 9393');
    console.log('   en composant #144# depuis votre mobile 777438767\n');

  } catch (error) {
    console.error('❌ Erreur :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhoneNumber();
