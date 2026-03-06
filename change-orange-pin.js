/**
 * Script pour changer le code PIN Orange Money
 * Ancien PIN : 0000
 * Nouveau PIN : 9393
 * MSISDN : 221775588834
 */

const crypto = require('crypto');
const axios = require('axios');

// Configuration
const CONFIG = {
  msisdn: '221777438767',  // Votre numéro (corrigé)
  oldPin: '0000',          // Ancien PIN
  newPin: '9393',          // Nouveau PIN
  type: 'customer',        // Type de compte (customer ou retailer)
  baseUrl: 'https://api.orange-sonatel.com', // Production
  // baseUrl: 'https://api.sandbox.orange-sonatel.com', // Sandbox pour tests
};

// Credentials API (depuis votre .env)
const CLIENT_ID = process.env.ORANGE_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET || 'your_client_secret';

/**
 * Étape 1 : Récupérer le token OAuth2
 */
async function getAccessToken() {
  console.log('🔐 Récupération du token OAuth2...');

  try {
    const response = await axios.post(
      `${CONFIG.baseUrl}/oauth/v1/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Token obtenu\n');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Étape 2 : Récupérer la clé publique RSA
 */
async function getPublicKey(accessToken) {
  console.log('🔑 Récupération de la clé publique RSA...');

  try {
    const response = await axios.get(
      `${CONFIG.baseUrl}/api/account/v1/publicKeys`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✅ Clé publique récupérée');
    console.log(`   Key ID: ${response.data.keyId}`);
    console.log(`   Key Type: ${response.data.keyType}`);
    console.log(`   Key Size: ${response.data.keySize}\n`);

    return response.data.key;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la clé publique:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Étape 3 : Crypter un PIN avec la clé publique RSA
 */
function encryptPin(pinCode, publicKey) {
  try {
    // S'assurer que la clé est au bon format
    let formattedKey = publicKey;

    // Si la clé n'a pas les headers, les ajouter
    if (!publicKey.includes('-----BEGIN')) {
      formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    }

    // Nettoyer les \n en trop si nécessaire
    formattedKey = formattedKey.replace(/\\n/g, '\n');

    const buffer = Buffer.from(pinCode, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: formattedKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('❌ Erreur lors du cryptage du PIN:', error.message);
    console.error('   Format de la clé:', publicKey.substring(0, 100) + '...');
    throw error;
  }
}

/**
 * Étape 4 : Changer le PIN
 */
async function changePin(accessToken, encryptedOldPin, encryptedNewPin) {
  console.log('🔄 Changement du code PIN...');
  console.log(`   MSISDN: ${CONFIG.msisdn}`);
  console.log(`   Type: ${CONFIG.type}\n`);

  try {
    const response = await axios.patch(
      `${CONFIG.baseUrl}/api/eWallet/v1/account`,
      {
        encryptedPinCode: encryptedOldPin,
        encryptedNewPinCode: encryptedNewPin,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          msisdn: CONFIG.msisdn,
          type: CONFIG.type,
        },
      }
    );

    console.log('✅ Code PIN changé avec succès !');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Description: ${response.data.description}`);
    console.log(`   Transaction ID: ${response.data.transactionId}\n`);

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors du changement de PIN:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.detail || error.message}`);

    // Gestion des erreurs spécifiques
    const errorCode = error.response?.data?.code;
    if (errorCode === '2011' || errorCode === '2012' || errorCode === '2013') {
      console.error('\n⚠️  PIN invalide ou compte bloqué !');
      console.error('   Vérifiez que l\'ancien PIN (0000) est correct');
    } else if (errorCode === '2000') {
      console.error('\n⚠️  Le compte n\'existe pas');
      console.error(`   Vérifiez le numéro MSISDN: ${CONFIG.msisdn}`);
    }

    throw error;
  }
}

/**
 * Main - Exécution du changement de PIN
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔐 CHANGEMENT DE CODE PIN ORANGE MONEY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`  Numéro: ${CONFIG.msisdn}`);
  console.log(`  Ancien PIN: ${CONFIG.oldPin}`);
  console.log(`  Nouveau PIN: ${CONFIG.newPin}`);
  console.log(`  Environnement: ${CONFIG.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log('\n═══════════════════════════════════════════════════════\n');

  try {
    // Étape 1 : Token
    const accessToken = await getAccessToken();

    // Étape 2 : Clé publique
    const publicKey = await getPublicKey(accessToken);

    // Étape 3 : Crypter les PINs
    console.log('🔒 Cryptage des codes PIN...');
    const encryptedOldPin = encryptPin(CONFIG.oldPin, publicKey);
    const encryptedNewPin = encryptPin(CONFIG.newPin, publicKey);
    console.log('✅ PINs cryptés\n');

    // Étape 4 : Changer le PIN
    await changePin(accessToken, encryptedOldPin, encryptedNewPin);

    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎉 CHANGEMENT DE PIN RÉUSSI !');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('  Vous pouvez maintenant utiliser le nouveau PIN : 9393');
    console.log('  pour vos transactions Orange Money.\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ❌ ÉCHEC DU CHANGEMENT DE PIN');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Exécuter
main();
