import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as https from 'https';

/**
 * Script de diagnostic pour identifier les problèmes de connexion PayDunya
 */

const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 DIAGNOSTIC PAYDUNYA - Début\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Vérifier la configuration en base de données
  console.log('1️⃣  Vérification de la configuration en base de données...');
  try {
    const config = await prisma.paymentConfig.findFirst({
      where: {
        provider: 'PAYDUNYA',
        isActive: true,
      },
    });

    if (config) {
      console.log('   ✅ Configuration PayDunya trouvée en base');
      console.log(`   📋 Mode actif: ${config.activeMode}`);
      console.log(`   🔑 Test Master Key: ${config.testMasterKey ? '✓ Présent' : '✗ Manquant'}`);
      console.log(`   🔑 Test Private Key: ${config.testPrivateKey ? '✓ Présent' : '✗ Manquant'}`);
      console.log(`   🔑 Test Token: ${config.testToken ? '✓ Présent' : '✗ Manquant'}`);
      console.log(`   🔑 Live Master Key: ${config.liveMasterKey ? '✓ Présent' : '✗ Manquant'}`);
      console.log(`   🔑 Live Private Key: ${config.livePrivateKey ? '✓ Présent' : '✗ Manquant'}`);
      console.log(`   🔑 Live Token: ${config.liveToken ? '✓ Présent' : '✗ Manquant'}`);

      const activeMode = config.activeMode as 'test' | 'live';
      const masterKey = activeMode === 'test' ? config.testMasterKey : config.liveMasterKey;
      const privateKey = activeMode === 'test' ? config.testPrivateKey : config.livePrivateKey;
      const token = activeMode === 'test' ? config.testToken : config.liveToken;

      if (!privateKey || !token) {
        console.log('   ❌ ERREUR: Clés manquantes pour le mode actif');
        return;
      }

      console.log('\n');

      // 2. Test de connectivité réseau de base
      console.log('2️⃣  Test de connectivité réseau de base...');
      const baseUrl = activeMode === 'test'
        ? 'https://app.paydunya.com/sandbox-api/v1'
        : 'https://app.paydunya.com/api/v1';

      console.log(`   🌐 URL cible: ${baseUrl}`);

      try {
        const startTime = Date.now();
        const response = await axios.get(`${baseUrl}/checkout-invoice/confirm/test_diagnostic`, {
          timeout: 10000,
          validateStatus: () => true, // Accepter tous les codes de statut
          httpsAgent: new https.Agent({
            rejectUnauthorized: true,
            keepAlive: true,
          }),
        });
        const duration = Date.now() - startTime;

        console.log(`   ✅ Serveur PayDunya accessible (${duration}ms)`);
        console.log(`   📊 Code de réponse: ${response.status}`);
      } catch (error: any) {
        console.log('   ❌ Impossible de joindre le serveur PayDunya');
        console.log(`   🔴 Erreur: ${error.code || error.message}`);

        if (error.code === 'ETIMEDOUT') {
          console.log('   💡 Cause probable: Timeout réseau (firewall, proxy, ou connexion lente)');
        } else if (error.code === 'ENOTFOUND') {
          console.log('   💡 Cause probable: DNS ne résout pas app.paydunya.com');
        } else if (error.code === 'ECONNREFUSED') {
          console.log('   💡 Cause probable: Le serveur refuse la connexion');
        }

        console.log('\n   🔧 Actions recommandées:');
        console.log('      1. Vérifier votre connexion internet');
        console.log('      2. Vérifier les règles de firewall');
        console.log('      3. Tester avec: curl -v https://app.paydunya.com/sandbox-api/v1/');
        return;
      }

      console.log('\n');

      // 3. Test avec les clés API
      console.log('3️⃣  Test avec authentification PayDunya...');
      try {
        const headers: any = {
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
          'Content-Type': 'application/json',
        };

        if (masterKey) {
          headers['PAYDUNYA-MASTER-KEY'] = masterKey;
        }

        console.log('   🔑 Headers configurés:');
        console.log(`      - PAYDUNYA-MASTER-KEY: ${masterKey ? '✓' : '✗'}`);
        console.log(`      - PAYDUNYA-PRIVATE-KEY: ✓`);
        console.log(`      - PAYDUNYA-TOKEN: ✓`);

        const axiosInstance = axios.create({
          baseURL: baseUrl,
          headers,
          timeout: 30000,
          httpsAgent: new https.Agent({
            rejectUnauthorized: true,
            keepAlive: true,
          }),
        });

        const startTime = Date.now();
        const response = await axiosInstance.get('/checkout-invoice/confirm/test_diagnostic', {
          validateStatus: () => true,
        });
        const duration = Date.now() - startTime;

        console.log(`   ✅ Requête authentifiée réussie (${duration}ms)`);
        console.log(`   📊 Code de réponse: ${response.status}`);
        console.log(`   📋 Réponse: ${JSON.stringify(response.data).substring(0, 200)}...`);

        if (response.status === 401 || response.status === 403) {
          console.log('   ⚠️  Authentification refusée - Vérifier les clés API');
        } else if (response.status === 404) {
          console.log('   ✅ Authentification OK (404 normal pour token test)');
        } else if (response.status >= 500) {
          console.log('   ⚠️  Erreur serveur PayDunya');
        }

      } catch (error: any) {
        console.log('   ❌ Échec de la requête authentifiée');
        console.log(`   🔴 Erreur: ${error.code || error.message}`);
        console.log(`   📋 Détails: ${error.response?.data || 'Aucun détail disponible'}`);
      }

      console.log('\n');

      // 4. Test DNS
      console.log('4️⃣  Test de résolution DNS...');
      try {
        const dns = require('dns').promises;
        const addresses = await dns.resolve4('app.paydunya.com');
        console.log(`   ✅ DNS résolu: ${addresses.join(', ')}`);
      } catch (error: any) {
        console.log('   ❌ Erreur de résolution DNS');
        console.log(`   🔴 ${error.message}`);
      }

      console.log('\n');

      // 5. Vérifier les commandes en attente
      console.log('5️⃣  Vérification des commandes en attente...');
      const pendingOrders = await prisma.order.count({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'PENDING',
        },
      });
      console.log(`   📦 Commandes PayDunya en attente: ${pendingOrders}`);

    } else {
      console.log('   ❌ Aucune configuration PayDunya active en base de données');
      console.log('\n   🔧 Action requise:');
      console.log('      Configurez PayDunya via l\'API admin ou exécutez:');
      console.log('      npx ts-node scripts/setup-paydunya-config.ts');
    }

  } catch (error: any) {
    console.log('   ❌ Erreur lors de la vérification de la configuration');
    console.log(`   🔴 ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🏁 DIAGNOSTIC TERMINÉ\n');
}

diagnose().catch(console.error);
