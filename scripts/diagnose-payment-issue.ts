import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosePaymentIssue() {
  console.log('\n🔍 DIAGNOSTIC DU PROBLÈME DE PAIEMENT\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Vérifier la config en BDD
  console.log('1️⃣  Configuration en Base de Données');
  const dbConfig = await prisma.paymentConfig.findFirst({
    where: { provider: 'PAYDUNYA', isActive: true }
  });

  if (!dbConfig) {
    console.log('❌ Aucune configuration active\n');
    return;
  }

  console.log(`   Mode actif: ${dbConfig.activeMode}`);
  console.log(`   État: ${dbConfig.isActive ? 'Actif' : 'Inactif'}`);

  const activeMasterKey = dbConfig.activeMode === 'test'
    ? dbConfig.testMasterKey
    : dbConfig.liveMasterKey;
  const activePrivateKey = dbConfig.activeMode === 'test'
    ? dbConfig.testPrivateKey
    : dbConfig.livePrivateKey;
  const activeToken = dbConfig.activeMode === 'test'
    ? dbConfig.testToken
    : dbConfig.liveToken;
  const activePublicKey = dbConfig.activeMode === 'test'
    ? dbConfig.testPublicKey
    : dbConfig.livePublicKey;

  console.log('\n2️⃣  Clés Actives (depuis BDD)');
  console.log(`   Master Key:   ${activeMasterKey}`);
  console.log(`   Private Key:  ${activePrivateKey}`);
  console.log(`   Public Key:   ${activePublicKey}`);
  console.log(`   Token:        ${activeToken}\n`);

  // 2. Vérifier les variables d'environnement
  console.log('3️⃣  Variables d\'Environnement (.env)');
  console.log(`   Master Key:   ${process.env.PAYDUNYA_MASTER_KEY}`);
  console.log(`   Private Key:  ${process.env.PAYDUNYA_PRIVATE_KEY}`);
  console.log(`   Public Key:   ${process.env.PAYDUNYA_PUBLIC_KEY}`);
  console.log(`   Token:        ${process.env.PAYDUNYA_TOKEN}`);
  console.log(`   Mode:         ${process.env.PAYDUNYA_MODE}\n`);

  // 3. Comparer
  console.log('4️⃣  Comparaison');

  const masterKeyMatch = activeMasterKey === process.env.PAYDUNYA_MASTER_KEY;
  const privateKeyMatch = activePrivateKey === process.env.PAYDUNYA_PRIVATE_KEY;
  const publicKeyMatch = activePublicKey === process.env.PAYDUNYA_PUBLIC_KEY;
  const tokenMatch = activeToken === process.env.PAYDUNYA_TOKEN;

  console.log(`   Master Key:   ${masterKeyMatch ? '✅ Identique' : '❌ DIFFÉRENT'}`);
  console.log(`   Private Key:  ${privateKeyMatch ? '✅ Identique' : '❌ DIFFÉRENT'}`);
  console.log(`   Public Key:   ${publicKeyMatch ? '✅ Identique' : '❌ DIFFÉRENT'}`);
  console.log(`   Token:        ${tokenMatch ? '✅ Identique' : '❌ DIFFÉRENT'}\n`);

  // 4. Recommandations
  console.log('5️⃣  Recommandations\n');

  if (!privateKeyMatch || !tokenMatch) {
    console.log('⚠️  PROBLÈME DÉTECTÉ: Les clés en BDD et dans .env sont différentes!\n');
    console.log('Solutions possibles:');
    console.log('   1. Synchroniser le .env avec la BDD:');
    console.log('      - Modifier le .env pour utiliser les clés de la BDD');
    console.log('   2. OU synchroniser la BDD avec le .env:');
    console.log('      - Exécuter: npx ts-node scripts/setup-paydunya-config.ts\n');
    console.log('   3. Redémarrer le serveur après la synchronisation\n');
  } else {
    console.log('✅ Les clés en BDD et dans .env sont identiques\n');
    console.log('Le problème vient peut-être d\'ailleurs:');
    console.log('   1. Le serveur doit-il être redémarré?');
    console.log('   2. Y a-t-il un problème dans la logique de création d\'invoice?');
    console.log('   3. Les URLs de callback sont-elles correctes?\n');
  }

  console.log('═══════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

diagnosePaymentIssue().catch(console.error);
