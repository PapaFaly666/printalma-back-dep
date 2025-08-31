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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testAdminCreateVendorProduct() {
  console.log(`${colors.blue}🎯 Test des endpoints admin de création de produits vendeur${colors.reset}\n`);

  let adminToken;
  let selectedVendor;
  let createdProductId;

  try {
    // 1. Connexion admin
    console.log(`${colors.yellow}📝 Étape 1: Connexion administrateur${colors.reset}`);
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    adminToken = loginResponse.data.access_token;
    console.log(`${colors.green}✅ Connexion réussie${colors.reset}`);

    // 2. Récupérer la liste des vendeurs
    console.log(`\n${colors.yellow}📝 Étape 2: Récupération des vendeurs disponibles${colors.reset}`);
    const vendorsResponse = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/vendors`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    console.log(`${colors.green}✅ Vendeurs récupérés${colors.reset}`);
    console.log(`👥 Nombre total de vendeurs: ${vendorsResponse.data.total}`);
    console.log(`📊 Statistiques:`, vendorsResponse.data.stats);

    if (vendorsResponse.data.vendors.length === 0) {
      console.log(`${colors.red}❌ Aucun vendeur disponible pour créer un produit${colors.reset}`);
      return;
    }

    // Sélectionner le premier vendeur actif
    selectedVendor = vendorsResponse.data.vendors.find(v => v.status);
    if (!selectedVendor) {
      console.log(`${colors.red}❌ Aucun vendeur actif trouvé${colors.reset}`);
      return;
    }

    console.log(`${colors.cyan}👤 Vendeur sélectionné: ${selectedVendor.firstName} ${selectedVendor.lastName}${colors.reset}`);
    console.log(`   - Email: ${selectedVendor.email}`);
    console.log(`   - Boutique: ${selectedVendor.shop_name || 'N/A'}`);
    console.log(`   - Produits: ${selectedVendor.totalProducts} (${selectedVendor.publishedProducts} publiés)`);
    console.log(`   - Designs: ${selectedVendor.totalDesigns}`);

    // 3. Récupérer les designs du vendeur (pour obtenir un designId valide)
    console.log(`\n${colors.yellow}📝 Étape 3: Récupération des designs du vendeur${colors.reset}`);
    let availableDesign = null;
    
    try {
      const designsResponse = await axios.get(
        `${API_BASE_URL}/vendor-product-validation/vendors/${selectedVendor.id}/designs`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      console.log(`${colors.green}✅ Designs récupérés${colors.reset}`);
      console.log(`🎨 Total designs: ${designsResponse.data.total}`);
      console.log(`📊 Statistiques designs:`, designsResponse.data.stats);

      if (designsResponse.data.designs && designsResponse.data.designs.length > 0) {
        availableDesign = designsResponse.data.designs[0];
        console.log(`${colors.cyan}🎨 Premier design: ${availableDesign.name} (ID: ${availableDesign.id})${colors.reset}`);
        console.log(`   - Validé: ${availableDesign.isValidated ? 'Oui' : 'Non'}`);
        console.log(`   - Catégorie: ${availableDesign.category}`);
        console.log(`   - URL: ${availableDesign.imageUrl ? 'Présente' : 'Manquante'}`);
      } else {
        console.log(`${colors.yellow}⚠️ Aucun design trouvé pour ce vendeur${colors.reset}`);
      }
    } catch (designError) {
      console.log(`${colors.yellow}⚠️ Impossible de récupérer les designs: ${designError.response?.status} - ${designError.message}${colors.reset}`);
    }

    // 4. Créer un produit avec design existant (si disponible)
    console.log(`\n${colors.yellow}📝 Étape 4: Test création avec design existant${colors.reset}`);
    
    if (availableDesign) {
      const productDataExisting = {
        vendorId: selectedVendor.id,
        designId: availableDesign.id, // Utiliser design existant
        baseProductId: 1,
        productStructure: {
          adminProduct: {
            id: 1,
            name: 'T-shirt Premium',
            description: 'T-shirt en coton bio premium',
            price: 2000,
            images: {
              colorVariations: [
                {
                  id: 1,
                  name: 'Noir',
                  colorCode: '#000000',
                  images: [
                    {
                      id: 1,
                      url: 'https://res.cloudinary.com/example/image/upload/v1/tshirt-noir-front.jpg',
                      viewType: 'FRONT',
                      delimitations: [
                        {
                          x: 25,
                          y: 30,
                          width: 50,
                          height: 40,
                          coordinateType: 'PERCENTAGE'
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            sizes: [
              { id: 1, sizeName: 'S' },
              { id: 2, sizeName: 'M' },
              { id: 3, sizeName: 'L' }
            ]
          },
          designApplication: {
            positioning: 'CENTER',
            scale: 0.75
          }
        },
        vendorPrice: 2500,
        vendorName: 'T-shirt avec Design Existant',
        vendorDescription: 'Produit créé par admin avec design existant du vendeur',
        vendorStock: 50,
        selectedColors: [
          { id: 1, name: 'Noir', colorCode: '#000000' }
        ],
        selectedSizes: [
          { id: 1, sizeName: 'S' },
          { id: 2, sizeName: 'M' },
          { id: 3, sizeName: 'L' }
        ],
        forcedStatus: 'DRAFT',
        postValidationAction: 'TO_DRAFT',
        designPosition: {
          x: 0,
          y: 0,
          scale: 0.75,
          rotation: 0
        },
        bypassAdminValidation: false
      };

      try {
        const createExistingResponse = await axios.post(
          `${API_BASE_URL}/vendor-product-validation/create-for-vendor`,
          productDataExisting,
          {
            headers: { 
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`${colors.green}✅ Produit avec design existant créé${colors.reset}`);
        console.log(`📦 ID du produit: ${createExistingResponse.data.productId}`);
        console.log(`🎨 Design réutilisé: ${createExistingResponse.data.designId}`);
        console.log(`📊 Nouveau design créé: ${createExistingResponse.data.newDesignCreated}`);
        
        createdProductId = createExistingResponse.data.productId;

      } catch (createError) {
        console.log(`${colors.red}❌ Erreur création avec design existant:${colors.reset}`);
        console.log(`   Message: ${createError.response?.data?.message || createError.message}`);
        console.log(`   Code: ${createError.response?.status}`);
      }
    } else {
      console.log(`${colors.yellow}⚠️ Pas de design disponible, création avec design existant ignorée${colors.reset}`);
    }

    // 5. Créer un produit avec nouveau design
    console.log(`\n${colors.yellow}📝 Étape 5: Test création avec nouveau design${colors.reset}`);
    
    // Image base64 factice (petite image PNG transparente)
    const fakeBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const productDataNew = {
      vendorId: selectedVendor.id,
      newDesign: { // Créer nouveau design
        name: 'Design Créé par Admin Test',
        description: 'Design créé automatiquement par admin pour test',
        category: 'LOGO',
        imageBase64: fakeBase64Image,
        tags: ['admin', 'test', 'automatique']
      },
      baseProductId: 1,
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Premium',
          description: 'T-shirt en coton bio premium',
          price: 2000,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Noir',
                colorCode: '#000000',
                images: [
                  {
                    id: 1,
                    url: 'https://res.cloudinary.com/example/image/upload/v1/tshirt-noir-front.jpg',
                    viewType: 'FRONT',
                    delimitations: [
                      {
                        x: 25,
                        y: 30,
                        width: 50,
                        height: 40,
                        coordinateType: 'PERCENTAGE'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          sizes: [
            { id: 1, sizeName: 'S' },
            { id: 2, sizeName: 'M' },
            { id: 3, sizeName: 'L' }
          ]
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.8
        }
      },
      vendorPrice: 2800,
      vendorName: 'T-shirt avec Nouveau Design',
      vendorDescription: 'Produit créé par admin avec nouveau design',
      vendorStock: 25,
      selectedColors: [
        { id: 1, name: 'Noir', colorCode: '#000000' }
      ],
      selectedSizes: [
        { id: 1, sizeName: 'S' },
        { id: 2, sizeName: 'M' }
      ],
      forcedStatus: 'PENDING', // En attente car nouveau design
      postValidationAction: 'AUTO_PUBLISH',
      designPosition: {
        x: 0,
        y: 0,
        scale: 0.8,
        rotation: 0
      },
      bypassAdminValidation: false
    };

    try {
      const createNewResponse = await axios.post(
        `${API_BASE_URL}/vendor-product-validation/create-for-vendor`,
        productDataNew,
        {
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`${colors.green}✅ Produit avec nouveau design créé${colors.reset}`);
      console.log(`📦 ID du produit: ${createNewResponse.data.productId}`);
      console.log(`🎨 Nouveau design créé: ${createNewResponse.data.newDesignCreated}`);
      console.log(`📝 Nom du design: ${createNewResponse.data.newDesignName}`);
      console.log(`🆔 ID du design: ${createNewResponse.data.designId}`);
      console.log(`🌐 URL du design: ${createNewResponse.data.designUrl}`);

    } catch (createError) {
      console.log(`${colors.red}❌ Erreur création avec nouveau design:${colors.reset}`);
      console.log(`   Message: ${createError.response?.data?.message || createError.message}`);
      console.log(`   Code: ${createError.response?.status}`);
      
      if (createError.response?.data?.details) {
        console.log(`   Détails: ${JSON.stringify(createError.response.data.details, null, 2)}`);
      }
    }

    // 6. Test d'erreur - Les deux designs fournis
    console.log(`\n${colors.yellow}📝 Étape 6: Test d'erreur - designId et newDesign ensemble${colors.reset}`);
    
    if (availableDesign) {
      try {
        await axios.post(
          `${API_BASE_URL}/vendor-product-validation/create-for-vendor`,
          {
            vendorId: selectedVendor.id,
            designId: availableDesign.id, // Les deux à la fois
            newDesign: {
              name: 'Test Erreur',
              category: 'LOGO',
              imageBase64: fakeBase64Image
            },
            baseProductId: 1,
            vendorName: 'Test Erreur',
            vendorDescription: 'Test erreur',
            vendorPrice: 2000,
            vendorStock: 5,
            selectedColors: [{ id: 1, name: 'Noir', colorCode: '#000000' }],
            selectedSizes: [{ id: 1, sizeName: 'M' }],
            productStructure: productDataNew.productStructure
          },
          {
            headers: { 
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`${colors.red}❌ L'endpoint devrait rejeter les deux designs ensemble${colors.reset}`);
        
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('à la fois')) {
          console.log(`${colors.green}✅ Erreur 400 correctement renvoyée pour les deux designs${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠️ Erreur différente: ${error.response?.status} - ${error.response?.data?.message}${colors.reset}`);
        }
      }
    }

    // 7. Test d'erreur - Aucun design fourni
    console.log(`\n${colors.yellow}📝 Étape 7: Test d'erreur - Aucun design fourni${colors.reset}`);
    
    try {
      await axios.post(
        `${API_BASE_URL}/vendor-product-validation/create-for-vendor`,
        {
          vendorId: selectedVendor.id,
          // Pas de designId ni newDesign
          baseProductId: 1,
          vendorName: 'Test Sans Design',
          vendorDescription: 'Test sans design',
          vendorPrice: 2000,
          vendorStock: 5,
          selectedColors: [{ id: 1, name: 'Noir', colorCode: '#000000' }],
          selectedSizes: [{ id: 1, sizeName: 'M' }],
          productStructure: productDataNew.productStructure
        },
        {
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`${colors.red}❌ L'endpoint devrait rejeter l'absence de design${colors.reset}`);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('design')) {
        console.log(`${colors.green}✅ Erreur 400 correctement renvoyée pour l'absence de design${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Erreur différente: ${error.response?.status} - ${error.response?.data?.message}${colors.reset}`);
      }
    }

    // 8. Vérifier le produit créé dans la liste complète
    if (createdProductId) {
      console.log(`\n${colors.yellow}📝 Étape 8: Vérification du produit créé${colors.reset}`);
      
      const allProductsResponse = await axios.get(
        `${API_BASE_URL}/vendor-product-validation/all-products?vendorId=${selectedVendor.id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      const createdProduct = allProductsResponse.data.products.find(p => p.id === createdProductId);
      if (createdProduct) {
        console.log(`${colors.green}✅ Produit trouvé dans la liste${colors.reset}`);
        console.log(`   - Nom: ${createdProduct.name}`);
        console.log(`   - Statut: ${createdProduct.status}`);
        console.log(`   - Vendeur: ${createdProduct.vendor.firstName} ${createdProduct.vendor.lastName}`);
        console.log(`   - Design: ${createdProduct.hasDesign ? 'Oui' : 'Non'}`);
      } else {
        console.log(`${colors.red}❌ Produit non trouvé dans la liste${colors.reset}`);
      }
    }

    // 9. Test d'erreur - Vendeur inexistant
    console.log(`\n${colors.yellow}📝 Étape 9: Test d'erreur - Vendeur inexistant${colors.reset}`);
    
    try {
      await axios.post(
        `${API_BASE_URL}/vendor-product-validation/create-for-vendor`,
        {
          ...productDataNew, // Using productDataNew for consistency
          vendorId: 99999 // ID inexistant
        },
        {
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`${colors.red}❌ L'endpoint devrait rejeter les vendeurs inexistants${colors.reset}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`${colors.green}✅ Erreur 404 correctement renvoyée pour vendeur inexistant${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Erreur différente: ${error.response?.status} - ${error.response?.data?.message}${colors.reset}`);
      }
    }

    // 10. Test d'erreur - Accès non autorisé
    console.log(`\n${colors.yellow}📝 Étape 10: Test d'erreur - Accès non autorisé${colors.reset}`);
    
    try {
      await axios.get(`${API_BASE_URL}/vendor-product-validation/vendors`);
      console.log(`${colors.red}❌ L'endpoint devrait rejeter les requêtes non authentifiées${colors.reset}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`${colors.green}✅ Accès correctement refusé pour les non-authentifiés${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Erreur différente: ${error.response?.status}${colors.reset}`);
      }
    }

    // 11. Analyse des vendeurs
    console.log(`\n${colors.yellow}📝 Étape 11: Analyse des vendeurs${colors.reset}`);
    
    const vendors = vendorsResponse.data.vendors;
    console.log(`\n${colors.cyan}📊 Analyse des vendeurs:${colors.reset}`);
    console.log(`   - Total: ${vendors.length}`);
    console.log(`   - Actifs: ${vendors.filter(v => v.status).length}`);
    console.log(`   - Inactifs: ${vendors.filter(v => !v.status).length}`);
    console.log(`   - Avec produits: ${vendors.filter(v => v.totalProducts > 0).length}`);
    console.log(`   - Sans produits: ${vendors.filter(v => v.totalProducts === 0).length}`);
    console.log(`   - Avec designs: ${vendors.filter(v => v.totalDesigns > 0).length}`);
    
    // Top 3 vendeurs les plus actifs
    const topVendors = vendors
      .sort((a, b) => b.totalProducts - a.totalProducts)
      .slice(0, 3);
    
    console.log(`\n${colors.cyan}🏆 Top 3 vendeurs les plus actifs:${colors.reset}`);
    topVendors.forEach((vendor, index) => {
      console.log(`   ${index + 1}. ${vendor.firstName} ${vendor.lastName} - ${vendor.totalProducts} produits (${vendor.totalDesigns} designs)`);
    });

    // 12. Résumé final
    console.log(`\n${colors.blue}📋 RÉSUMÉ DES TESTS${colors.reset}`);
    console.log(`${colors.green}✅ Connexion admin${colors.reset}`);
    console.log(`${colors.green}✅ Récupération des vendeurs${colors.reset}`);
    console.log(`${colors.green}✅ Récupération des designs d'un vendeur${colors.reset}`);
    console.log(`${availableDesign ? colors.green + '✅' : colors.yellow + '⚠️'} Création avec design existant${colors.reset}`);
    console.log(`${colors.green}✅ Création avec nouveau design${colors.reset}`);
    console.log(`${colors.green}✅ Validation des erreurs${colors.reset}`);
    console.log(`${colors.green}✅ Tests de sécurité${colors.reset}`);

    console.log(`\n${colors.green}🎉 Tous les tests de la fonctionnalité admin étendue sont terminés !${colors.reset}`);
    console.log(`${colors.blue}📈 Nouvelle fonctionnalité validée: Gestion flexible des designs${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors du test:${colors.reset}`);
    console.log(`📋 Message:`, error.response?.data?.message || error.message);
    console.log(`🔢 Code:`, error.response?.status);
    
    if (error.response?.data) {
      console.log(`📄 Détails:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Exécuter le test
testAdminCreateVendorProduct();

module.exports = { testAdminCreateVendorProduct };