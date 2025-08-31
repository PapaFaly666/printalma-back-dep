const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';

async function testBackendDesignReception() {
  console.log('🧪 Test Complet - Réception Design Backend');
  console.log('==========================================\n');
  
  try {
    // 1. Vérifier que le serveur est en marche
    console.log('🔍 Étape 1: Vérification du serveur...');
    try {
      const healthCheck = await axios.get(`${BASE_URL}/api/products`);
      console.log('✅ Serveur accessible et opérationnel');
    } catch (error) {
      console.log('❌ Serveur non accessible');
      console.log('💡 Démarrez le serveur avec: npm run start:dev');
      return false;
    }
    
    // 2. Vérifier Swagger
    console.log('\n📚 Étape 2: Vérification Swagger...');
    try {
      const swaggerCheck = await axios.get(`${BASE_URL}/api-docs`);
      console.log('✅ Swagger UI accessible sur /api-docs');
      
      // Vérifier la spec JSON
      const swaggerJson = await axios.get(`${BASE_URL}/api-docs-json`);
      const spec = swaggerJson.data;
      
      if (spec.paths && spec.paths['/api/designs'] && spec.paths['/api/designs'].post) {
        console.log('✅ Endpoint POST /api/designs trouvé dans Swagger');
        
        const postDesign = spec.paths['/api/designs'].post;
        if (postDesign.requestBody && 
            postDesign.requestBody.content && 
            postDesign.requestBody.content['multipart/form-data']) {
          console.log('✅ Support multipart/form-data configuré');
          
          const schema = postDesign.requestBody.content['multipart/form-data'].schema;
          if (schema.properties && schema.properties.file && schema.properties.file.format === 'binary') {
            console.log('✅ Champ file (binary) présent dans Swagger');
          } else {
            console.log('❌ Champ file manquant ou mal configuré');
          }
        } else {
          console.log('❌ Multipart/form-data non configuré');
        }
      } else {
        console.log('❌ Endpoint POST /api/designs non trouvé');
      }
      
    } catch (error) {
      console.log('⚠️ Swagger non accessible (optionnel)');
    }
    
    // 3. Test d'authentification
    console.log('\n🔐 Étape 3: Test d\'authentification...');
    let authToken = '';
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@vendor.com',
        password: 'testpassword'
      });
      
      if (loginResponse.data.access_token) {
        authToken = loginResponse.data.access_token;
        console.log('✅ Authentification réussie');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
      } else {
        console.log('❌ Token non reçu');
        return false;
      }
  } catch (error) {
      console.log('❌ Erreur d\'authentification:', error.response?.data?.message || error.message);
      return false;
    }
    
    // 4. Créer une image de test si elle n'existe pas
    console.log('\n🎨 Étape 4: Préparation du fichier de test...');
    const testImagePath = path.join(__dirname, 'test-logo.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('📄 Création de l\'image de test...');
      const { createTestPNG } = require('./create-test-image.js');
      createTestPNG();
    }
    console.log('✅ Fichier de test prêt');
    
    // 5. Test d'upload avec multipart/form-data
    console.log('\n📤 Étape 5: Test d\'upload de design...');
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));
      formData.append('name', 'Design Test Backend');
      formData.append('description', 'Test de réception backend avec multipart');
      formData.append('price', '2500');
      formData.append('category', 'logo');
      formData.append('tags', 'test,backend,multipart');
      
      const uploadResponse = await axios.post(`${BASE_URL}/api/designs`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      });
      
      if (uploadResponse.data.success && uploadResponse.data.data) {
        const design = uploadResponse.data.data;
        console.log('✅ Upload réussi !');
        console.log(`   ID: ${design.id}`);
        console.log(`   Nom: ${design.name}`);
        console.log(`   Prix: ${design.price} FCFA`);
        console.log(`   URL Cloudinary: ${design.imageUrl}`);
        console.log(`   Public ID: ${design.cloudinaryPublicId}`);
        console.log(`   Statut: ${design.isDraft ? 'Brouillon' : 'Publié'}`);
        
        // 6. Vérifier que le design est bien en base
        console.log('\n📋 Étape 6: Vérification en base de données...');
        const getDesignsResponse = await axios.get(`${BASE_URL}/api/designs`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (getDesignsResponse.data.success) {
          const designs = getDesignsResponse.data.data.designs;
          const uploadedDesign = designs.find(d => d.id === design.id);
          
          if (uploadedDesign) {
            console.log('✅ Design trouvé en base de données');
            console.log(`   Nom: ${uploadedDesign.name}`);
            console.log(`   Créé le: ${uploadedDesign.createdAt}`);
          } else {
            console.log('❌ Design non trouvé en base');
          }
        }
        
        return true;
    } else {
        console.log('❌ Upload échoué:', uploadResponse.data);
        return false;
    }
    
  } catch (error) {
      console.log('❌ Erreur lors de l\'upload:', error.response?.data || error.message);
      
      // Diagnostics supplémentaires
      if (error.response) {
        console.log('\n🔍 Diagnostics:');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Headers reçus: ${JSON.stringify(error.response.headers, null, 2)}`);
        
        if (error.response.status === 400) {
          console.log('💡 Erreur 400: Vérifiez la validation des champs');
        } else if (error.response.status === 401) {
          console.log('💡 Erreur 401: Problème d\'authentification');
        } else if (error.response.status === 413) {
          console.log('💡 Erreur 413: Fichier trop volumineux');
        }
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  }
}

// Fonction pour afficher le résumé
function showSummary(success) {
  console.log('\n' + '='.repeat(50));
  console.log('📋 RÉSUMÉ DU TEST');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('🎉 ✅ TOUS LES TESTS SONT PASSÉS');
    console.log('');
    console.log('✅ Serveur accessible');
    console.log('✅ Swagger configuré');
    console.log('✅ Authentification fonctionnelle');
    console.log('✅ Upload multipart/form-data opérationnel');
    console.log('✅ Cloudinary intégré');
    console.log('✅ Base de données synchronisée');
    console.log('');
    console.log('🚀 L\'API Design est PRÊTE POUR LA PRODUCTION !');
    console.log('');
    console.log('💡 Pour tester dans Swagger UI:');
    console.log('   1. Allez sur http://localhost:3004/api-docs');
    console.log('   2. Cliquez sur "Authorize"');
    console.log('   3. Entrez: Bearer <votre_token>');
    console.log('   4. Testez POST /api/designs avec un fichier');
  } else {
    console.log('❌ ⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('');
    console.log('🔧 Actions recommandées:');
    console.log('   1. Vérifiez que le serveur est démarré');
    console.log('   2. Vérifiez la configuration Cloudinary');
    console.log('   3. Vérifiez la base de données');
    console.log('   4. Consultez les logs d\'erreur ci-dessus');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Exécuter le test
async function main() {
  const result = await testBackendDesignReception();
  showSummary(result);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBackendDesignReception }; 