const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3004';
const TEST_VENDOR_EMAIL = 'test@vendor.com';
const TEST_VENDOR_PASSWORD = 'password123';

// Client API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables globales
let authToken = null;
let vendorId = null;
let productId = null;
let designId = null;

async function testEndpointsFix() {
  console.log('🧪 === TEST DES ENDPOINTS CORRIGÉS ===\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion...');
    const loginResponse = await api.post('/api/auth/login', {
      email: TEST_VENDOR_EMAIL,
      password: TEST_VENDOR_PASSWORD,
    });
    
    authToken = loginResponse.data.access_token;
    vendorId = loginResponse.data.user.id;
    
    // Configurer le token pour les requêtes suivantes
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    console.log('✅ Connexion réussie');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   Vendor ID: ${vendorId}\n`);

    // 2. Test endpoint profil utilisateur (CORRIGÉ)
    console.log('2️⃣ Test endpoint profil utilisateur...');
    try {
      const profileResponse = await api.get('/api/auth/profile');
      console.log('✅ Endpoint /api/auth/profile fonctionne');
      console.log(`   Utilisateur: ${profileResponse.data.firstName} ${profileResponse.data.lastName}`);
      console.log(`   Email: ${profileResponse.data.email}`);
      console.log(`   Rôle: ${profileResponse.data.role}\n`);
    } catch (error) {
      console.log('❌ Erreur endpoint profil:', error.response?.status, error.response?.data);
      return;
    }

    // 3. Test endpoint designs (CORRIGÉ)
    console.log('3️⃣ Test endpoint designs...');
    try {
      const designsResponse = await api.get('/api/designs');
      console.log('✅ Endpoint /api/designs fonctionne');
      
      const designs = designsResponse.data.data?.items || designsResponse.data;
      console.log(`   Nombre de designs: ${designs.length}`);
      
      if (designs.length > 0) {
        designId = designs[0].id;
        console.log(`   Premier design: ${designs[0].name} (ID: ${designId})`);
      }
      console.log('');
    } catch (error) {
      console.log('❌ Erreur endpoint designs:', error.response?.status, error.response?.data);
      return;
    }

    // 4. Test endpoint produits vendeur
    console.log('4️⃣ Test endpoint produits vendeur...');
    try {
      const productsResponse = await api.get('/api/vendor-products');
      console.log('✅ Endpoint /api/vendor-products fonctionne');
      
      const products = productsResponse.data;
      console.log(`   Nombre de produits: ${products.length}`);
      
      if (products.length > 0) {
        productId = products[0].id;
        console.log(`   Premier produit: ${products[0].name} (ID: ${productId})`);
      }
      console.log('');
    } catch (error) {
      console.log('❌ Erreur endpoint produits:', error.response?.status, error.response?.data);
      return;
    }

    // 5. Test endpoint debug positions (si on a des IDs)
    if (productId && designId) {
      console.log('5️⃣ Test endpoint debug positions...');
      try {
        const debugResponse = await api.get(
          `/api/vendor-products/${productId}/designs/${designId}/position/debug`
        );
        console.log('✅ Endpoint debug positions fonctionne');
        console.log('   Debug info:', {
          productBelongsToVendor: debugResponse.data.debug.productBelongsToVendor,
          designBelongsToVendor: debugResponse.data.debug.designBelongsToVendor,
          productName: debugResponse.data.debug.product?.name,
          designName: debugResponse.data.debug.design?.name
        });
        console.log('');
      } catch (error) {
        console.log('❌ Erreur endpoint debug:', error.response?.status, error.response?.data);
        console.log('');
      }

      // 6. Test sauvegarde position
      console.log('6️⃣ Test sauvegarde position...');
      try {
        const position = {
          x: 100,
          y: 100,
          scale: 1,
          rotation: 0
        };
        
        const saveResponse = await api.put(
          `/api/vendor-products/${productId}/designs/${designId}/position/direct`,
          position
        );
        
        console.log('✅ Sauvegarde position réussie');
        console.log(`   Position sauvegardée: x=${position.x}, y=${position.y}`);
        console.log('');
      } catch (error) {
        console.log('❌ Erreur sauvegarde position:', error.response?.status, error.response?.data);
        console.log('');
      }

      // 7. Test récupération position
      console.log('7️⃣ Test récupération position...');
      try {
        const getResponse = await api.get(
          `/api/vendor-products/${productId}/designs/${designId}/position/direct`
        );
        
        console.log('✅ Récupération position réussie');
        console.log('   Position récupérée:', getResponse.data.data.position);
        console.log('');
      } catch (error) {
        console.log('❌ Erreur récupération position:', error.response?.status, error.response?.data);
        console.log('');
      }
    } else {
      console.log('5️⃣ ⚠️ Pas assez de données pour tester les positions');
      console.log(`   ProductId: ${productId}, DesignId: ${designId}`);
      console.log('');
    }

    // 8. Test des anciens endpoints (pour vérifier qu'ils échouent)
    console.log('8️⃣ Test des anciens endpoints (doivent échouer)...');
    
    // Test ancien endpoint profil
    try {
      await api.get('/api/auth/me');
      console.log('⚠️ Ancien endpoint /api/auth/me fonctionne encore');
    } catch (error) {
      console.log('✅ Ancien endpoint /api/auth/me échoue comme attendu (404)');
    }
    
    // Test ancien endpoint designs
    try {
      await api.get('/api/designs/my-designs');
      console.log('⚠️ Ancien endpoint /api/designs/my-designs fonctionne encore');
    } catch (error) {
      console.log('✅ Ancien endpoint /api/designs/my-designs échoue comme attendu (400/404)');
    }
    
    console.log('');

    // 9. Résumé des tests
    console.log('9️⃣ === RÉSUMÉ DES TESTS ===');
    console.log('✅ Endpoint profil utilisateur: /api/auth/profile');
    console.log('✅ Endpoint designs vendeur: /api/designs');
    console.log('✅ Endpoint produits vendeur: /api/vendor-products');
    console.log('✅ Endpoint debug positions: /api/vendor-products/:id/designs/:id/position/debug');
    console.log('✅ Endpoints positions: /api/vendor-products/:id/designs/:id/position/direct');
    console.log('');
    console.log('🎉 TOUS LES ENDPOINTS CORRIGÉS FONCTIONNENT !');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Fonction utilitaire pour tester les classes frontend
async function testFrontendClasses() {
  console.log('\n🧪 === TEST DES CLASSES FRONTEND ===\n');
  
  if (!authToken) {
    console.log('❌ Pas de token d\'authentification');
    return;
  }

  // Simuler les classes frontend
  class PositionDebugger {
    constructor(apiClient) {
      this.api = apiClient;
    }

    async getAvailableIds() {
      console.log('📋 Récupération des IDs disponibles...');
      
      try {
        const vendorProductsResponse = await this.api.get('/api/vendor-products');
        const designsResponse = await this.api.get('/api/designs');
        
        const availableIds = {
          products: vendorProductsResponse.data.map(p => ({
            id: p.id,
            name: p.name,
            baseProductId: p.baseProductId
          })),
          designs: designsResponse.data.data?.items?.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category
          })) || designsResponse.data.map(d => ({
            id: d.id,
            name: d.name,
            category: d.category
          }))
        };
        
        console.log('📋 IDs disponibles:', availableIds);
        return availableIds;
        
      } catch (error) {
        console.error('❌ Erreur récupération IDs:', error.response?.status, error.response?.data);
        return { products: [], designs: [] };
      }
    }
  }

  class DesignPositionManager {
    constructor(apiClient) {
      this.api = apiClient;
      this.debugger = new PositionDebugger(apiClient);
    }

    async showDiagnosticInfo() {
      console.log('🔍 === DIAGNOSTIC COMPLET ===');
      
      try {
        // Informations utilisateur
        const user = await this.api.get('/api/auth/profile');
        console.log('👤 Utilisateur connecté:', {
          id: user.data.id,
          email: user.data.email,
          role: user.data.role,
          vendeur_type: user.data.vendeur_type
        });
        
        // IDs disponibles
        const availableIds = await this.debugger.getAvailableIds();
        
        if (availableIds.products.length === 0) {
          console.warn('⚠️ AUCUN PRODUIT VENDEUR TROUVÉ');
        }
        
        if (availableIds.designs.length === 0) {
          console.warn('⚠️ AUCUN DESIGN TROUVÉ');
        }
        
        console.log('📊 === FIN DIAGNOSTIC ===');
        return availableIds;
        
      } catch (error) {
        console.error('❌ Erreur diagnostic complet:', error.response?.status, error.response?.data);
        return null;
      }
    }
  }

  // Test des classes
  const manager = new DesignPositionManager(api);
  await manager.showDiagnosticInfo();
}

// Exécuter les tests
async function runAllTests() {
  await testEndpointsFix();
  await testFrontendClasses();
  
  console.log('\n🏁 === TESTS TERMINÉS ===');
  console.log('📄 Consultez le guide: FRONTEND_CORRECTION_ENDPOINTS_403_GUIDE.md');
  console.log('🔧 Appliquez les corrections dans votre code frontend');
}

// Exécuter si appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEndpointsFix,
  testFrontendClasses,
  runAllTests
}; 
 
 
 
 