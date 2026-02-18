import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkServerConfig() {
  console.log('🔍 VÉRIFICATION DE LA CONFIGURATION DU SERVEUR\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Variables d'environnement
  console.log('1️⃣  VARIABLES D\'ENVIRONNEMENT (.env):');
  console.log('   Mode:', process.env.PAYDUNYA_MODE);
  console.log('   Master Key:', process.env.PAYDUNYA_MASTER_KEY?.substring(0, 30) + '...');
  console.log('   Private Key:', process.env.PAYDUNYA_PRIVATE_KEY?.substring(0, 30) + '...');
  console.log('   Token:', process.env.PAYDUNYA_TOKEN?.substring(0, 20) + '...');
  console.log('   Callback URL:', process.env.PAYDUNYA_CALLBACK_URL);
  console.log('');

  // Vérifier si c'est bien LIVE
  if (process.env.PAYDUNYA_MODE !== 'live') {
    console.log('   ⚠️  ATTENTION: Le mode n\'est pas "live"!');
  } else {
    console.log('   ✅ Mode LIVE configuré');
  }

  if (process.env.PAYDUNYA_PRIVATE_KEY?.startsWith('test_')) {
    console.log('   ⚠️  ATTENTION: Private key commence par "test_"!');
  } else if (process.env.PAYDUNYA_PRIVATE_KEY?.startsWith('live_')) {
    console.log('   ✅ Private key commence par "live_"');
  }

  if (process.env.PAYDUNYA_CALLBACK_URL?.includes('localhost')) {
    console.log('   ⚠️  ATTENTION: Callback URL en localhost!');
  } else {
    console.log('   ✅ Callback URL publique');
  }

  console.log('');

  // 2. Configuration BDD
  console.log('2️⃣  CONFIGURATION BASE DE DONNÉES:');
  const dbConfig = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!dbConfig) {
    console.log('   ❌ Aucune configuration active en BDD');
  } else {
    console.log('   Provider:', dbConfig.provider);
    console.log('   Mode actif:', dbConfig.activeMode);
    console.log('   Is Active:', dbConfig.isActive);
    console.log('   Live Master Key:', dbConfig.liveMasterKey?.substring(0, 30) + '...');
    console.log('   Live Private Key:', dbConfig.livePrivateKey?.substring(0, 30) + '...');
    console.log('   Live Token:', dbConfig.liveToken?.substring(0, 20) + '...');
    console.log('');

    if (dbConfig.activeMode === 'live') {
      console.log('   ✅ Mode LIVE en BDD');
    } else {
      console.log('   ⚠️  ATTENTION: Mode n\'est pas "live"!');
    }
  }

  console.log('');
  console.log('3️⃣  QUELLE CONFIGURATION SERA UTILISÉE?');
  console.log('   Le serveur utilise en PRIORITÉ la config BDD');
  console.log('   Puis fallback sur les variables .env');
  console.log('');

  if (dbConfig && dbConfig.isActive) {
    console.log('   → Configuration BDD sera utilisée');
    console.log('   → Mode:', dbConfig.activeMode);

    if (dbConfig.activeMode === 'live') {
      console.log('   → Clés LIVE de la BDD');
      console.log('');
      console.log('   ✅ CONFIGURATION CORRECTE');
    } else {
      console.log('   → Clés TEST de la BDD');
      console.log('');
      console.log('   ❌ PROBLÈME: La BDD est en mode TEST!');
    }
  } else {
    console.log('   → Variables .env seront utilisées (fallback)');
    console.log('   → Mode:', process.env.PAYDUNYA_MODE);

    if (process.env.PAYDUNYA_MODE === 'live' &&
        process.env.PAYDUNYA_PRIVATE_KEY?.startsWith('live_')) {
      console.log('');
      console.log('   ✅ CONFIGURATION CORRECTE');
    } else {
      console.log('');
      console.log('   ❌ PROBLÈME: Les variables .env ne sont pas en mode LIVE!');
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('📝 RECOMMANDATIONS:');
  console.log('');
  console.log('Si la configuration n\'est pas correcte:');
  console.log('1. Vérifiez le fichier .env');
  console.log('2. Redémarrez COMPLÈTEMENT le serveur (kill + restart)');
  console.log('3. Vérifiez que la BDD est en mode LIVE');
  console.log('═══════════════════════════════════════════════════');

  await prisma.$disconnect();
}

checkServerConfig().catch(console.error);
