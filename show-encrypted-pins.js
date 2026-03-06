/**
 * Script pour afficher les PINs cryptés
 * Montre exactement quelles données sont envoyées à Orange Money
 */

const crypto = require('crypto');
const axios = require('axios');

const CONFIG = {
  msisdn: '221777438767',
  baseUrl: 'https://api.orange-sonatel.com',
};

const CLIENT_ID = process.env.ORANGE_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET || 'your_client_secret';

async function getAccessToken() {
  const response = await axios.post(
    `${CONFIG.baseUrl}/oauth/v1/token`,
    'grant_type=client_credentials',
    { auth: { username: CLIENT_ID, password: CLIENT_SECRET }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return response.data.access_token;
}

async function getPublicKey(accessToken) {
  const response = await axios.get(`${CONFIG.baseUrl}/api/account/v1/publicKeys`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return response.data.key;
}

function encryptPin(pinCode, publicKey) {
  let formattedKey = publicKey;
  if (!publicKey.includes('-----BEGIN')) {
    formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  }
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  const buffer = Buffer.from(pinCode, 'utf8');
  const encrypted = crypto.publicEncrypt({ key: formattedKey, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer);
  return encrypted.toString('base64');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔐 AFFICHAGE DES PINS CRYPTÉS');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    console.log('🔐 Récupération du token OAuth2...');
    const accessToken = await getAccessToken();
    console.log('✅ Token obtenu\n');

    console.log('🔑 Récupération de la clé publique RSA...');
    const publicKey = await getPublicKey(accessToken);
    console.log('✅ Clé publique récupérée\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  CLÉS PUBLIQUE ORANGE MONEY');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Format complet de la clé :');
    console.log('─────────────────────────────────────────────────────');
    let formattedKey = publicKey;
    if (!publicKey.includes('-----BEGIN')) {
      formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    }
    formattedKey = formattedKey.replace(/\\n/g, '\n');
    console.log(formattedKey);
    console.log('─────────────────────────────────────────────────────\n');

    // Liste des PINs à tester
    const pinsToEncrypt = ['0000', '9393', '9818'];

    console.log('═══════════════════════════════════════════════════════');
    console.log('  CRYPTAGE DES DIFFÉRENTS PINS');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const pin of pinsToEncrypt) {
      console.log(`📌 PIN EN CLAIR : "${pin}"`);
      console.log('─────────────────────────────────────────────────────');

      const encryptedPin = encryptPin(pin, publicKey);

      console.log('🔒 PIN CRYPTÉ (Base64) :');
      console.log(encryptedPin);
      console.log('');
      console.log('📊 Longueur : ' + encryptedPin.length + ' caractères');
      console.log('');
      console.log('📋 Payload JSON pour l\'API :');
      console.log(JSON.stringify({
        encryptedPinCode: encryptedPin
      }, null, 2));
      console.log('═══════════════════════════════════════════════════════\n');
    }

    console.log('🔍 EXEMPLE DE PAYLOAD COMPLET POUR CHANGEMENT DE PIN :');
    console.log('─────────────────────────────────────────────────────');
    const oldPinEncrypted = encryptPin('0000', publicKey);
    const newPinEncrypted = encryptPin('9393', publicKey);

    const changePinPayload = {
      encryptedPinCode: oldPinEncrypted,      // Ancien PIN (0000)
      encryptedNewPinCode: newPinEncrypted    // Nouveau PIN (9393)
    };

    console.log(JSON.stringify(changePinPayload, null, 2));
    console.log('\n');

    console.log('🔍 EXEMPLE DE PAYLOAD POUR VÉRIFIER SOLDE :');
    console.log('─────────────────────────────────────────────────────');
    const balancePayload = {
      encryptedPinCode: encryptPin('9818', publicKey),  // Exemple avec 9818
      id: CONFIG.msisdn.replace('221', ''),
      idType: 'MSISDN',
      wallet: 'PRINCIPAL'
    };

    console.log(JSON.stringify(balancePayload, null, 2));
    console.log('\n');

    console.log('✅ Cryptage terminé !');
    console.log('\n💡 NOTE : Les PINs cryptés changent à chaque exécution');
    console.log('   car Orange Money utilise un padding aléatoire (RSA PKCS1)');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main();
