const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3004';

// Configuration pour les tests
const config = {
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // Remplacez par un vrai token admin
    'Content-Type': 'application/json'
  }
};

async function testThemesEndpoints() {
  console.log('🧪 Test des endpoints des thèmes');
  console.log('================================\n');

  try {
    // 1. Test GET /themes - Liste des thèmes
    console.log('1. Test GET /themes - Liste des thèmes');
    console.log('----------------------------------------');
    
    const getThemesResponse = await axios.get(`${BASE_URL}/themes`, config);
    console.log('✅ GET /themes réussi');
    console.log('📊 Nombre de thèmes:', getThemesResponse.data.data?.length || 0);
    console.log('📋 Pagination:', getThemesResponse.data.pagination);
    console.log('');

    // 2. Test POST /themes - Créer un thème
    console.log('2. Test POST /themes - Créer un thème');
    console.log('----------------------------------------');
    
    // Créer un fichier de test temporaire
    const testImagePath = './test-theme-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      const testImageBuffer = Buffer.from('fake theme image data');
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    const createThemeFormData = new FormData();
    createThemeFormData.append('name', 'Test Thème Manga');
    createThemeFormData.append('description', 'Thème de test pour les mangas et animes');
    createThemeFormData.append('category', 'anime');
    createThemeFormData.append('status', 'active');
    createThemeFormData.append('featured', 'false');
    createThemeFormData.append('coverImage', fs.createReadStream(testImagePath));

    const createThemeResponse = await axios.post(`${BASE_URL}/themes`, createThemeFormData, {
      headers: {
        ...createThemeFormData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    console.log('✅ POST /themes réussi');
    console.log('📋 Thème créé:', createThemeResponse.data.data);
    const themeId = createThemeResponse.data.data.id;
    console.log('🆔 ID du thème créé:', themeId);
    console.log('');

    // 3. Test GET /themes/:id - Détails d'un thème
    console.log('3. Test GET /themes/:id - Détails d\'un thème');
    console.log('----------------------------------------------');
    
    const getThemeResponse = await axios.get(`${BASE_URL}/themes/${themeId}`, config);
    console.log('✅ GET /themes/:id réussi');
    console.log('📋 Détails du thème:', getThemeResponse.data.data);
    console.log('');

    // 4. Test PATCH /themes/:id - Modifier un thème
    console.log('4. Test PATCH /themes/:id - Modifier un thème');
    console.log('----------------------------------------------');
    
    const updateThemeFormData = new FormData();
    updateThemeFormData.append('name', 'Test Thème Manga Modifié');
    updateThemeFormData.append('description', 'Description mise à jour du thème de test');
    updateThemeFormData.append('category', 'anime');
    updateThemeFormData.append('status', 'active');
    updateThemeFormData.append('featured', 'true');

    const updateThemeResponse = await axios.patch(`${BASE_URL}/themes/${themeId}`, updateThemeFormData, {
      headers: {
        ...updateThemeFormData.getHeaders(),
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    console.log('✅ PATCH /themes/:id réussi');
    console.log('📋 Thème modifié:', updateThemeResponse.data.data);
    console.log('');

    // 5. Test avec filtres
    console.log('5. Test GET /themes avec filtres');
    console.log('----------------------------------');
    
    const filteredResponse = await axios.get(`${BASE_URL}/themes?status=active&category=anime&limit=5`, config);
    console.log('✅ GET /themes avec filtres réussi');
    console.log('📊 Thèmes filtrés:', filteredResponse.data.data?.length || 0);
    console.log('');

    // 6. Test DELETE /themes/:id - Supprimer un thème
    console.log('6. Test DELETE /themes/:id - Supprimer un thème');
    console.log('------------------------------------------------');
    
    const deleteThemeResponse = await axios.delete(`${BASE_URL}/themes/${themeId}`, config);
    console.log('✅ DELETE /themes/:id réussi');
    console.log('📋 Réponse:', deleteThemeResponse.data);
    console.log('');

    // 7. Vérifier que le thème a bien été supprimé
    console.log('7. Vérification de la suppression');
    console.log('-----------------------------------');
    
    try {
      await axios.get(`${BASE_URL}/themes/${themeId}`, config);
      console.log('❌ ERREUR: Le thème existe encore');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ SUCCÈS: Le thème a bien été supprimé (404 attendu)');
      } else {
        console.log('❌ ERREUR inattendue:', error.response?.status);
      }
    }

    console.log('\n🎉 Tous les tests des thèmes sont passés !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Le serveur n\'est pas démarré.');
      console.log('   - Lancez: npm run start:dev');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Problème d\'authentification.');
      console.log('   - Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Erreur 400 - Vérifiez les données envoyées.');
      console.log('   - Regardez les détails de l\'erreur ci-dessus');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Endpoint non trouvé.');
      console.log('   - Vérifiez que les routes sont bien configurées');
    }
  }
}

async function testWithCurl() {
  console.log('\n🔄 Commandes curl pour tester manuellement');
  console.log('===========================================\n');

  console.log('1. Lister les thèmes:');
  console.log(`   curl -X GET ${BASE_URL}/themes \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -H "Content-Type: application/json"');
  console.log('');
  
  console.log('2. Créer un thème:');
  console.log(`   curl -X POST ${BASE_URL}/themes \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -F "name=Manga Collection" \\');
  console.log('     -F "description=Thème dédié aux mangas" \\');
  console.log('     -F "category=anime" \\');
  console.log('     -F "status=active" \\');
  console.log('     -F "featured=false" \\');
  console.log('     -F "coverImage=@/path/to/image.jpg"');
  console.log('');
  
  console.log('3. Récupérer un thème:');
  console.log(`   curl -X GET ${BASE_URL}/themes/1 \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
  console.log('');
  
  console.log('4. Modifier un thème:');
  console.log(`   curl -X PATCH ${BASE_URL}/themes/1 \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('     -F "name=Manga Collection Updated" \\');
  console.log('     -F "description=Description mise à jour" \\');
  console.log('     -F "featured=true"');
  console.log('');
  
  console.log('5. Supprimer un thème:');
  console.log(`   curl -X DELETE ${BASE_URL}/themes/1 \\`);
  console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
}

function showExpectedResults() {
  console.log('\n📋 Résultats attendus');
  console.log('=====================\n');

  console.log('✅ GET /themes doit retourner:');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "data": [');
  console.log('       {');
  console.log('         "id": 1,');
  console.log('         "name": "Manga Collection",');
  console.log('         "description": "Thème dédié aux mangas",');
  console.log('         "coverImage": "https://res.cloudinary.com/...",');
  console.log('         "productCount": 0,');
  console.log('         "status": "active",');
  console.log('         "category": "anime",');
  console.log('         "featured": false');
  console.log('       }');
  console.log('     ],');
  console.log('     "pagination": {');
  console.log('       "total": 1,');
  console.log('       "limit": 20,');
  console.log('       "offset": 0,');
  console.log('       "hasMore": false');
  console.log('     }');
  console.log('   }');
  console.log('');
  
  console.log('✅ POST /themes doit retourner:');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "data": { ... },');
  console.log('     "message": "Thème créé avec succès"');
  console.log('   }');
}

// Exécution des tests
async function runAllTests() {
  await testThemesEndpoints();
  testWithCurl();
  showExpectedResults();
}

// Instructions d'utilisation
console.log('📋 Instructions pour utiliser ce script:');
console.log('1. Assurez-vous que le serveur backend est démarré sur http://localhost:3004');
console.log('2. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin');
console.log('3. Exécutez: node test-themes.js\n');

// Décommentez la ligne suivante pour exécuter les tests
// runAllTests();

module.exports = {
  testThemesEndpoints,
  testWithCurl,
  runAllTests
}; 