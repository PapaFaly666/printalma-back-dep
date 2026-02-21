import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🍊 Initialisation de la configuration Orange Money...\n');

  // Récupérer les credentials depuis les variables d'environnement
  const clientId = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;
  const merchantCode = process.env.ORANGE_MERCHANT_CODE;
  const mode = process.env.ORANGE_MODE || 'production';

  if (!clientId || !clientSecret || !merchantCode) {
    console.error('❌ Erreur: Les variables d\'environnement Orange Money ne sont pas configurées');
    console.error('   Assurez-vous que les variables suivantes sont définies:');
    console.error('   - ORANGE_CLIENT_ID');
    console.error('   - ORANGE_CLIENT_SECRET');
    console.error('   - ORANGE_MERCHANT_CODE');
    process.exit(1);
  }

  console.log(`📋 Configuration détectée:`);
  console.log(`   Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   Merchant Code: ${merchantCode}`);
  console.log(`   Mode: ${mode.toUpperCase()}\n`);

  try {
    // Vérifier si une config existe déjà
    const existing = await prisma.paymentConfig.findUnique({
      where: { provider: 'ORANGE_MONEY' },
    });

    if (existing) {
      console.log('⚠️  Une configuration Orange Money existe déjà.');
      console.log('   Mise à jour de la configuration...\n');

      const updated = await prisma.paymentConfig.update({
        where: { provider: 'ORANGE_MONEY' },
        data: {
          isActive: true,
          activeMode: mode === 'production' ? 'live' : 'test',
          // Stocker les clés selon le mode
          ...(mode === 'production' ? {
            livePublicKey: clientId,
            livePrivateKey: clientSecret,
            liveToken: merchantCode,
          } : {
            testPublicKey: clientId,
            testPrivateKey: clientSecret,
            testToken: merchantCode,
          }),
          metadata: {
            provider: 'Orange Money Senegal',
            currency: 'XOF',
            authUrl: mode === 'production'
              ? 'https://api.orange-sonatel.com/oauth/token'
              : 'https://api.sandbox.orange-sonatel.com/oauth/token',
            qrUrl: mode === 'production'
              ? 'https://api.orange-sonatel.com/api/eWallet/v4/qrcode'
              : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v4/qrcode',
          },
        },
      });

      console.log('✅ Configuration Orange Money mise à jour avec succès!');
    } else {
      console.log('   Création de la configuration...\n');

      const config = await prisma.paymentConfig.create({
        data: {
          provider: 'ORANGE_MONEY',
          isActive: true,
          activeMode: mode === 'production' ? 'live' : 'test',
          // Stocker les clés selon le mode
          ...(mode === 'production' ? {
            livePublicKey: clientId,
            livePrivateKey: clientSecret,
            liveToken: merchantCode,
          } : {
            testPublicKey: clientId,
            testPrivateKey: clientSecret,
            testToken: merchantCode,
          }),
          metadata: {
            provider: 'Orange Money Senegal',
            currency: 'XOF',
            authUrl: mode === 'production'
              ? 'https://api.orange-sonatel.com/oauth/token'
              : 'https://api.sandbox.orange-sonatel.com/oauth/token',
            qrUrl: mode === 'production'
              ? 'https://api.orange-sonatel.com/api/eWallet/v4/qrcode'
              : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v4/qrcode',
          },
        },
      });

      console.log('✅ Configuration Orange Money créée avec succès!');
    }

    console.log('\n📊 Détails de la configuration:');
    console.log(`   Provider: ORANGE_MONEY`);
    console.log(`   Actif: Oui`);
    console.log(`   Mode: ${mode === 'production' ? 'LIVE' : 'TEST'}`);
    console.log(`   Merchant Code: ${merchantCode}`);
    console.log('\n🎉 L\'admin peut maintenant gérer cette configuration depuis /admin/payment-config');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la configuration:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
