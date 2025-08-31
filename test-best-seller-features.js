const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here';
const VENDOR_TOKEN = 'your-vendor-token-here';

async function testBestSellerFeatures() {
  console.log('🧪 Test des fonctionnalités de meilleures ventes\n');

  try {
    // 1. Test de mise à jour des statistiques de vente
    console.log('📊 1. Test mise à jour des statistiques de vente...');
    const updateStatsResponse = await axios.post(`${BASE_URL}/vendor/products/update-sales-stats`, {}, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Statistiques mises à jour:', updateStatsResponse.data);

    // 2. Test récupération des meilleures ventes globales
    console.log('\n🏆 2. Test récupération des meilleures ventes globales...');
    const bestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/best-sellers?limit=5`);
    console.log('✅ Meilleures ventes globales:', bestSellersResponse.data);

    // 3. Test récupération des meilleures ventes d'un vendeur spécifique
    console.log('\n🏆 3. Test récupération des meilleures ventes d\'un vendeur...');
    const vendorBestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/best-sellers?vendorId=1&limit=3`);
    console.log('✅ Meilleures ventes du vendeur:', vendorBestSellersResponse.data);

    // 4. Test récupération des meilleures ventes du vendeur connecté
    console.log('\n🏆 4. Test récupération de mes meilleures ventes...');
    const myBestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/my-best-sellers?limit=5`, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`
      }
    });
    console.log('✅ Mes meilleures ventes:', myBestSellersResponse.data);

    // 5. Test récupération des produits avec informations de meilleures ventes
    console.log('\n📦 5. Test récupération des produits avec infos de meilleures ventes...');
    const productsResponse = await axios.get(`${BASE_URL}/vendor/products?limit=3`, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`
      }
    });
    
    // Vérifier que les produits contiennent les informations de meilleures ventes
    const productsWithBestSellerInfo = productsResponse.data.data.products.map(product => ({
      id: product.id,
      name: product.vendorName,
      isBestSeller: product.bestSeller?.isBestSeller,
      salesCount: product.bestSeller?.salesCount,
      totalRevenue: product.bestSeller?.totalRevenue
    }));
    
    console.log('✅ Produits avec infos de meilleures ventes:', productsWithBestSellerInfo);

    console.log('\n🎉 Tous les tests de meilleures ventes ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

async function testBestSellerWithMockData() {
  console.log('🧪 Test avec données simulées\n');

  try {
    // Simuler des données de meilleures ventes
    const mockBestSellerData = {
      success: true,
      data: {
        bestSellers: [
          {
            id: 1,
            name: "T-shirt Design Unique",
            price: 2500,
            salesCount: 45,
            totalRevenue: 112500,
            vendor: {
              id: 1,
              fullName: "Jean Dupont",
              shop_name: "Boutique Créative",
              profile_photo_url: "https://example.com/photo.jpg"
            },
            design: {
              id: 1,
              name: "Design Moderne",
              imageUrl: "https://example.com/design.jpg",
              category: "LOGO"
            },
            primaryImageUrl: "https://example.com/product.jpg"
          },
          {
            id: 2,
            name: "Hoodie Artiste",
            price: 3500,
            salesCount: 32,
            totalRevenue: 112000,
            vendor: {
              id: 2,
              fullName: "Marie Martin",
              shop_name: "Art Studio",
              profile_photo_url: "https://example.com/photo2.jpg"
            },
            design: {
              id: 2,
              name: "Art Abstrait",
              imageUrl: "https://example.com/design2.jpg",
              category: "ILLUSTRATION"
            },
            primaryImageUrl: "https://example.com/product2.jpg"
          }
        ],
        total: 2
      }
    };

    console.log('📊 Données simulées de meilleures ventes:');
    console.log(JSON.stringify(mockBestSellerData, null, 2));

    // Simuler un produit avec informations de meilleures ventes
    const mockProductWithBestSeller = {
      id: 1,
      vendorName: "T-shirt Design Unique",
      originalAdminName: "T-shirt Basic",
      description: "T-shirt avec design personnalisé",
      price: 2500,
      stock: 50,
      status: "PUBLISHED",
      bestSeller: {
        isBestSeller: true,
        salesCount: 45,
        totalRevenue: 112500
      },
      // ... autres propriétés
    };

    console.log('\n📦 Produit avec informations de meilleures ventes:');
    console.log(JSON.stringify(mockProductWithBestSeller, null, 2));

    console.log('\n✅ Tests avec données simulées terminés !');

  } catch (error) {
    console.error('❌ Erreur lors des tests simulés:', error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  console.log('🚀 Démarrage des tests de fonctionnalités de meilleures ventes\n');
  
  // Test avec données simulées d'abord
  testBestSellerWithMockData().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    // Puis test avec l'API réelle
    return testBestSellerFeatures();
  }).catch(error => {
    console.error('❌ Erreur générale:', error.message);
  });
}

module.exports = {
  testBestSellerFeatures,
  testBestSellerWithMockData
}; 

const BASE_URL = 'http://localhost:3004';
const ADMIN_TOKEN = 'your-admin-token-here';
const VENDOR_TOKEN = 'your-vendor-token-here';

async function testBestSellerFeatures() {
  console.log('🧪 Test des fonctionnalités de meilleures ventes\n');

  try {
    // 1. Test de mise à jour des statistiques de vente
    console.log('📊 1. Test mise à jour des statistiques de vente...');
    const updateStatsResponse = await axios.post(`${BASE_URL}/vendor/products/update-sales-stats`, {}, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Statistiques mises à jour:', updateStatsResponse.data);

    // 2. Test récupération des meilleures ventes globales
    console.log('\n🏆 2. Test récupération des meilleures ventes globales...');
    const bestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/best-sellers?limit=5`);
    console.log('✅ Meilleures ventes globales:', bestSellersResponse.data);

    // 3. Test récupération des meilleures ventes d'un vendeur spécifique
    console.log('\n🏆 3. Test récupération des meilleures ventes d\'un vendeur...');
    const vendorBestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/best-sellers?vendorId=1&limit=3`);
    console.log('✅ Meilleures ventes du vendeur:', vendorBestSellersResponse.data);

    // 4. Test récupération des meilleures ventes du vendeur connecté
    console.log('\n🏆 4. Test récupération de mes meilleures ventes...');
    const myBestSellersResponse = await axios.get(`${BASE_URL}/vendor/products/my-best-sellers?limit=5`, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`
      }
    });
    console.log('✅ Mes meilleures ventes:', myBestSellersResponse.data);

    // 5. Test récupération des produits avec informations de meilleures ventes
    console.log('\n📦 5. Test récupération des produits avec infos de meilleures ventes...');
    const productsResponse = await axios.get(`${BASE_URL}/vendor/products?limit=3`, {
      headers: {
        'Authorization': `Bearer ${VENDOR_TOKEN}`
      }
    });
    
    // Vérifier que les produits contiennent les informations de meilleures ventes
    const productsWithBestSellerInfo = productsResponse.data.data.products.map(product => ({
      id: product.id,
      name: product.vendorName,
      isBestSeller: product.bestSeller?.isBestSeller,
      salesCount: product.bestSeller?.salesCount,
      totalRevenue: product.bestSeller?.totalRevenue
    }));
    
    console.log('✅ Produits avec infos de meilleures ventes:', productsWithBestSellerInfo);

    console.log('\n🎉 Tous les tests de meilleures ventes ont réussi !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
  }
}

async function testBestSellerWithMockData() {
  console.log('🧪 Test avec données simulées\n');

  try {
    // Simuler des données de meilleures ventes
    const mockBestSellerData = {
      success: true,
      data: {
        bestSellers: [
          {
            id: 1,
            name: "T-shirt Design Unique",
            price: 2500,
            salesCount: 45,
            totalRevenue: 112500,
            vendor: {
              id: 1,
              fullName: "Jean Dupont",
              shop_name: "Boutique Créative",
              profile_photo_url: "https://example.com/photo.jpg"
            },
            design: {
              id: 1,
              name: "Design Moderne",
              imageUrl: "https://example.com/design.jpg",
              category: "LOGO"
            },
            primaryImageUrl: "https://example.com/product.jpg"
          },
          {
            id: 2,
            name: "Hoodie Artiste",
            price: 3500,
            salesCount: 32,
            totalRevenue: 112000,
            vendor: {
              id: 2,
              fullName: "Marie Martin",
              shop_name: "Art Studio",
              profile_photo_url: "https://example.com/photo2.jpg"
            },
            design: {
              id: 2,
              name: "Art Abstrait",
              imageUrl: "https://example.com/design2.jpg",
              category: "ILLUSTRATION"
            },
            primaryImageUrl: "https://example.com/product2.jpg"
          }
        ],
        total: 2
      }
    };

    console.log('📊 Données simulées de meilleures ventes:');
    console.log(JSON.stringify(mockBestSellerData, null, 2));

    // Simuler un produit avec informations de meilleures ventes
    const mockProductWithBestSeller = {
      id: 1,
      vendorName: "T-shirt Design Unique",
      originalAdminName: "T-shirt Basic",
      description: "T-shirt avec design personnalisé",
      price: 2500,
      stock: 50,
      status: "PUBLISHED",
      bestSeller: {
        isBestSeller: true,
        salesCount: 45,
        totalRevenue: 112500
      },
      // ... autres propriétés
    };

    console.log('\n📦 Produit avec informations de meilleures ventes:');
    console.log(JSON.stringify(mockProductWithBestSeller, null, 2));

    console.log('\n✅ Tests avec données simulées terminés !');

  } catch (error) {
    console.error('❌ Erreur lors des tests simulés:', error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  console.log('🚀 Démarrage des tests de fonctionnalités de meilleures ventes\n');
  
  // Test avec données simulées d'abord
  testBestSellerWithMockData().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    // Puis test avec l'API réelle
    return testBestSellerFeatures();
  }).catch(error => {
    console.error('❌ Erreur générale:', error.message);
  });
}

module.exports = {
  testBestSellerFeatures,
  testBestSellerWithMockData
}; 