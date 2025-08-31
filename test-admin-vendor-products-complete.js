const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testAdminVendorProductsComplete() {
  console.log(`${colors.blue}🧪 Test de l'endpoint admin des produits vendeur complets${colors.reset}\n`);

  let adminToken;

  try {
    // 1. Connexion admin
    console.log(`${colors.yellow}📝 Étape 1: Connexion administrateur${colors.reset}`);
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    adminToken = loginResponse.data.access_token;
    console.log(`${colors.green}✅ Connexion réussie${colors.reset}`);

    // 2. Test de base - Tous les produits
    console.log(`\n${colors.yellow}📝 Étape 2: Récupération de tous les produits${colors.reset}`);
    const allProductsResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log(`${colors.green}✅ Récupération réussie${colors.reset}`);
    console.log(`📊 Nombre de produits: ${allProductsResponse.data.products.length}`);
    console.log(`📈 Statistiques:`, allProductsResponse.data.stats);

    // 3. Test avec pagination
    console.log(`\n${colors.yellow}📝 Étape 3: Test avec pagination${colors.reset}`);
    const paginatedResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?page=1&limit=5`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log(`${colors.green}✅ Pagination réussie${colors.reset}`);
    console.log(`📄 Page actuelle: ${paginatedResponse.data.pagination.currentPage}`);
    console.log(`📋 Éléments par page: ${paginatedResponse.data.pagination.itemsPerPage}`);
    console.log(`📊 Total éléments: ${paginatedResponse.data.pagination.totalItems}`);

    // 4. Test avec filtres de statut
    console.log(`\n${colors.yellow}📝 Étape 4: Test avec filtre de statut${colors.reset}`);
    const statusFilters = ['PENDING', 'PUBLISHED', 'DRAFT'];
    
    for (const status of statusFilters) {
      try {
        const statusResponse = await axios.get(
          `${API_BASE_URL}/vendor-product-validation/all-products?status=${status}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        );
        
        console.log(`${colors.green}✅ Statut ${status}: ${statusResponse.data.products.length} produits${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}❌ Erreur pour le statut ${status}: ${error.response?.data?.message || error.message}${colors.reset}`);
      }
    }

    // 5. Test avec recherche
    console.log(`\n${colors.yellow}📝 Étape 5: Test avec recherche${colors.reset}`);
    const searchResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?search=t-shirt`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log(`${colors.green}✅ Recherche réussie${colors.reset}`);
    console.log(`🔍 Résultats pour "t-shirt": ${searchResponse.data.products.length} produits`);

    // 6. Test avec options d'inclusion
    console.log(`\n${colors.yellow}📝 Étape 6: Test avec options d'inclusion${colors.reset}`);
    const optimizedResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?includeDesigns=false&includeImages=false&includePositions=false&includeTransforms=false&limit=1`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log(`${colors.green}✅ Options d'inclusion réussies${colors.reset}`);
    const product = optimizedResponse.data.products[0];
    if (product) {
      console.log(`📦 Produit optimisé:`, {
        id: product.id,
        name: product.name,
        hasDesign: product.hasDesign,
        hasImages: product.hasImages,
        hasPositions: product.hasPositions,
        hasTransforms: product.hasTransforms
      });
    }

    // 7. Test avec vendeur spécifique
    console.log(`\n${colors.yellow}📝 Étape 7: Test avec vendeur spécifique${colors.reset}`);
    if (allProductsResponse.data.products.length > 0) {
      const firstProduct = allProductsResponse.data.products[0];
      const vendorId = firstProduct.vendor.id;
      
      const vendorResponse = await axios.get(
        `${API_BASE_URL}/vendor-product-validation/all-products?vendorId=${vendorId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      console.log(`${colors.green}✅ Filtre par vendeur réussi${colors.reset}`);
      console.log(`👤 Produits du vendeur ${vendorId}: ${vendorResponse.data.products.length}`);
    }

    // 8. Test des détails complets
    console.log(`\n${colors.yellow}📝 Étape 8: Vérification des nouvelles structures critiques${colors.reset}`);
    const detailedResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?limit=1`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    if (detailedResponse.data.products.length > 0) {
      const product = detailedResponse.data.products[0];
      console.log(`${colors.green}✅ Nouvelles structures vérifiées${colors.reset}`);
      
      // 🆕 Vérifier designApplication
      console.log(`\n🎨 Design Application:`, {
        hasDesign: product.designApplication?.hasDesign,
        designUrl: product.designApplication?.designUrl ? 'Present' : 'Missing',
        positioning: product.designApplication?.positioning,
        scale: product.designApplication?.scale,
        mode: product.designApplication?.mode
      });
      
      // 🆕 Vérifier selectedColors
      console.log(`\n🎨 Selected Colors (${product.selectedColors?.length || 0}):`, 
        product.selectedColors?.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          colorCode: c.colorCode
        }))
      );
      
      // 🆕 Vérifier adminProduct
      console.log(`\n🏭 Admin Product:`, {
        id: product.adminProduct?.id,
        name: product.adminProduct?.name,
        categoriesCount: product.adminProduct?.categories?.length || 0,
        sizesCount: product.adminProduct?.sizes?.length || 0,
        colorVariationsCount: product.adminProduct?.colorVariations?.length || 0
      });
      
      // 🆕 Vérifier designPositions enrichies
      console.log(`\n📍 Design Positions (${product.designPositions?.length || 0}):`, 
        product.designPositions?.slice(0, 1).map(dp => ({
          designId: dp.designId,
          position: dp.position,
          designName: dp.design?.name,
          designUrl: dp.design?.imageUrl ? 'Present' : 'Missing'
        }))
      );
      
      // Propriétés legacy (compatibilité)
      console.log(`\n📋 Legacy Properties:`, {
        id: product.id,
        name: product.name,
        status: product.status,
        statusDisplay: product.statusDisplay,
        vendorName: `${product.vendor.firstName} ${product.vendor.lastName}`,
        baseProductName: product.baseProduct?.name,
        hasDesign: product.hasDesign,
        hasImages: product.hasImages,
        hasPositions: product.hasPositions,
        hasTransforms: product.hasTransforms,
        totalDesignLinks: product.totalDesignLinks
      });

      // Vérifier la structure des délimitations dans adminProduct
      if (product.adminProduct?.colorVariations?.length > 0) {
        const colorVariation = product.adminProduct.colorVariations[0];
        if (colorVariation.images?.length > 0) {
          const image = colorVariation.images[0];
          if (image.delimitations?.length > 0) {
            console.log(`\n🎯 Délimitations dans adminProduct:`, image.delimitations.length);
            console.log(`📐 Première délimitation:`, {
              id: image.delimitations[0].id,
              coordinateType: image.delimitations[0].coordinateType,
              name: image.delimitations[0].name,
              dimensions: {
                x: image.delimitations[0].x,
                y: image.delimitations[0].y,
                width: image.delimitations[0].width,
                height: image.delimitations[0].height
              }
            });
          }
        }
      }
      
      // 🆕 Test de l'ordre de priorité pour designUrl
      console.log(`\n🎯 Test ordre de priorité designUrl:`);
      const designUrl = product.designApplication?.designUrl || 
                       product.design?.imageUrl || 
                       product.designPositions?.[0]?.design?.imageUrl;
      console.log(`📸 Design URL trouvée:`, designUrl ? 'Oui' : 'Non');
      
      // 🆕 Test de la logique des couleurs
      console.log(`\n🌈 Test logique couleurs:`);
      const selectedColors = product.selectedColors?.length > 0 ? 
                            product.selectedColors : 
                            product.adminProduct?.colorVariations?.map(cv => ({
                              id: cv.id, name: cv.name, colorCode: cv.colorCode
                            }));
      console.log(`🎨 Couleurs disponibles:`, selectedColors?.length || 0);
    }

    // 9. Test d'erreur - Accès non autorisé
    console.log(`\n${colors.yellow}📝 Étape 9: Test d'erreur - Accès non autorisé${colors.reset}`);
    try {
      await axios.get(`${API_BASE_URL}/vendor-product-validation/all-products`);
      console.log(`${colors.red}❌ L'endpoint devrait rejeter les requêtes non authentifiées${colors.reset}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`${colors.green}✅ Accès correctement refusé pour les non-authentifiés${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Erreur inattendue: ${error.response?.status}${colors.reset}`);
      }
    }

    // 10. Test de performance
    console.log(`\n${colors.yellow}📝 Étape 10: Test de performance${colors.reset}`);
    const startTime = Date.now();
    
    await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?limit=50`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`${colors.green}✅ Performance mesurée${colors.reset}`);
    console.log(`⏱️ Durée pour 50 produits: ${duration}ms`);
    
    if (duration < 2000) {
      console.log(`${colors.green}🚀 Performance excellente (< 2s)${colors.reset}`);
    } else if (duration < 5000) {
      console.log(`${colors.yellow}⚠️ Performance acceptable (< 5s)${colors.reset}`);
    } else {
      console.log(`${colors.red}🐌 Performance lente (> 5s)${colors.reset}`);
    }

    console.log(`\n${colors.green}🎉 Tous les tests sont passés avec succès !${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors du test:${colors.reset}`);
    console.log(`📋 Message:`, error.response?.data?.message || error.message);
    console.log(`🔢 Code:`, error.response?.status);
    
    if (error.response?.data) {
      console.log(`📄 Détails:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Fonction utilitaire pour analyser les données
function analyzeProductData(products) {
  console.log(`\n${colors.blue}📊 Analyse des données:${colors.reset}`);
  
  const statusCounts = products.reduce((acc, product) => {
    acc[product.status] = (acc[product.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`📈 Répartition par statut:`, statusCounts);
  
  const withDesigns = products.filter(p => p.hasDesign).length;
  const withImages = products.filter(p => p.hasImages).length;
  const withPositions = products.filter(p => p.hasPositions).length;
  
  console.log(`🎨 Produits avec designs: ${withDesigns}/${products.length}`);
  console.log(`🖼️ Produits avec images: ${withImages}/${products.length}`);
  console.log(`📍 Produits avec positions: ${withPositions}/${products.length}`);
}

// Exécuter le test
testAdminVendorProductsComplete();

module.exports = { testAdminVendorProductsComplete }; 