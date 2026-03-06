/**
 * Script pour vérifier le solde avec l'ANCIEN PIN (0000)
 */

const crypto = require('crypto');
const axios = require('axios');

const CONFIG = {
  msisdn: '221777438767',
  pin: '0000',  // ANCIEN PIN
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
  console.log('🔍 Test avec l\'ANCIEN PIN (0000)...\n');
  try {
    const accessToken = await getAccessToken();
    const publicKey = await getPublicKey(accessToken);
    const encryptedPin = encryptPin(CONFIG.pin, publicKey);

    const response = await axios.post(
      `${CONFIG.baseUrl}/api/eWallet/v1/account/retailer/balance`,
      {
        encryptedPinCode: encryptedPin,
        id: CONFIG.msisdn.replace('221', ''),
        idType: 'MSISDN',
        wallet: 'PRINCIPAL',
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    console.log('✅ PIN 0000 fonctionne !');
    console.log(`💰 Solde: ${response.data.value.toLocaleString()} ${response.data.unit}\n`);
    console.log('⚠️  Vous devez MAINTENANT changer votre PIN en 9393');
    console.log('   Composez #144# depuis votre mobile 777438767\n');
  } catch (error) {
    console.log('❌ PIN 0000 ne fonctionne pas non plus');
    console.log(`   Erreur: ${error.response?.data?.detail || error.message}\n`);
  }
}

main();
