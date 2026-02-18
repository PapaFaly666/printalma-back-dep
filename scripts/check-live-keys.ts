import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLiveKeys() {
  const config = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!config) {
    console.log('❌ Aucune configuration PayDunya active trouvée');
    return;
  }

  console.log('═══════════════════════════════════════════');
  console.log('📋 CONFIGURATION PAYDUNYA ACTIVE');
  console.log('═══════════════════════════════════════════\n');
  console.log('Mode actuel:', config.activeMode);
  console.log('\n🔑 Clés LIVE:');
  console.log('  Master Key:', config.liveMasterKey ? '✅ Configuré' : '❌ MANQUANT');
  console.log('  Private Key:', config.livePrivateKey ? '✅ Configuré' : '❌ MANQUANT');
  console.log('  Token:', config.liveToken ? '✅ Configuré' : '❌ MANQUANT');

  if (!config.liveMasterKey || !config.livePrivateKey || !config.liveToken) {
    console.log('\n⚠️  ATTENTION: Les clés LIVE ne sont pas configurées!');
    console.log('Vous devez configurer vos clés de production avant de passer en mode LIVE.\n');
    console.log('💡 Pour configurer les clés LIVE:');
    console.log('   npx ts-node scripts/setup-paydunya-config.ts\n');
  } else {
    console.log('\n✅ Toutes les clés LIVE sont configurées.');
    console.log('Vous pouvez passer en mode LIVE avec:');
    console.log('   npx ts-node scripts/switch-paydunya-mode.ts live --confirm\n');
  }

  await prisma.$disconnect();
}

checkLiveKeys().catch(console.error);
