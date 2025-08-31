const axios = require('axios');

const API_BASE = 'http://localhost:3004/api';

// Configuration de test
const TEST_CONFIG = {
  // Token JWT du vendeur (à remplacer par un vrai token)
  vendorToken: 'YOUR_VENDOR_JWT_TOKEN_HERE',
  vendorId: 9, // ID du vendeur mentionné dans les logs
  baseURL: API_BASE
};

async function testImageMixingFix() {
  console.log('🧪 === TEST CORRECTION MÉLANGE D\'IMAGES ===\n');

  try {
    // 1. Test du rapport de santé avant correction
    console.log('📊 1. Génération du rapport de santé initial...');
    const healthReportBefore = await axios.get(`${API_BASE}/vendor/products/health-report`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Rapport de santé AVANT correction:');
    console.log(`   - Produits totaux: ${healthReportBefore.data.healthReport.totalProducts}`);
    console.log(`   - Produits sains: ${healthReportBefore.data.healthReport.healthyProducts}`);
    console.log(`   - Produits problématiques: ${healthReportBefore.data.healthReport.unhealthyProducts}`);
    console.log(`   - Score de santé: ${healthReportBefore.data.healthReport.overallHealthScore}%`);

    if (healthReportBefore.data.healthReport.issues.length > 0) {
      console.log('\n   Problèmes détectés:');
      healthReportBefore.data.healthReport.issues.forEach(issue => {
        console.log(`   - Produit ${issue.productId} "${issue.productName}": ${issue.issueCount} problèmes`);
        console.log(`     Types: ${issue.issueTypes.join(', ')}`);
      });
    }

    // 2. Test diagnostic en mode dry-run
    console.log('\n🔍 2. Diagnostic en mode dry-run...');
    const diagnosticResult = await axios.post(`${API_BASE}/vendor/products/fix-image-mixing`, {
      dryRun: true,
      autoFix: false
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Résultats du diagnostic:');
    console.log(`   - Produits vérifiés: ${diagnosticResult.data.report.totalProductsChecked}`);
    console.log(`   - Images vérifiées: ${diagnosticResult.data.report.totalImagesChecked}`);
    console.log(`   - Problèmes détectés: ${diagnosticResult.data.report.mixingIssuesFound}`);

    if (diagnosticResult.data.report.details.length > 0) {
      console.log('\n   Détails des problèmes:');
      diagnosticResult.data.report.details.forEach(product => {
        console.log(`   - Produit ${product.productId} "${product.productName}" (${product.productType}):`);
        product.issues.forEach(issue => {
          console.log(`     * Image ${issue.imageId}: ${issue.issue}`);
          console.log(`       Couleur attendue: ${issue.expectedColor}, Actuelle: ${issue.actualColor}`);
        });
      });
    }

    // 3. Si des problèmes sont détectés, proposer la correction
    if (diagnosticResult.data.report.mixingIssuesFound > 0) {
      console.log('\n⚠️ Des problèmes ont été détectés !');
      
      // Demander confirmation pour la correction automatique
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const shouldFix = await new Promise(resolve => {
        readline.question('Voulez-vous procéder à la correction automatique ? (oui/non): ', resolve);
      });
      
      readline.close();

      if (shouldFix.toLowerCase() === 'oui' || shouldFix.toLowerCase() === 'o') {
        console.log('\n🔧 3. Correction automatique en cours...');
        
        const fixResult = await axios.post(`${API_BASE}/vendor/products/fix-image-mixing`, {
          dryRun: false,
          autoFix: true
        }, {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Résultats de la correction:');
        console.log(`   - Problèmes corrigés: ${fixResult.data.report.issuesFixed}`);
        console.log(`   - Problèmes détectés: ${fixResult.data.report.mixingIssuesFound}`);

        // 4. Nouveau rapport de santé après correction
        console.log('\n📊 4. Génération du rapport de santé après correction...');
        const healthReportAfter = await axios.get(`${API_BASE}/vendor/products/health-report`, {
          headers: {
            'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Rapport de santé APRÈS correction:');
        console.log(`   - Produits totaux: ${healthReportAfter.data.healthReport.totalProducts}`);
        console.log(`   - Produits sains: ${healthReportAfter.data.healthReport.healthyProducts}`);
        console.log(`   - Produits problématiques: ${healthReportAfter.data.healthReport.unhealthyProducts}`);
        console.log(`   - Score de santé: ${healthReportAfter.data.healthReport.overallHealthScore}%`);

        // Comparaison avant/après
        const improvement = healthReportAfter.data.healthReport.overallHealthScore - healthReportBefore.data.healthReport.overallHealthScore;
        console.log(`\n📈 Amélioration du score de santé: ${improvement > 0 ? '+' : ''}${improvement}%`);

        if (improvement > 0) {
          console.log('✅ Correction réussie ! Les mélanges d\'images ont été résolus.');
        } else if (improvement === 0) {
          console.log('ℹ️ Aucune amélioration détectée. Les problèmes étaient peut-être déjà résolus.');
        } else {
          console.log('⚠️ Le score de santé a diminué. Vérifiez les logs pour plus de détails.');
        }
      } else {
        console.log('Correction annulée par l\'utilisateur.');
      }
    } else {
      console.log('\n✅ Aucun problème détecté ! Le système est sain.');
    }

    // 5. Test de l'API /vendor/products pour vérifier la structure de réponse
    console.log('\n🧪 5. Test de l\'API /vendor/products...');
    const productsResponse = await axios.get(`${API_BASE}/vendor/products`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Structure de réponse /vendor/products:');
    console.log(`   - Produits retournés: ${productsResponse.data.data.products.length}`);
    console.log(`   - Métadonnées de santé disponibles: ${productsResponse.data.data.healthMetrics ? 'OUI' : 'NON'}`);

    if (productsResponse.data.data.healthMetrics) {
      console.log(`   - Score global: ${productsResponse.data.data.healthMetrics.overallHealthScore}%`);
    }

    // Vérifier la structure des colorVariations pour chaque produit
    productsResponse.data.data.products.forEach(product => {
      const hasValidImages = product.colorVariations.every(cv => cv.images.length > 0);
      const validationStatus = product.images.validation.isHealthy ? '✅' : '❌';
      
      console.log(`   ${validationStatus} ${product.vendorName || 'Sans nom'} (${product.baseProduct.type}):`);
      console.log(`      - ColorVariations: ${product.colorVariations.length}`);
      console.log(`      - Images validées: ${product.images.validatedColorImages}/${product.images.total}`);
      console.log(`      - Score validation: ${product.images.validation.validationScore}%`);
      
      if (!product.images.validation.isHealthy) {
        console.log(`      - Problèmes: ${product.images.validation.totalIssuesDetected}`);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Token JWT invalide ou expiré.');
      console.log('Veuillez mettre à jour TEST_CONFIG.vendorToken avec un token valide.');
    }
  }
}

// Test de connexion simple
async function testConnection() {
  console.log('🔗 Test de connexion à l\'API...');
  
  try {
    const response = await axios.get(`${API_BASE}/vendor/health`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.vendorToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Connexion réussie à l\'API');
    return true;
  } catch (error) {
    console.log('❌ Impossible de se connecter à l\'API');
    console.log('Vérifiez que le serveur est démarré sur http://localhost:3004');
    return false;
  }
}

// Fonction pour obtenir un token de test (à adapter selon votre système d'auth)
async function getTestToken() {
  console.log('🔑 Obtention d\'un token de test...');
  
  try {
    // Exemple de login - à adapter selon votre système
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.vendor@example.com', // Email du vendeur de test
      password: 'password123'
    });
    
    if (loginResponse.data.access_token) {
      console.log('✅ Token obtenu avec succès');
      return loginResponse.data.access_token;
    }
  } catch (error) {
    console.log('❌ Impossible d\'obtenir un token de test');
    console.log('Utilisez un token JWT valide dans TEST_CONFIG.vendorToken');
  }
  
  return null;
}

// Exécution principale
async function main() {
  console.log('🚨 TEST CORRECTION MÉLANGE D\'IMAGES PRODUITS VENDEUR\n');
  
  // Vérifier si un token est configuré
  if (TEST_CONFIG.vendorToken === 'YOUR_VENDOR_JWT_TOKEN_HERE') {
    console.log('⚠️ Token JWT non configuré. Tentative d\'obtention automatique...');
    const token = await getTestToken();
    if (token) {
      TEST_CONFIG.vendorToken = token;
    } else {
      console.log('❌ Impossible de continuer sans token JWT valide.');
      console.log('Veuillez configurer TEST_CONFIG.vendorToken manuellement.');
      return;
    }
  }
  
  // Test de connexion
  const connected = await testConnection();
  if (!connected) {
    return;
  }
  
  // Exécuter les tests
  await testImageMixingFix();
  
  console.log('\n🎉 Tests terminés !');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testImageMixingFix, testConnection, getTestToken }; 
 
 
 
 
 
 
 
 
 
 
 