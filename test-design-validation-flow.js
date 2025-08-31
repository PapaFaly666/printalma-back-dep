#!/usr/bin/env node

/**
 * Test du nouveau flux de validation automatique des designs
 * 
 * Ce script teste le nouveau comportement où:
 * - Les produits avec designs validés sont publiés directement (PUBLISHED)
 * - Les produits avec designs non validés sont mis en DRAFT et soumis pour validation
 * - Les nouveaux designs déclenchent automatiquement une validation
 */

const API_BASE = 'http://localhost:3000/api';

// Configuration de test
const TEST_CONFIG = {
  vendorCredentials: {
    email: 'vendor@test.com',
    password: 'password123'
  },
  adminCredentials: {
    email: 'admin@test.com', 
    password: 'admin123'
  },
  testDesignBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
};

class DesignValidationFlowTester {
  constructor() {
    this.vendorCookies = '';
    this.adminCookies = '';
    this.vendorId = null;
    this.adminId = null;
  }

  async makeRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async loginAsVendor() {
    console.log('🔐 Connexion vendeur...');
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CONFIG.vendorCredentials)
    });

    if (response.ok) {
      this.vendorCookies = response.headers.get('set-cookie') || '';
      const result = await response.json();
      this.vendorId = result.user?.id;
      console.log(`✅ Connecté en tant que vendeur (ID: ${this.vendorId})`);
      return true;
    }
    
    console.log('❌ Échec connexion vendeur');
    return false;
  }

  async loginAsAdmin() {
    console.log('🔐 Connexion admin...');
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CONFIG.adminCredentials)
    });

    if (response.ok) {
      this.adminCookies = response.headers.get('set-cookie') || '';
      const result = await response.json();
      this.adminId = result.user?.id;
      console.log(`✅ Connecté en tant qu'admin (ID: ${this.adminId})`);
      return true;
    }
    
    console.log('❌ Échec connexion admin');
    return false;
  }

  async createTestDesign(isValidated = false) {
    console.log(`🎨 Création d'un design de test (validé: ${isValidated})...`);
    
    const designData = {
      name: `Test Design ${Date.now()}`,
      description: 'Design de test pour validation automatique',
      price: 1000,
      category: 'LOGO',
      imageUrl: TEST_CONFIG.testDesignBase64,
      fileSize: 1024,
      originalFileName: 'test-design.png',
      dimensions: { width: 100, height: 100 },
      format: 'png'
    };

    const response = await fetch(`${API_BASE}/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.vendorCookies
      },
      body: JSON.stringify(designData)
    });

    if (!response.ok) {
      throw new Error(`Erreur création design: ${await response.text()}`);
    }

    const design = await response.json();
    console.log(`✅ Design créé: ${design.id} - ${design.name}`);

    // Si on veut un design validé, on le valide via admin
    if (isValidated && this.adminCookies) {
      await this.validateDesign(design.id, true);
    }

    return design;
  }

  async validateDesign(designId, approved, rejectionReason = null) {
    console.log(`⚖️ Validation design ${designId} (approuvé: ${approved})...`);
    
    const response = await fetch(`${API_BASE}/designs/${designId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.adminCookies
      },
      body: JSON.stringify({
        approved,
        rejectionReason
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur validation design: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`✅ Design ${approved ? 'approuvé' : 'rejeté'}`);
    return result;
  }

  async publishProductWithDesign(baseProductId, designId = null) {
    console.log(`📦 Publication produit (baseProductId: ${baseProductId}, designId: ${designId || 'nouveau'})...`);
    
    const productData = {
      baseProductId,
      designId, // Peut être null pour un nouveau design
      designUrl: TEST_CONFIG.testDesignBase64,
      designFile: {
        name: 'test-design.png',
        size: 1024,
        type: 'image/png'
      },
      finalImages: {
        colorImages: {
          'Rouge': {
            colorInfo: { id: 1, name: 'Rouge', colorCode: '#ff0000' },
            imageUrl: 'blob:test',
            imageKey: 'rouge_test'
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
      vendorName: 'Produit Test Validation',
      vendorDescription: 'Test du système de validation automatique',
      vendorStock: 50,
      basePriceAdmin: 10000,
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      selectedColors: [{ id: 1, name: 'Rouge', colorCode: '#ff0000' }],
      previewView: {
        viewType: 'FRONT',
        url: 'test-url',
        delimitations: []
      },
      publishedAt: new Date().toISOString(),
      finalImagesBase64: {
        'design': TEST_CONFIG.testDesignBase64,
        'rouge': TEST_CONFIG.testDesignBase64
      }
    };

    const response = await fetch(`${API_BASE}/vendor/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.vendorCookies
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      throw new Error(`Erreur publication produit: ${await response.text()}`);
    }

    const result = await response.json();
    console.log(`📋 Résultat publication:`, {
      productId: result.productId,
      status: result.status,
      needsValidation: result.needsValidation,
      message: result.message
    });

    return result;
  }

  async getBaseProducts() {
    console.log('📋 Récupération des produits de base...');
    
    const response = await fetch(`${API_BASE}/products?limit=1`, {
      headers: { 'Cookie': this.vendorCookies }
    });

    if (!response.ok) {
      throw new Error(`Erreur récupération produits: ${await response.text()}`);
    }

    const result = await response.json();
    return result.products || [];
  }

  async runValidationTests() {
    console.log('\n🧪 === TEST DE VALIDATION AUTOMATIQUE DES DESIGNS ===\n');

    try {
      // 1. Connexions
      if (!await this.loginAsVendor()) {
        throw new Error('Impossible de se connecter en tant que vendeur');
      }
      
      if (!await this.loginAsAdmin()) {
        throw new Error('Impossible de se connecter en tant qu\'admin');
      }

      // 2. Récupérer un produit de base
      const baseProducts = await this.getBaseProducts();
      if (baseProducts.length === 0) {
        throw new Error('Aucun produit de base disponible');
      }
      const baseProductId = baseProducts[0].id;

      console.log('\n--- TEST 1: Publication avec design validé ---');
      
      // Créer un design validé
      const validatedDesign = await this.createTestDesign(true);
      
      // Publier un produit avec ce design
      const result1 = await this.publishProductWithDesign(baseProductId, validatedDesign.id);
      
      console.log(`✅ TEST 1 - Résultat attendu: status='PUBLISHED', needsValidation=false`);
      console.log(`📊 TEST 1 - Résultat obtenu: status='${result1.status}', needsValidation=${result1.needsValidation}`);
      
      if (result1.status === 'PUBLISHED' && !result1.needsValidation) {
        console.log('✅ TEST 1 RÉUSSI: Design validé → Publication directe');
      } else {
        console.log('❌ TEST 1 ÉCHOUÉ: Comportement inattendu');
      }

      console.log('\n--- TEST 2: Publication avec design non validé ---');
      
      // Créer un design non validé
      const nonValidatedDesign = await this.createTestDesign(false);
      
      // Publier un produit avec ce design
      const result2 = await this.publishProductWithDesign(baseProductId, nonValidatedDesign.id);
      
      console.log(`✅ TEST 2 - Résultat attendu: status='DRAFT', needsValidation=true`);
      console.log(`📊 TEST 2 - Résultat obtenu: status='${result2.status}', needsValidation=${result2.needsValidation}`);
      
      if (result2.status === 'DRAFT' && result2.needsValidation) {
        console.log('✅ TEST 2 RÉUSSI: Design non validé → En attente de validation');
      } else {
        console.log('❌ TEST 2 ÉCHOUÉ: Comportement inattendu');
      }

      console.log('\n--- TEST 3: Publication avec nouveau design (upload) ---');
      
      // Publier un produit avec un nouveau design (sans designId)
      const result3 = await this.publishProductWithDesign(baseProductId, null);
      
      console.log(`✅ TEST 3 - Résultat attendu: status='DRAFT', needsValidation=true`);
      console.log(`📊 TEST 3 - Résultat obtenu: status='${result3.status}', needsValidation=${result3.needsValidation}`);
      
      if (result3.status === 'DRAFT' && result3.needsValidation) {
        console.log('✅ TEST 3 RÉUSSI: Nouveau design → En attente de validation');
      } else {
        console.log('❌ TEST 3 ÉCHOUÉ: Comportement inattendu');
      }

      console.log('\n🎉 === TESTS TERMINÉS ===');
      console.log('📋 Résumé:');
      console.log(`   • Design validé → Publication directe: ${result1.status === 'PUBLISHED' ? '✅' : '❌'}`);
      console.log(`   • Design non validé → Validation requise: ${result2.status === 'DRAFT' ? '✅' : '❌'}`);
      console.log(`   • Nouveau design → Validation requise: ${result3.status === 'DRAFT' ? '✅' : '❌'}`);

    } catch (error) {
      console.error('❌ Erreur lors des tests:', error.message);
      process.exit(1);
    }
  }
}

// Exécution des tests si le script est appelé directement
if (require.main === module) {
  const tester = new DesignValidationFlowTester();
  tester.runValidationTests()
    .then(() => {
      console.log('\n✅ Tests de validation automatique terminés avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Échec des tests:', error.message);
      process.exit(1);
    });
}

module.exports = DesignValidationFlowTester; 