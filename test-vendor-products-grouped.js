const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

async function testVendorProductsGrouped() {
  console.log('🧪 === TEST ENDPOINT PRODUITS VENDEURS GROUPÉS ===\n');
  
  try {
    // 1. Test de connexion simple
    console.log('📡 Test de connectivité...');
    await axios.get(`${API_BASE_URL}/vendor/health`);
    console.log('✅ Serveur accessible\n');

    // 2. Test de récupération groupée sans authentification (devrait échouer)
    console.log('🔒 Test de sécurité (sans auth)...');
    try {
      await axios.get(`${API_BASE_URL}/vendor/products/grouped`);
      console.log('❌ ERREUR: L\'endpoint devrait être protégé');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint correctement protégé (401)\n');
      } else {
        console.log(`⚠️ Erreur inattendue: ${error.response?.status}\n`);
      }
    }

    // 3. Test avec authentification admin (pour voir tous les produits)
    console.log('👑 Test avec compte administrateur...');
    
    // Connexion admin
    const adminResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@printalma.com',
      password: 'admin123'
    });
    console.log('✅ Connexion admin réussie');
    
    const adminToken = adminResponse.data.access_token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Test de récupération groupée
    console.log('📦 Récupération des produits vendeurs groupés...\n');
    
    const groupedResponse = await axios.get(`${API_BASE_URL}/vendor/products/grouped`, { headers });
    
    if (groupedResponse.data.success) {
      console.log('✅ Réponse reçue avec succès');
      console.log(`📊 Statistiques:`);
      console.log(`   - Total produits: ${groupedResponse.data.statistics.totalProducts}`);
      console.log(`   - Total groupes: ${groupedResponse.data.statistics.totalGroups}`);
      console.log(`   - Répartition par type:`);
      
      Object.entries(groupedResponse.data.statistics.groupCounts).forEach(([type, count]) => {
        console.log(`     📦 ${type}: ${count} produits`);
      });
      
      console.log('\n🔍 Détail des groupes:');
      Object.entries(groupedResponse.data.data).forEach(([productType, products]) => {
        console.log(`\n📦 === ${productType.toUpperCase()} (${products.length} produits) ===`);
        
        products.slice(0, 2).forEach((product, index) => {
          console.log(`\n   ${index + 1}. ${product.vendorName}`);
          console.log(`      💰 Prix: ${product.price} FCFA`);
          console.log(`      👤 Vendeur: ${product.vendor.fullName} (${product.vendor.shop_name || 'Pas de boutique'})`);
          console.log(`      📏 Tailles: ${product.selectedSizes.map(s => s.sizeName).join(', ')}`);
          console.log(`      🎨 Couleurs: ${product.selectedColors.map(c => c.name).join(', ')}`);
          console.log(`      🖼️ Images:`);
          console.log(`         - Total: ${product.images.total}`);
          console.log(`         - Par couleur: ${Object.keys(product.images.colorImages).length} couleurs`);
          console.log(`         - URL principale: ${product.images.primaryImageUrl ? 'Disponible' : 'Non disponible'}`);
          console.log(`      📅 Créé le: ${new Date(product.createdAt).toLocaleDateString('fr-FR')}`);
          console.log(`      ✅ Statut: ${product.status}`);
          
          // Détail des images par couleur
          if (Object.keys(product.images.colorImages).length > 0) {
            console.log(`      🎨 Images par couleur:`);
            Object.entries(product.images.colorImages).forEach(([colorName, images]) => {
              console.log(`         - ${colorName}: ${images.length} image(s)`);
            });
          }
        });
        
        if (products.length > 2) {
          console.log(`   ... et ${products.length - 2} autres produits`);
        }
      });
      
    } else {
      console.log('❌ Erreur dans la réponse:', groupedResponse.data);
    }

    // 4. Test avec filtres
    console.log('\n\n🔍 Test avec filtres...');
    
    // Test avec statut PUBLISHED
    const publishedResponse = await axios.get(`${API_BASE_URL}/vendor/products/grouped?status=PUBLISHED`, { headers });
    console.log(`✅ Filtre PUBLISHED: ${publishedResponse.data.statistics.totalProducts} produits`);
    
    // Test avec recherche
    const searchResponse = await axios.get(`${API_BASE_URL}/vendor/products/grouped?search=shirt`, { headers });
    console.log(`✅ Recherche "shirt": ${searchResponse.data.statistics.totalProducts} produits`);

    // 5. Test avec un vendeur spécifique (si on en trouve un)
    if (groupedResponse.data.statistics.totalProducts > 0) {
      const firstProduct = Object.values(groupedResponse.data.data)[0][0];
      const vendorId = firstProduct.vendorId;
      
      console.log(`\n👤 Test avec vendeur spécifique (ID: ${vendorId})...`);
      const vendorSpecificResponse = await axios.get(`${API_BASE_URL}/vendor/products/grouped?vendorId=${vendorId}`, { headers });
      console.log(`✅ Produits du vendeur ${vendorId}: ${vendorSpecificResponse.data.statistics.totalProducts} produits`);
    }

    // 6. Vérification de la structure des données
    console.log('\n🏗️ Vérification de la structure des données...');
    
    if (groupedResponse.data.statistics.totalProducts > 0) {
      const firstGroup = Object.values(groupedResponse.data.data)[0];
      const firstProduct = firstGroup[0];
      
      const requiredFields = ['id', 'vendorName', 'price', 'selectedSizes', 'selectedColors', 'images'];
      const missingFields = requiredFields.filter(field => !(field in firstProduct));
      
      if (missingFields.length === 0) {
        console.log('✅ Tous les champs requis sont présents');
      } else {
        console.log(`❌ Champs manquants: ${missingFields.join(', ')}`);
      }
      
      // Vérification des images
      if (firstProduct.images && firstProduct.images.colorImages) {
        console.log('✅ Structure des images correcte');
      } else {
        console.log('❌ Structure des images incorrecte');
      }
      
      // Vérification des informations vendeur
      if (firstProduct.vendor && firstProduct.vendor.fullName) {
        console.log('✅ Informations vendeur présentes');
      } else {
        console.log('❌ Informations vendeur manquantes');
      }
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.response?.data?.message) {
      console.error('Message d\'erreur:', error.response.data.message);
    }
    
    if (error.response?.status) {
      console.error('Code de statut:', error.response.status);
    }
  }
}

// Fonction pour tester avec un vendeur authentifié
async function testAsVendor() {
  console.log('\n👤 === TEST AVEC COMPTE VENDEUR ===\n');
  
  try {
    // Connexion vendeur (utilise un compte vendeur existant)
    const vendorLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'vendeur@test.com', // Adapter selon vos données de test
      password: 'password123'
    });
    
    const vendorToken = vendorLogin.data.access_token;
    const vendorHeaders = { Authorization: `Bearer ${vendorToken}` };
    
    console.log('✅ Connexion vendeur réussie');
    
    // Test de récupération (le vendeur ne devrait voir que ses propres produits)
    const vendorProductsResponse = await axios.get(`${API_BASE_URL}/vendor/products/grouped`, { 
      headers: vendorHeaders 
    });
    
    console.log(`📦 Produits du vendeur: ${vendorProductsResponse.data.statistics.totalProducts}`);
    console.log(`📊 Groupes: ${vendorProductsResponse.data.statistics.totalGroups}`);
    
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 401) {
      console.log('⚠️ Pas de compte vendeur de test disponible (normal)');
    } else {
      console.error('❌ Erreur test vendeur:', error.response?.data || error.message);
    }
  }
}

// Fonction pour créer un exemple de réponse
function showExampleResponse() {
  console.log('\n📋 === EXEMPLE DE STRUCTURE DE RÉPONSE ===\n');
  
  const exampleResponse = {
    success: true,
    data: {
      "Tshirt": [
        {
          id: 1,
          vendorName: "T-shirt Rouge Flamme Design",
          price: 15000,
          selectedSizes: [
            { id: 1, sizeName: "S" },
            { id: 2, sizeName: "M" },
            { id: 3, sizeName: "L" }
          ],
          selectedColors: [
            { id: 12, name: "Rouge", colorCode: "#ff0000" },
            { id: 13, name: "Vert", colorCode: "#00ff00" }
          ],
          images: {
            total: 3,
            colorImages: {
              "Rouge": [
                {
                  id: 101,
                  url: "https://res.cloudinary.com/printalma/image/upload/...",
                  colorName: "Rouge",
                  colorCode: "#ff0000"
                }
              ],
              "Vert": [
                {
                  id: 102,
                  url: "https://res.cloudinary.com/printalma/image/upload/...",
                  colorName: "Vert",
                  colorCode: "#00ff00"
                }
              ]
            },
            primaryImageUrl: "https://res.cloudinary.com/printalma/image/upload/..."
          },
          vendor: {
            id: 5,
            fullName: "Jean Durand",
            shop_name: "Boutique Design JD"
          }
        }
      ],
      "Casquette": [
        {
          // Structure similaire...
        }
      ]
    },
    statistics: {
      totalProducts: 15,
      totalGroups: 3,
      groupCounts: {
        "Tshirt": 8,
        "Casquette": 5,
        "Mug": 2
      }
    }
  };
  
  console.log(JSON.stringify(exampleResponse, null, 2));
}

// Exécution des tests
async function runAllTests() {
  await testVendorProductsGrouped();
  await testAsVendor();
  showExampleResponse();
}

// Lancement des tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testVendorProductsGrouped,
  testAsVendor,
  showExampleResponse
}; 