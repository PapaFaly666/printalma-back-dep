const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Données de test pour publication produit vendeur
const testProductData = {
  baseProductId: 2,
  vendorPrice: 25.99,
  basePriceAdmin: 15.99,
  selectedColors: [
    { id: 4, name: "Blanc", colorCode: "#ffffff" },
    { id: 5, name: "Noir", colorCode: "#000000" }
  ],
  selectedSizes: [
    { id: 1, name: "S" },
    { id: 2, name: "M" },
    { id: 3, name: "L" }
  ],
  designUrl: "https://res.cloudinary.com/demo/test-design.png",
  vendorName: "T-shirt Premium Test",
  vendorDescription: "T-shirt de qualité premium avec design personnalisé",
  vendorStock: 50,
  finalImages: {
    statistics: {
      totalImagesGenerated: 2
    },
    colorImages: {
      "Blanc": {
        colorInfo: { id: 4, name: "Blanc", colorCode: "#ffffff" },
        imageUrl: "blob:http://localhost:5174/test-blanc",
        imageKey: "Blanc"
      },
      "Noir": {
        colorInfo: { id: 5, name: "Noir", colorCode: "#000000" },
        imageUrl: "blob:http://localhost:5174/test-noir", 
        imageKey: "Noir"
      }
    }
  },
  finalImagesBase64: {
    "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "Noir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
};

// Fonction pour tester la connexion
async function testConnection() {
  try {
    console.log('🔗 Test de connexion API...');
    const response = await axios.get(`${API_BASE}/vendor/health`);
    console.log('✅ Connexion API réussie:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion API:', error.message);
    return false;
  }
}

// Fonction pour tester l'authentification vendeur
async function testVendorAuth() {
  try {
    console.log('\n🔐 Test authentification vendeur...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    });

    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      throw new Error('Pas de cookies reçus');
    }

    console.log('✅ Authentification réussie');
    console.log('🍪 Cookies reçus:', cookies.length);

    return cookies.join('; ');
  } catch (error) {
    console.error('❌ Erreur authentification:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour tester la publication de produit avec images
async function testProductPublication(cookies) {
  try {
    console.log('\n📦 Test publication produit vendeur avec images...');
    
    const response = await axios.post(`${API_BASE}/vendor/publish`, testProductData, {
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Publication réussie:');
    console.log('📋 Product ID:', response.data.productId);
    console.log('🖼️ Images processées:', response.data.imagesProcessed);
    console.log('📊 Détails images:', response.data.imageDetails);
    
    return response.data.productId;
  } catch (error) {
    console.error('❌ Erreur publication:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour tester la récupération des produits avec images Cloudinary
async function testGetVendorProducts(cookies, vendorId = null) {
  try {
    console.log('\n🔍 Test récupération produits vendeur avec images...');
    
    const url = vendorId ? `${API_BASE}/vendor/products/${vendorId}` : `${API_BASE}/vendor/products`;
    
    const response = await axios.get(url, {
      headers: {
        'Cookie': cookies
      }
    });

    console.log('✅ Récupération réussie:');
    console.log('📊 Réponse structure:', {
      success: response.data.success,
      totalProducts: response.data.data?.pagination?.total || 0,
      productsReturned: response.data.data?.products?.length || 0
    });

    if (response.data.data?.products?.length > 0) {
      const product = response.data.data.products[0];
      console.log('\n📦 Premier produit détails:');
      console.log('  ID:', product.id);
      console.log('  Nom:', product.vendorName);
      console.log('  Description:', product.vendorDescription);
      console.log('  Prix:', product.price);
      console.log('  Stock:', product.vendorStock);
      console.log('  Status:', product.status);
      
      console.log('\n🖼️ Images détails:');
      console.log('  Total images:', product.images?.total || 0);
      console.log('  Images couleur:', product.images?.colorImages?.length || 0);
      console.log('  Images par défaut:', product.images?.defaultImages?.length || 0);
      console.log('  URL principale:', product.images?.primaryImageUrl || 'Aucune');
      
      if (product.images?.colorImages?.length > 0) {
        console.log('\n🎨 Images couleur détails:');
        product.images.colorImages.forEach((img, index) => {
          console.log(`    ${index + 1}. ${img.colorName} (${img.colorCode})`);
          console.log(`       URL Cloudinary: ${img.cloudinaryUrl}`);
          console.log(`       Public ID: ${img.cloudinaryPublicId}`);
          console.log(`       Format: ${img.format}`);
          console.log(`       Taille: ${img.fileSize ? Math.round(img.fileSize / 1024) + 'KB' : 'N/A'}`);
        });
      }

      console.log('\n📋 Couleurs sélectionnées:', product.selectedColors);
      console.log('📏 Tailles sélectionnées:', product.selectedSizes);
      
      console.log('\n📊 Statistiques:');
      console.log('  Images complètes:', product.stats?.hasAllColors ? '✅' : '❌');
      console.log('  Taille totale fichiers:', product.stats?.totalFileSize ? Math.round(product.stats.totalFileSize / 1024) + 'KB' : 'N/A');
    }

    return response.data.data?.products || [];
  } catch (error) {
    console.error('❌ Erreur récupération:', error.response?.data || error.message);
    return [];
  }
}

// Fonction pour tester les statistiques vendeur  
async function testVendorStats(cookies) {
  try {
    console.log('\n📊 Test statistiques vendeur...');
    
    const response = await axios.get(`${API_BASE}/vendor/stats`, {
      headers: {
        'Cookie': cookies
      }
    });

    console.log('✅ Statistiques récupérées:');
    console.log('📋 Stats:', response.data.stats);
    
    return response.data.stats;
  } catch (error) {
    console.error('❌ Erreur stats:', error.response?.data || error.message);
    return null;
  }
}

// Test principal
async function runCompleteTest() {
  console.log('🧪 === TEST SYSTÈME VENDEUR COMPLET AVEC IMAGES CLOUDINARY ===\n');

  // 1. Test connexion
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('💥 Arrêt des tests - pas de connexion');
    return;
  }

  // 2. Test auth
  const cookies = await testVendorAuth();
  if (!cookies) {
    console.log('💥 Arrêt des tests - authentification échouée');
    return;
  }

  // 3. Test publication produit
  const productId = await testProductPublication(cookies);
  if (!productId) {
    console.log('⚠️ Publication échouée mais on continue...');
  }

  // 4. Test récupération produits
  const products = await testGetVendorProducts(cookies);
  
  // 5. Test stats
  await testVendorStats(cookies);

  console.log('\n🎉 === TESTS TERMINÉS ===');
  console.log(`📊 Résumé:`);
  console.log(`  - Publication: ${productId ? '✅' : '❌'}`);
  console.log(`  - Récupération: ${products.length > 0 ? '✅' : '❌'}`);
  console.log(`  - Images trouvées: ${products.reduce((sum, p) => sum + (p.images?.total || 0), 0)}`);
}

// Exécuter les tests
if (require.main === module) {
  runCompleteTest()
    .then(() => {
      console.log('\n✅ Tests terminés');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur tests:', error);
      process.exit(1);
    });
}

module.exports = {
  testConnection,
  testVendorAuth,
  testProductPublication,
  testGetVendorProducts,
  testVendorStats
}; 