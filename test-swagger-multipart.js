const axios = require('axios');

async function testSwaggerDocumentation() {
  console.log('🔍 Test de la Documentation Swagger pour Upload Design');
  console.log('=================================================\n');
  
  try {
    // 1. Vérifier que Swagger est accessible
    console.log('📋 Étape 1: Vérification de Swagger UI...');
    const swaggerResponse = await axios.get('http://localhost:3004/api-docs');
    
    if (swaggerResponse.status === 200) {
      console.log('✅ Swagger UI accessible sur http://localhost:3004/api-docs');
    }
    
    // 2. Récupérer la spec OpenAPI JSON
    console.log('\n📄 Étape 2: Vérification de la spécification OpenAPI...');
    const openApiResponse = await axios.get('http://localhost:3004/api-docs-json');
    
    if (openApiResponse.status === 200) {
      const openApiSpec = openApiResponse.data;
      console.log('✅ Spécification OpenAPI récupérée');
      
      // 3. Vérifier l'endpoint POST /api/designs
      const designsPostPath = openApiSpec.paths['/api/designs']?.post;
      
      if (designsPostPath) {
        console.log('\n🎯 Étape 3: Analyse de l\'endpoint POST /api/designs...');
        console.log(`✅ Endpoint trouvé: ${designsPostPath.summary}`);
        
        // Vérifier le Content-Type
        const consumes = designsPostPath.consumes || [];
        const requestBody = designsPostPath.requestBody;
        
        if (requestBody && requestBody.content && requestBody.content['multipart/form-data']) {
          console.log('✅ Content-Type multipart/form-data supporté');
          
          const schema = requestBody.content['multipart/form-data'].schema;
          const properties = schema.properties || {};
          
          console.log('\n📝 Champs disponibles dans le formulaire:');
          Object.keys(properties).forEach(fieldName => {
            const field = properties[fieldName];
            console.log(`   • ${fieldName}: ${field.type} ${field.format ? `(${field.format})` : ''}`);
            
            if (fieldName === 'file' && field.format === 'binary') {
              console.log('     ✅ Champ fichier correctement configuré pour upload');
            }
          });
          
          // Vérifier que le champ file existe
          if (properties.file && properties.file.format === 'binary') {
            console.log('\n🎉 Upload de fichier correctement configuré dans Swagger !');
            
            console.log('\n💡 Instructions pour tester dans Swagger UI:');
            console.log('1. Allez sur http://localhost:3004/api-docs');
            console.log('2. Cliquez sur "Authorize" et entrez votre token JWT');
            console.log('3. Trouvez l\'endpoint POST /api/designs');
            console.log('4. Cliquez sur "Try it out"');
            console.log('5. Vous devriez voir un bouton "Choose file" pour uploader');
            console.log('6. Remplissez les autres champs et testez');
            
            return true;
          } else {
            console.log('❌ Champ file manquant ou mal configuré');
            return false;
          }
        } else {
          console.log('❌ Content-Type multipart/form-data non trouvé');
          return false;
        }
      } else {
        console.log('❌ Endpoint POST /api/designs non trouvé dans la spec');
        return false;
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Serveur non accessible sur http://localhost:3004');
      console.log('💡 Démarrez le serveur avec: npm run start:dev');
      return false;
    } else {
      console.error('❌ Erreur lors du test:', error.message);
      return false;
    }
  }
}

async function showSwaggerInfo() {
  console.log('\n📚 INFORMATIONS SWAGGER');
  console.log('========================');
  console.log('Swagger UI: http://localhost:3004/api-docs');
  console.log('OpenAPI JSON: http://localhost:3004/api-docs-json');
  console.log('');
  console.log('🔐 Pour tester avec authentification:');
  console.log('1. Obtenez un token avec: POST /api/auth/login');
  console.log('2. Dans Swagger, cliquez sur "Authorize"');
  console.log('3. Entrez: Bearer <votre_token>');
  console.log('4. Testez l\'upload sur POST /api/designs');
}

async function main() {
  const result = await testSwaggerDocumentation();
  await showSwaggerInfo();
  
  if (result) {
    console.log('\n🎉 Swagger est correctement configuré pour l\'upload de fichiers !');
  } else {
    console.log('\n⚠️ Problème détecté dans la configuration Swagger.');
  }
}

// Exécuter le test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSwaggerDocumentation }; 