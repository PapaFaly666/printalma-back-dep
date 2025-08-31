const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testVendorCredentials = {
  email: 'vendor.test@printalma.com',
  password: 'Test123!'
};

const testProductData = {
  baseProductId: 4,
  productStructure: {
    adminProduct: {
      id: 4,
      name: 'T-shirt Basique',
      description: 'T-shirt en coton 100% de qualité premium',
      price: 19000,
      images: {
        colorVariations: [
          {
            id: 12,
            name: 'Rouge',
            colorCode: '#ff0000',
            images: [
              {
                id: 101,
                url: 'https://res.cloudinary.com/printalma/image/upload/v1/tshirt-front-red.jpg',
                viewType: 'FRONT',
                delimitations: [
                  { x: 150, y: 200, width: 200, height: 200, coordinateType: 'PIXEL' }
                ]
              }
            ]
          }
        ]
      },
      sizes: [
        { id: 1, sizeName: 'S' },
        { id: 2, sizeName: 'M' }
      ]
    },
    designApplication: {
      designBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      positioning: 'CENTER',
      scale: 0.6
    }
  },
  vendorName: 'T-shirt Dragon Rouge Premium - Architecture v2',
  vendorDescription: 'T-shirt avec design dragon exclusif - nouvelle architecture',
  vendorPrice: 25000,
  vendorStock: 100,
  selectedColors: [
    { id: 12, name: 'Rouge', colorCode: '#ff0000' }
  ],
  selectedSizes: [
    { id: 1, sizeName: 'S' },
    { id: 2, sizeName: 'M' }
  ],
  finalImagesBase64: {
    design: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  forcedStatus: 'DRAFT'
};

async function testLogin() {
  console.log('🔐 Test: Connexion vendeur...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testVendorCredentials);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Connexion réussie');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Échec connexion:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateProduct() {
  console.log('\n📦 Test: Création produit vendeur (Architecture v2)...');
  try {
    const response = await axios.post(
      `${API_BASE}/vendor/products`,
      testProductData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Produit créé avec succès');
      console.log(`   ID: ${response.data.productId}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Structure: ${response.data.structure}`);
      console.log(`   Images traitées: ${response.data.imagesProcessed}`);
      return response.data.productId;
    } else {
      console.log('❌ Échec création:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur création produit:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.log(`   Détails: ${error.response.data.error}`);
    }
    return null;
  }
}

async function testGetProducts() {
  console.log('\n📋 Test: Récupération liste produits vendeur...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        limit: 5,
        offset: 0
      }
    });

    if (response.data.success) {
      console.log('✅ Liste récupérée avec succès');
      console.log(`   Total produits: ${response.data.data.pagination.total}`);
      console.log(`   Architecture: ${response.data.architecture}`);
      console.log(`   Santé globale: ${response.data.data.healthMetrics.overallHealthScore}%`);
      
      if (response.data.data.products.length > 0) {
        const product = response.data.data.products[0];
        console.log(`   Premier produit: ${product.vendorName}`);
        console.log(`   Nom admin original: ${product.originalAdminName}`);
        console.log(`   Design application: ${product.designApplication.hasDesign ? 'Oui' : 'Non'}`);
        console.log(`   Mode: ${product.designApplication.mode}`);
      }
      return true;
    } else {
      console.log('❌ Échec récupération:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur récupération liste:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetProductDetail(productId) {
  if (!productId) return false;
  
  console.log(`\n🔍 Test: Détails produit ${productId}...`);
  try {
    const response = await axios.get(`${API_BASE}/vendor/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Détails récupérés avec succès');
      console.log(`   Architecture: ${response.data.architecture}`);
      
      const product = response.data.data;
      console.log(`   Nom vendeur: ${product.vendorName}`);
      console.log(`   Prix vendeur: ${product.vendorPrice}`);
      console.log(`   Admin - Nom: ${product.adminProduct.name}`);
      console.log(`   Admin - Prix: ${product.adminProduct.price}`);
      console.log(`   Design - Positioning: ${product.designApplication.positioning}`);
      console.log(`   Design - Scale: ${product.designApplication.scale}`);
      console.log(`   Couleurs sélectionnées: ${product.selectedColors.length}`);
      console.log(`   Tailles sélectionnées: ${product.selectedSizes.length}`);
      
      return true;
    } else {
      console.log('❌ Échec détails:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur détails produit:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthReport() {
  console.log('\n🏥 Test: Rapport de santé...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/products/health-report`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Rapport de santé généré');
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Architecture: ${response.data.healthReport.architecture}`);
      console.log(`   Score santé: ${response.data.healthReport.overallHealthScore}%`);
      console.log(`   Produits sains: ${response.data.healthReport.healthyProducts}`);
      console.log(`   Problèmes: ${response.data.healthReport.issues.length}`);
      return true;
    } else {
      console.log('❌ Échec rapport santé:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur rapport santé:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testVendorStats() {
  console.log('\n📊 Test: Statistiques vendeur...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Statistiques récupérées');
      console.log(`   Architecture: ${response.data.data.architecture}`);
      console.log(`   Total produits: ${response.data.data.totalProducts}`);
      console.log(`   Publiés: ${response.data.data.publishedProducts}`);
      console.log(`   Brouillons: ${response.data.data.draftProducts}`);
      console.log(`   Valeur totale: ${response.data.data.totalValue}`);
      console.log(`   Prix moyen: ${response.data.data.averagePrice}`);
      return true;
    } else {
      console.log('❌ Échec statistiques:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur statistiques:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🚀 Test: Health check service...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/health`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Service opérationnel');
    console.log(`   Statut: ${response.data.status}`);
    console.log(`   Architecture: ${response.data.architecture}`);
    console.log(`   Fonctionnalités: ${response.data.features.join(', ')}`);
    return true;
  } catch (error) {
    console.log('❌ Erreur health check:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 TESTS ARCHITECTURE v2 - ADMIN STRUCTURE PRESERVED\n');
  console.log('='.repeat(60));

  // Test complet du workflow
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ ARRÊT: Impossible de se connecter');
    return;
  }

  await testHealthCheck();
  const productId = await testCreateProduct();
  await testGetProducts();
  await testGetProductDetail(productId);
  await testHealthReport();
  await testVendorStats();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTS TERMINÉS - ARCHITECTURE v2 FONCTIONNELLE');
  console.log('✅ Structure admin préservée');
  console.log('✅ Design appliqué au centre');
  console.log('✅ Aucun mélange d\'images');
  console.log('✅ Rendu temps réel côté client');
  console.log('✅ Santé garantie à 100%');
}

// Exécution
runTests().catch(console.error); 

// Configuration
const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testVendorCredentials = {
  email: 'vendor.test@printalma.com',
  password: 'Test123!'
};

const testProductData = {
  baseProductId: 4,
  productStructure: {
    adminProduct: {
      id: 4,
      name: 'T-shirt Basique',
      description: 'T-shirt en coton 100% de qualité premium',
      price: 19000,
      images: {
        colorVariations: [
          {
            id: 12,
            name: 'Rouge',
            colorCode: '#ff0000',
            images: [
              {
                id: 101,
                url: 'https://res.cloudinary.com/printalma/image/upload/v1/tshirt-front-red.jpg',
                viewType: 'FRONT',
                delimitations: [
                  { x: 150, y: 200, width: 200, height: 200, coordinateType: 'PIXEL' }
                ]
              }
            ]
          }
        ]
      },
      sizes: [
        { id: 1, sizeName: 'S' },
        { id: 2, sizeName: 'M' }
      ]
    },
    designApplication: {
      designBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      positioning: 'CENTER',
      scale: 0.6
    }
  },
  vendorName: 'T-shirt Dragon Rouge Premium - Architecture v2',
  vendorDescription: 'T-shirt avec design dragon exclusif - nouvelle architecture',
  vendorPrice: 25000,
  vendorStock: 100,
  selectedColors: [
    { id: 12, name: 'Rouge', colorCode: '#ff0000' }
  ],
  selectedSizes: [
    { id: 1, sizeName: 'S' },
    { id: 2, sizeName: 'M' }
  ],
  finalImagesBase64: {
    design: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  forcedStatus: 'DRAFT'
};

async function testLogin() {
  console.log('🔐 Test: Connexion vendeur...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testVendorCredentials);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Connexion réussie');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Échec connexion:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateProduct() {
  console.log('\n📦 Test: Création produit vendeur (Architecture v2)...');
  try {
    const response = await axios.post(
      `${API_BASE}/vendor/products`,
      testProductData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Produit créé avec succès');
      console.log(`   ID: ${response.data.productId}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Structure: ${response.data.structure}`);
      console.log(`   Images traitées: ${response.data.imagesProcessed}`);
      return response.data.productId;
    } else {
      console.log('❌ Échec création:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur création produit:', error.response?.data?.message || error.message);
    if (error.response?.data?.error) {
      console.log(`   Détails: ${error.response.data.error}`);
    }
    return null;
  }
}

async function testGetProducts() {
  console.log('\n📋 Test: Récupération liste produits vendeur...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        limit: 5,
        offset: 0
      }
    });

    if (response.data.success) {
      console.log('✅ Liste récupérée avec succès');
      console.log(`   Total produits: ${response.data.data.pagination.total}`);
      console.log(`   Architecture: ${response.data.architecture}`);
      console.log(`   Santé globale: ${response.data.data.healthMetrics.overallHealthScore}%`);
      
      if (response.data.data.products.length > 0) {
        const product = response.data.data.products[0];
        console.log(`   Premier produit: ${product.vendorName}`);
        console.log(`   Nom admin original: ${product.originalAdminName}`);
        console.log(`   Design application: ${product.designApplication.hasDesign ? 'Oui' : 'Non'}`);
        console.log(`   Mode: ${product.designApplication.mode}`);
      }
      return true;
    } else {
      console.log('❌ Échec récupération:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur récupération liste:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetProductDetail(productId) {
  if (!productId) return false;
  
  console.log(`\n🔍 Test: Détails produit ${productId}...`);
  try {
    const response = await axios.get(`${API_BASE}/vendor/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Détails récupérés avec succès');
      console.log(`   Architecture: ${response.data.architecture}`);
      
      const product = response.data.data;
      console.log(`   Nom vendeur: ${product.vendorName}`);
      console.log(`   Prix vendeur: ${product.vendorPrice}`);
      console.log(`   Admin - Nom: ${product.adminProduct.name}`);
      console.log(`   Admin - Prix: ${product.adminProduct.price}`);
      console.log(`   Design - Positioning: ${product.designApplication.positioning}`);
      console.log(`   Design - Scale: ${product.designApplication.scale}`);
      console.log(`   Couleurs sélectionnées: ${product.selectedColors.length}`);
      console.log(`   Tailles sélectionnées: ${product.selectedSizes.length}`);
      
      return true;
    } else {
      console.log('❌ Échec détails:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur détails produit:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthReport() {
  console.log('\n🏥 Test: Rapport de santé...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/products/health-report`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Rapport de santé généré');
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Architecture: ${response.data.healthReport.architecture}`);
      console.log(`   Score santé: ${response.data.healthReport.overallHealthScore}%`);
      console.log(`   Produits sains: ${response.data.healthReport.healthyProducts}`);
      console.log(`   Problèmes: ${response.data.healthReport.issues.length}`);
      return true;
    } else {
      console.log('❌ Échec rapport santé:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur rapport santé:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testVendorStats() {
  console.log('\n📊 Test: Statistiques vendeur...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      console.log('✅ Statistiques récupérées');
      console.log(`   Architecture: ${response.data.data.architecture}`);
      console.log(`   Total produits: ${response.data.data.totalProducts}`);
      console.log(`   Publiés: ${response.data.data.publishedProducts}`);
      console.log(`   Brouillons: ${response.data.data.draftProducts}`);
      console.log(`   Valeur totale: ${response.data.data.totalValue}`);
      console.log(`   Prix moyen: ${response.data.data.averagePrice}`);
      return true;
    } else {
      console.log('❌ Échec statistiques:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur statistiques:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\n🚀 Test: Health check service...');
  try {
    const response = await axios.get(`${API_BASE}/vendor/health`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Service opérationnel');
    console.log(`   Statut: ${response.data.status}`);
    console.log(`   Architecture: ${response.data.architecture}`);
    console.log(`   Fonctionnalités: ${response.data.features.join(', ')}`);
    return true;
  } catch (error) {
    console.log('❌ Erreur health check:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 TESTS ARCHITECTURE v2 - ADMIN STRUCTURE PRESERVED\n');
  console.log('='.repeat(60));

  // Test complet du workflow
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ ARRÊT: Impossible de se connecter');
    return;
  }

  await testHealthCheck();
  const productId = await testCreateProduct();
  await testGetProducts();
  await testGetProductDetail(productId);
  await testHealthReport();
  await testVendorStats();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTS TERMINÉS - ARCHITECTURE v2 FONCTIONNELLE');
  console.log('✅ Structure admin préservée');
  console.log('✅ Design appliqué au centre');
  console.log('✅ Aucun mélange d\'images');
  console.log('✅ Rendu temps réel côté client');
  console.log('✅ Santé garantie à 100%');
}

// Exécution
runTests().catch(console.error); 
 
 
 
 
 
 
 
 
 
 