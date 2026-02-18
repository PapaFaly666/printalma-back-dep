/**
 * Script de test direct de l'API PayDunya
 * Teste la création d'une facture avec un payload minimal
 *
 * Usage:
 *   npx ts-node scripts/test-paydunya-api.ts
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function testPaydunyaAPI() {
  console.log('🧪 Test de l\'API PayDunya\n');

  try {
    // Récupérer la configuration depuis la BDD
    const config = await prisma.paymentConfig.findUnique({
      where: { provider: 'PAYDUNYA' },
    });

    if (!config) {
      console.error('❌ Aucune configuration PayDunya en BDD');
      console.error('   Exécutez: npx ts-node scripts/setup-paydunya-config.ts');
      return;
    }

    // Sélectionner les clés selon le mode actif
    const mode = config.activeMode;
    const masterKey = mode === 'test' ? config.testMasterKey : config.liveMasterKey;
    const privateKey = mode === 'test' ? config.testPrivateKey : config.livePrivateKey;
    const token = mode === 'test' ? config.testToken : config.liveToken;

    console.log('📋 Configuration:');
    console.log(`   Mode: ${mode.toUpperCase()}`);
    console.log(`   Master Key: ${maskKey(masterKey)}`);
    console.log(`   Private Key: ${maskKey(privateKey)}`);
    console.log(`   Token: ${maskKey(token)}\n`);

    // Construire l'URL de base selon le mode
    const baseURL = mode === 'test'
      ? 'https://app.paydunya.com/sandbox-api/v1'
      : 'https://app.paydunya.com/api/v1';

    console.log(`🌐 API URL: ${baseURL}\n`);

    // Créer une instance axios avec les headers
    const headers: any = {
      'PAYDUNYA-PRIVATE-KEY': privateKey,
      'PAYDUNYA-TOKEN': token,
      'Content-Type': 'application/json',
    };

    if (masterKey) {
      headers['PAYDUNYA-MASTER-KEY'] = masterKey;
    }

    console.log('📤 Headers envoyés:');
    console.log(`   PAYDUNYA-MASTER-KEY: ${masterKey ? '✅ présent' : '❌ absent'}`);
    console.log(`   PAYDUNYA-PRIVATE-KEY: ✅ présent`);
    console.log(`   PAYDUNYA-TOKEN: ✅ présent`);
    console.log(`   Content-Type: application/json\n`);

    // Payload minimal selon la documentation PayDunya
    const payload = {
      invoice: {
        total_amount: 5000,
        description: 'Test PayDunya - Script de test',
      },
      store: {
        name: 'Printalma Test',
      },
      actions: {
        return_url: 'http://localhost:5174/order-confirmation',
        cancel_url: 'http://localhost:5174/order-confirmation?status=cancelled',
      },
    };

    console.log('📦 Payload minimal:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // Envoyer la requête
    console.log('🚀 Envoi de la requête...\n');

    const response = await axios.post(
      `${baseURL}/checkout-invoice/create`,
      payload,
      { headers }
    );

    console.log('✅ Réponse reçue:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.response_code === '00') {
      console.log('🎉 SUCCESS! Facture créée avec succès');
      console.log(`   Token: ${response.data.token}`);
      console.log(`   Response URL: ${response.data.response_url || 'Non fournie'}`);

      // Construire l'URL de paiement
      const paymentUrl = mode === 'test'
        ? `https://app.paydunya.com/sandbox-checkout/invoice/${response.data.token}`
        : `https://app.paydunya.com/checkout/invoice/${response.data.token}`;

      console.log(`   Payment URL: ${paymentUrl}`);
    } else {
      console.error('❌ Échec de la création');
      console.error(`   Code: ${response.data.response_code}`);
      console.error(`   Message: ${response.data.response_text}`);
    }

  } catch (error: any) {
    console.error('❌ Erreur lors du test:\n');

    if (error.response) {
      console.error('📥 Réponse d\'erreur de l\'API:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);

      // Vérifier si c'est du HTML (erreur 500)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.error(`   Type: Erreur 500 (HTML)`);
        console.error(`   → L'API PayDunya a rencontré une erreur interne`);
        console.error('');
        console.error('💡 Solutions possibles:');
        console.error('   1. Vérifiez que les clés API sont valides');
        console.error('   2. Vérifiez que vous utilisez le bon mode (test/live)');
        console.error('   3. Contactez le support PayDunya si le problème persiste');
      } else {
        console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } else if (error.request) {
      console.error('📡 Aucune réponse reçue:');
      console.error(`   Message: ${error.message}`);
      console.error('   → Vérifiez votre connexion internet');
    } else {
      console.error('⚙️  Erreur de configuration:');
      console.error(`   Message: ${error.message}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function maskKey(key: string | null): string {
  if (!key) return '❌ Non configuré';
  if (key.length < 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

testPaydunyaAPI();
