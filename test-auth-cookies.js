const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

async function testAuthEndpoints() {
  console.log('🔐 Test des Endpoints d\'Authentification\n');
  console.log(`📡 Base URL: ${BASE_URL}\n`);

  // Test 1: Health check sans auth
  console.log('📋 Test 1: Health check public');
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log(`✅ Accès public réussi: ${response.status}`);
  } catch (error) {
    console.log(`❌ Erreur accès public: ${error.response?.status || error.message}`);
  }

  // Test 2: Endpoint vendeur sans auth (doit échouer)
  console.log('\n📋 Test 2: Endpoint vendeur sans authentification (doit échouer)');
  try {
    const response = await axios.get(`${BASE_URL}/vendor/health`);
    console.log(`⚠️ Accès non autorisé réussi: ${response.status} (problème de sécurité!)`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ Accès refusé comme attendu: ${error.response.status}`);
    } else {
      console.log(`❌ Erreur inattendue: ${error.response?.status || error.message}`);
    }
  }

  console.log('\n🍪 Instructions pour tester avec vos cookies:');
  console.log('1. Connectez-vous sur votre frontend');
  console.log('2. Ouvrez DevTools > Application > Cookies');
  console.log('3. Cherchez un cookie nommé "auth_token" ou "jwt"');
  console.log('4. Copiez sa valeur');
  console.log('5. Exécutez: node test-auth-cookies.js test-cookie <VALEUR_COOKIE>');
  console.log('');
  console.log('💡 Exemple:');
  console.log('   node test-auth-cookies.js test-cookie eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
}

async function testWithCookie(cookieValue) {
  console.log('🍪 Test avec Cookie JWT\n');
  console.log(`🔑 Cookie testé: ${cookieValue.substring(0, 50)}...\n`);

  // Tester avec cookie auth_token (nom attendu par le backend)
  console.log('📋 Test avec cookie "auth_token":');
  try {
    const response = await axios.get(`${BASE_URL}/vendor/health`, {
      headers: {
        'Cookie': `auth_token=${cookieValue}`
      }
    });
    console.log(`✅ Authentification réussie avec auth_token: ${response.status}`);
    console.log(`📊 Réponse:`, response.data);
  } catch (error) {
    console.log(`❌ Échec avec auth_token: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📝 Détails:`, error.response.data);
    }
  }

  // Tester avec cookie jwt (nom alternatif)
  console.log('\n📋 Test avec cookie "jwt":');
  try {
    const response = await axios.get(`${BASE_URL}/vendor/health`, {
      headers: {
        'Cookie': `jwt=${cookieValue}`
      }
    });
    console.log(`✅ Authentification réussie avec jwt: ${response.status}`);
    console.log(`📊 Réponse:`, response.data);
  } catch (error) {
    console.log(`❌ Échec avec jwt: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📝 Détails:`, error.response.data);
    }
  }

  // Tester avec header Authorization Bearer
  console.log('\n📋 Test avec header Authorization Bearer:');
  try {
    const response = await axios.get(`${BASE_URL}/vendor/health`, {
      headers: {
        'Authorization': `Bearer ${cookieValue}`
      }
    });
    console.log(`✅ Authentification réussie avec Bearer: ${response.status}`);
    console.log(`📊 Réponse:`, response.data);
  } catch (error) {
    console.log(`❌ Échec avec Bearer: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📝 Détails:`, error.response.data);
    }
  }
}

async function testVendorPublish(cookieValue) {
  console.log('\n🚀 Test de l\'endpoint de publication vendeur\n');

  const testPayload = {
    baseProductId: 1,
    designUrl: 'blob:http://localhost:5173/test-design-url',
    designFile: {
      name: 'test-design.png',
      size: 245760,
      type: 'image/png'
    },
    finalImages: {
      colorImages: {
        'Rouge': {
          colorInfo: { id: 1, name: 'Rouge', colorCode: '#ff0000' },
          imageUrl: 'blob:http://localhost:5173/image-rouge-test',
          imageKey: '1_1'
        }
      },
      statistics: {
        totalColorImages: 1,
        hasDefaultImage: false,
        availableColors: ['Rouge'],
        totalImagesGenerated: 1
      }
    },
    vendorPrice: 15000,
    vendorName: 'Test Product',
    vendorDescription: 'Produit de test',
    vendorStock: 50,
    basePriceAdmin: 12000,
    selectedSizes: [{ id: 1, sizeName: 'S' }],
    selectedColors: [{ id: 1, name: 'Rouge', colorCode: '#ff0000' }],
    previewView: {
      viewType: 'FRONT',
      url: 'https://example.com/preview.jpg',
      delimitations: []
    },
    publishedAt: new Date().toISOString(),
    finalImagesBase64: {
      'Rouge': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFN'
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/vendor/publish`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${cookieValue}`
      }
    });
    console.log(`✅ Publication test réussie: ${response.status}`);
    console.log(`📊 Réponse:`, response.data);
  } catch (error) {
    console.log(`❌ Échec publication test: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📝 Détails:`, error.response.data);
    }
  }
}

async function decodeJWT(token) {
  console.log('\n🔍 Analyse du Token JWT\n');
  
  try {
    // Décoder le JWT (sans vérification de signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Format JWT invalide');
      return;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('📋 Header JWT:');
    console.log(JSON.stringify(header, null, 2));
    
    console.log('\n📋 Payload JWT:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Vérifier l'expiration
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      console.log(`\n⏰ Expiration: ${expDate}`);
      console.log(`⏰ Maintenant: ${now}`);
      
      if (expDate < now) {
        console.log('❌ Token expiré !');
      } else {
        console.log('✅ Token encore valide');
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur décodage JWT:', error.message);
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🔐 Utilitaire de Test d\'Authentification\n');

  switch (command) {
    case 'test-cookie':
      const cookieValue = args[1];
      if (!cookieValue) {
        console.log('❌ Usage: node test-auth-cookies.js test-cookie <VALEUR_COOKIE>');
        return;
      }
      await decodeJWT(cookieValue);
      await testWithCookie(cookieValue);
      await testVendorPublish(cookieValue);
      break;
      
    case 'decode':
      const token = args[1];
      if (!token) {
        console.log('❌ Usage: node test-auth-cookies.js decode <JWT_TOKEN>');
        return;
      }
      await decodeJWT(token);
      break;
      
    default:
      await testAuthEndpoints();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
} 