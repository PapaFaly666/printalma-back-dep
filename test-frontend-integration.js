/**
 * 🧪 TEST - Intégration Frontend ColorVariations
 * 
 * Ce script teste la compatibilité de la structure backend avec le frontend
 * en simulant les appels API et en validant la structure des données.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004';

// Configuration de test
const TEST_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

class FrontendIntegrationTester {
  constructor() {
    this.authToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      issues: []
    };
  }

  async runAllTests() {
    console.log('🧪 DÉBUT DES TESTS D\'INTÉGRATION FRONTEND\n');

    try {
      // 1. Test de connexion serveur
      await this.testServerConnection();

      // 2. Test d'authentification
      await this.testAuthentication();

      // 3. Test de la structure API
      await this.testApiStructure();

      // 4. Test de compatibilité frontend
      await this.testFrontendCompatibility();

      // 5. Test de validation des données
      await this.testDataValidation();

      // 6. Rapport final
      this.generateReport();

    } catch (error) {
      console.error('❌ Erreur critique:', error.message);
      this.addIssue('CRITIQUE', error.message);
    }
  }

  async testServerConnection() {
    console.log('🔗 Test de connexion serveur...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log('✅ Serveur accessible\n');
        this.testResults.passed++;
      } else {
        throw new Error(`Status inattendu: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Serveur inaccessible');
      console.log(`   Erreur: ${error.message}\n`);
      this.addIssue('SERVEUR', 'Serveur non accessible');
      this.testResults.failed++;
    }
  }

  async testAuthentication() {
    console.log('🔐 Test d\'authentification...');
    
    try {
      // Test avec un compte vendeur existant
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'vendor@test.com',
        password: 'password123'
      }, TEST_CONFIG);

      if (authResponse.data.token) {
        this.authToken = authResponse.data.token;
        console.log('✅ Authentification réussie');
        console.log(`   Token reçu: ${this.authToken.substring(0, 20)}...\n`);
        this.testResults.passed++;
      } else {
        throw new Error('Token manquant dans la réponse');
      }
    } catch (error) {
      console.log('❌ Échec authentification');
      console.log(`   Erreur: ${error.message}\n`);
      this.addIssue('AUTH', 'Authentification échouée');
      this.testResults.failed++;
    }
  }

  async testApiStructure() {
    console.log('📋 Test de la structure API...');
    
    if (!this.authToken) {
      console.log('⚠️ Authentification requise, test ignoré\n');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const data = response.data;
      
      // Validation de la structure de réponse
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Structure de réponse invalide - products manquant');
      }

      console.log('✅ Structure API valide');
      console.log(`   Produits trouvés: ${data.products.length}`);
      
      if (data.products.length > 0) {
        console.log(`   Premier produit ID: ${data.products[0].id}\n`);
      } else {
        console.log('   ⚠️ Aucun produit trouvé\n');
      }
      
      this.testResults.passed++;
      return data.products;
      
    } catch (error) {
      console.log('❌ Structure API invalide');
      console.log(`   Erreur: ${error.message}\n`);
      this.addIssue('API', 'Structure API incompatible');
      this.testResults.failed++;
      return [];
    }
  }

  async testFrontendCompatibility() {
    console.log('🎨 Test de compatibilité frontend...');
    
    if (!this.authToken) {
      console.log('⚠️ Authentification requise, test ignoré\n');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const products = response.data.products || [];
      
      if (products.length === 0) {
        console.log('⚠️ Aucun produit à tester\n');
        return;
      }

      let compatibilityScore = 0;
      let totalTests = 0;

      for (const product of products.slice(0, 3)) { // Test sur les 3 premiers
        console.log(`   🔍 Test produit ${product.id}: "${product.vendorName}"`);
        
        // Test 1: Structure colorVariations
        totalTests++;
        if (product.colorVariations && Array.isArray(product.colorVariations)) {
          compatibilityScore++;
          console.log('     ✅ colorVariations présent');
        } else {
          console.log('     ❌ colorVariations manquant');
          this.addIssue('STRUCTURE', `Produit ${product.id}: colorVariations manquant`);
        }

        // Test 2: Chaque couleur a des images
        if (product.colorVariations) {
          for (const color of product.colorVariations) {
            totalTests++;
            if (color.images && Array.isArray(color.images) && color.images.length > 0) {
              compatibilityScore++;
              console.log(`     ✅ Couleur "${color.name}": ${color.images.length} images`);
            } else {
              console.log(`     ❌ Couleur "${color.name}": aucune image`);
              this.addIssue('IMAGES', `Produit ${product.id}, couleur ${color.name}: aucune image`);
            }
          }
        }

        // Test 3: Métadonnées de validation
        totalTests++;
        if (product.images && product.images.validation) {
          compatibilityScore++;
          console.log(`     ✅ Validation: ${product.images.validation.allImagesValidated ? 'OK' : 'NOK'}`);
        } else {
          console.log('     ❌ Métadonnées de validation manquantes');
          this.addIssue('METADATA', `Produit ${product.id}: métadonnées manquantes`);
        }
      }

      const compatibilityRate = Math.round((compatibilityScore / totalTests) * 100);
      
      console.log(`\n📊 Compatibilité frontend: ${compatibilityRate}% (${compatibilityScore}/${totalTests})`);
      
      if (compatibilityRate >= 90) {
        console.log('✅ Excellente compatibilité frontend\n');
        this.testResults.passed++;
      } else if (compatibilityRate >= 70) {
        console.log('⚠️ Compatibilité frontend acceptable\n');
        this.testResults.passed++;
      } else {
        console.log('❌ Compatibilité frontend insuffisante\n');
        this.testResults.failed++;
      }

    } catch (error) {
      console.log('❌ Test de compatibilité échoué');
      console.log(`   Erreur: ${error.message}\n`);
      this.addIssue('COMPATIBILITY', 'Test de compatibilité échoué');
      this.testResults.failed++;
    }
  }

  async testDataValidation() {
    console.log('🔍 Test de validation des données...');
    
    if (!this.authToken) {
      console.log('⚠️ Authentification requise, test ignoré\n');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const products = response.data.products || [];
      
      let validationResults = {
        productsWithMixing: 0,
        productsValidated: 0,
        totalImages: 0,
        validatedImages: 0
      };

      for (const product of products) {
        if (product.images && product.images.validation) {
          if (product.images.validation.hasImageMixing) {
            validationResults.productsWithMixing++;
          }
          if (product.images.validation.allImagesValidated) {
            validationResults.productsValidated++;
          }
        }

        // Compter les images
        if (product.colorVariations) {
          for (const color of product.colorVariations) {
            if (color.images) {
              validationResults.totalImages += color.images.length;
              if (color._debug && color._debug.validatedImages) {
                validationResults.validatedImages += color._debug.validatedImages;
              } else {
                validationResults.validatedImages += color.images.length;
              }
            }
          }
        }
      }

      console.log('📊 Résultats de validation:');
      console.log(`   Produits total: ${products.length}`);
      console.log(`   Produits validés: ${validationResults.productsValidated}`);
      console.log(`   Produits avec mélanges: ${validationResults.productsWithMixing}`);
      console.log(`   Images total: ${validationResults.totalImages}`);
      console.log(`   Images validées: ${validationResults.validatedImages}`);

      const validationRate = products.length > 0 
        ? Math.round((validationResults.productsValidated / products.length) * 100)
        : 0;

      console.log(`   Taux de validation: ${validationRate}%\n`);

      if (validationRate >= 80) {
        console.log('✅ Validation des données excellente\n');
        this.testResults.passed++;
      } else if (validationRate >= 60) {
        console.log('⚠️ Validation des données acceptable\n');
        this.testResults.passed++;
      } else {
        console.log('❌ Validation des données insuffisante\n');
        this.testResults.failed++;
        this.addIssue('VALIDATION', `Taux de validation faible: ${validationRate}%`);
      }

    } catch (error) {
      console.log('❌ Test de validation échoué');
      console.log(`   Erreur: ${error.message}\n`);
      this.addIssue('VALIDATION', 'Test de validation échoué');
      this.testResults.failed++;
    }
  }

  addIssue(type, message) {
    this.testResults.issues.push({ type, message });
  }

  generateReport() {
    console.log('📋 RAPPORT FINAL D\'INTÉGRATION FRONTEND');
    console.log('=' * 50);
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;
    
    console.log(`Tests réussis: ${this.testResults.passed}`);
    console.log(`Tests échoués: ${this.testResults.failed}`);
    console.log(`Taux de réussite: ${successRate}%`);
    
    if (this.testResults.issues.length > 0) {
      console.log('\n⚠️ Problèmes détectés:');
      this.testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
      });
    }
    
    console.log('\n🎯 RECOMMANDATIONS FRONTEND:');
    
    if (successRate >= 90) {
      console.log('✅ Le backend est prêt pour l\'intégration frontend');
      console.log('✅ La structure colorVariations est compatible');
      console.log('✅ Vous pouvez implémenter les composants React/Vue');
    } else if (successRate >= 70) {
      console.log('⚠️ Le backend est globalement compatible');
      console.log('⚠️ Quelques ajustements peuvent être nécessaires');
      console.log('⚠️ Testez avec vos données réelles');
    } else {
      console.log('❌ Le backend nécessite des corrections');
      console.log('❌ Résolvez les problèmes avant l\'intégration frontend');
      console.log('❌ Consultez la documentation BACKEND_CORRECTION_MELANGES_IMAGES_APPLIQUEE.md');
    }
    
    console.log('\n📚 Fichiers de référence:');
    console.log('- FRONTEND_INTEGRATION_COLORVARIATIONS_GUIDE.md');
    console.log('- BACKEND_CORRECTION_MELANGES_IMAGES_APPLIQUEE.md');
    console.log('- SOLUTION_FINALE_MELANGES_IMAGES.md');
    
    console.log('\n🚀 Prochaines étapes:');
    console.log('1. Implémenter les types TypeScript');
    console.log('2. Créer les composants ProductCard et ColorOption');
    console.log('3. Configurer le service API');
    console.log('4. Tester avec vos données réelles');
    console.log('5. Optimiser les performances (lazy loading, cache)');
  }
}

// Exécution des tests
async function main() {
  const tester = new FrontendIntegrationTester();
  await tester.runAllTests();
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
} 