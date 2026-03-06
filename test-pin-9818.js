/**
 * Test avec le PIN 9818
 */

const crypto = require('crypto');
const axios = require('axios');

const CONFIG = {
  msisdn: '221777438767',
  pin: '9818',  // PIN à tester
  baseUrl: 'https://api.orange-sonatel.com',
};

const CLIENT_ID = process.env.ORANGE_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET || 'your_client_secret';

async function getAccessToken() {
  console.log('🔐 Récupération du token...');
  const response = await axios.post(
    `${CONFIG.baseUrl}/oauth/v1/token`,
    'grant_type=client_credentials',
    { auth: { username: CLIENT_ID, password: CLIENT_SECRET }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  console.log('✅ Token obtenu\n');
  return response.data.access_token;
}

async function getPublicKey(accessToken) {
  console.log('🔑 Récupération clé publique...');
  const response = await axios.get(`${CONFIG.baseUrl}/api/account/v1/publicKeys`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  console.log('✅ Clé obtenue\n');
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
  console.log('  🔍 TEST PIN 9818');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`  Numéro: ${CONFIG.msisdn}`);
  console.log(`  PIN testé: ${CONFIG.pin}\n`);
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const accessToken = await getAccessToken();
    const publicKey = await getPublicKey(accessToken);

    console.log('🔒 Cryptage du PIN 9818...');
    const encryptedPin = encryptPin(CONFIG.pin, publicKey);
    console.log('✅ PIN crypté\n');

    console.log('💰 Vérification du solde retailer...\n');
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

    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ PIN 9818 EST CORRECT !');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`  💰 Solde disponible: ${response.data.value.toLocaleString()} ${response.data.unit}\n`);

    if (response.data.value < 1000) {
      console.log('⚠️  Solde faible ! Rechargez votre compte pour faire des Cash In.\n');
    } else {
      console.log(`✅ Vous pouvez faire des Cash In jusqu'à ${response.data.value} ${response.data.unit}\n`);
    }

    console.log('🎉 Compte retailer activé et prêt à l\'emploi !');

  } catch (error) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ❌ PIN 9818 EST INCORRECT');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`  Erreur: ${error.response?.data?.detail || error.message}\n`);

    const errorCode = error.response?.data?.code;
    if (errorCode === '2011') {
      console.log('⚠️  PIN invalide - Il vous reste 2 tentatives');
    } else if (errorCode === '2012') {
      console.log('⚠️  PIN invalide - Il vous reste 1 tentative');
    } else if (errorCode === '2013') {
      console.log('❌ Compte bloqué - Contactez Orange Money');
    }
  }
}

main();
