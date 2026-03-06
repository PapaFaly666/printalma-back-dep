/**
 * Script pour vérifier le solde de votre compte Retailer Orange Money
 * MSISDN : 221777438767
 * PIN : 9393 (après changement)
 */

const crypto = require('crypto');
const axios = require('axios');

const CONFIG = {
  msisdn: '221777438767',  // Votre numéro retailer
  pin: '9393',              // Votre nouveau PIN
  baseUrl: 'https://api.orange-sonatel.com', // Production
};

const CLIENT_ID = process.env.ORANGE_CLIENT_ID || 'your_client_id';
const CLIENT_SECRET = process.env.ORANGE_CLIENT_SECRET || 'your_client_secret';

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
    console.error('❌ Erreur token:', error.response?.data || error.message);
    throw error;
  }
}

async function getPublicKey(accessToken) {
  console.log('🔑 Récupération de la clé publique...');

  try {
    const response = await axios.get(
      `${CONFIG.baseUrl}/api/account/v1/publicKeys`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log('✅ Clé publique récupérée\n');
    return response.data.key;
  } catch (error) {
    console.error('❌ Erreur clé publique:', error.response?.data || error.message);
    throw error;
  }
}

function encryptPin(pinCode, publicKey) {
  let formattedKey = publicKey;
  if (!publicKey.includes('-----BEGIN')) {
    formattedKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  }
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
}

async function getRetailerBalance(accessToken, encryptedPin) {
  console.log('💰 Récupération du solde Retailer...');
  console.log(`   MSISDN: ${CONFIG.msisdn}\n`);

  try {
    const response = await axios.post(
      `${CONFIG.baseUrl}/api/eWallet/v1/account/retailer/balance`,
      {
        encryptedPinCode: encryptedPin,
        id: CONFIG.msisdn.replace('221', ''),  // Sans le préfixe 221
        idType: 'MSISDN',
        wallet: 'PRINCIPAL',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const balance = response.data.value;
    const currency = response.data.unit;

    console.log('✅ Solde récupéré avec succès !');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  💰 SOLDE : ${balance.toLocaleString()} ${currency}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (balance < 1000) {
      console.log('⚠️  Solde faible ! Rechargez votre compte retailer pour faire des Cash In.');
    } else {
      console.log(`✅ Vous pouvez faire des Cash In jusqu'à ${balance} ${currency}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du solde:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.detail || error.message}`);

    const errorCode = error.response?.data?.code;
    if (errorCode === '2011' || errorCode === '2012' || errorCode === '2013') {
      console.error('\n⚠️  PIN invalide !');
      console.error('   Vérifiez que vous avez bien changé votre PIN en 9393');
    }

    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  💰 VÉRIFICATION SOLDE RETAILER ORANGE MONEY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`  Numéro: ${CONFIG.msisdn}`);
  console.log(`  PIN: ${CONFIG.pin}`);
  console.log('\n═══════════════════════════════════════════════════════\n');

  try {
    const accessToken = await getAccessToken();
    const publicKey = await getPublicKey(accessToken);

    console.log('🔒 Cryptage du PIN...');
    const encryptedPin = encryptPin(CONFIG.pin, publicKey);
    console.log('✅ PIN crypté\n');

    await getRetailerBalance(accessToken, encryptedPin);

    console.log('\n✅ Vérification terminée !');
  } catch (error) {
    console.log('\n❌ Échec de la vérification');
    process.exit(1);
  }
}

main();
