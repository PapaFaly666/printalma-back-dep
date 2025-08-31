const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testSimpleAuth() {
  console.log('🔐 === TEST AUTHENTIFICATION SIMPLE ===\n');

  try {
    // 1. Vérifier si le serveur répond
    console.log('1️⃣ Test serveur...');
    try {
      await axios.get(`${API_BASE}/vendor/health`);
      console.log('❌ Endpoint health non protégé');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('🚨 SERVEUR NON DÉMARRÉ - Veuillez lancer: npm run start:dev');
        return;
      }
      console.log('✅ Serveur actif (erreur auth normale)');
    }

    // 2. Test login vendeur
    console.log('\n2️⃣ Test login vendeur...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com', 
      password: 'password123'
    });

    console.log('✅ Login réussi');
    const cookies = loginResponse.headers['set-cookie'];
    console.log('🍪 Cookies reçus:', cookies?.length || 0);

    if (!cookies) {
      console.log('❌ Pas de cookies - problème de configuration');
      return;
    }

    // Extraire le cookie principal
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('🍪 Cookie string:', cookieStr);

    // 3. Test endpoint vendeur avec cookies
    console.log('\n3️⃣ Test endpoint vendeur...');
    const vendorResponse = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Cookie': cookieStr
      }
    });

    console.log('✅ Endpoint vendeur accessible');
    console.log('📊 Structure réponse:', {
      success: vendorResponse.data.success,
      hasData: !!vendorResponse.data.data,
      productsCount: vendorResponse.data.data?.products?.length || 0
    });

    // 4. Test publication produit
    console.log('\n4️⃣ Test publication produit...');
    const testProduct = {
      baseProductId: 2,
      vendorPrice: 25.99,
      basePriceAdmin: 15.99,
      vendorName: "Test Product",
      vendorDescription: "Description test",
      vendorStock: 10,
      selectedColors: [{ id: 4, name: "Blanc", colorCode: "#ffffff" }],
      selectedSizes: [{ id: 1, name: "S" }],
      designUrl: "https://test.com/design.png",
      finalImages: {
        statistics: { totalImagesGenerated: 1 },
        colorImages: {
          "Blanc": {
            colorInfo: { id: 4, name: "Blanc", colorCode: "#ffffff" },
            imageUrl: "blob:test",
            imageKey: "Blanc"
          }
        }
      },
      finalImagesBase64: {
        "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      }
    };

    const publishResponse = await axios.post(`${API_BASE}/vendor/publish`, testProduct, {
      headers: {
        'Cookie': cookieStr,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Publication réussie:', {
      productId: publishResponse.data.productId,
      imagesProcessed: publishResponse.data.imagesProcessed
    });

    // 5. Re-test récupération produits
    console.log('\n5️⃣ Re-test récupération après publication...');
    const newVendorResponse = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Cookie': cookieStr
      }
    });

    console.log('✅ Produits après publication:', {
      total: newVendorResponse.data.data?.pagination?.total || 0,
      returned: newVendorResponse.data.data?.products?.length || 0
    });

    if (newVendorResponse.data.data?.products?.length > 0) {
      const product = newVendorResponse.data.data.products[0];
      console.log('\n📦 Premier produit détails:');
      console.log('  - ID:', product.id);
      console.log('  - Nom:', product.vendorName);
      console.log('  - Prix:', product.price);
      console.log('  - Images total:', product.images?.total || 0);
      console.log('  - Images couleur:', product.images?.colorImages?.length || 0);
      
      if (product.images?.colorImages?.length > 0) {
        console.log('  - Première image URL:', product.images.colorImages[0].cloudinaryUrl);
      }
    }

    // 6. Test admin si possible
    console.log('\n6️⃣ Test admin...');
    try {
      const adminResponse = await axios.get(`${API_BASE}/auth/admin/clients?page=1&limit=10`, {
        headers: {
          'Cookie': cookieStr
        }
      });
      console.log('✅ Admin accessible - utilisateur a les droits admin');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('📋 Admin non accessible - utilisateur vendeur (normal)');
      } else {
        console.log('❌ Erreur admin:', error.response?.status, error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testSimpleAuth();
}

module.exports = { testSimpleAuth }; 