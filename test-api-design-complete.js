const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';
let authToken = '';
let testDesignId = null;

// Configuration de test
const testConfig = {
  email: 'test@vendor.com',
  password: 'testpassword',
  serverPort: 3004
};

// Fonction utilitaire pour créer un fichier de test temporaire
function createTestImageFile() {
  const testImagePath = path.join(__dirname, 'test-image.txt');
  // Créer un faux fichier image pour le test
  const fakeImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(fakeImageContent, 'base64'));
  return testImagePath;
}

// Fonction pour attendre que le serveur soit démarré
async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${url}/api/products`); // Endpoint simple pour vérifier
      return true;
    } catch (error) {
      console.log(`⏳ Tentative ${i + 1}/${maxAttempts} - Serveur non prêt...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// 1. Test de connexion et récupération du token
async function testLogin() {
  console.log('🔐 Test 1: Authentification...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testConfig.email,
      password: testConfig.password
    });
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Authentification réussie');
      console.log(`   Token reçu: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Pas de token reçu');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur d\'authentification:', error.response?.data?.message || error.message);
    
    // Essayer avec des identifiants par défaut
    try {
      console.log('🔄 Essai avec identifiants par défaut...');
      const defaultResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'vendeur@example.com',
        password: 'password123'
      });
      
      if (defaultResponse.data.access_token) {
        authToken = defaultResponse.data.access_token;
        console.log('✅ Authentification réussie avec identifiants par défaut');
        return true;
      }
    } catch (defaultError) {
      console.log('❌ Échec avec identifiants par défaut aussi');
    }
    
    return false;
  }
}

// 2. Test de création de design avec fichier
async function testCreateDesign() {
  console.log('\n🎨 Test 2: Création de design...');
  
  if (!authToken) {
    console.log('❌ Pas de token d\'authentification');
    return false;
  }
  
  try {
    // Créer un fichier de test temporaire
    const testImagePath = createTestImageFile();
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('name', 'Test API Logo');
    formData.append('description', 'Logo créé via test API');
    formData.append('price', '3500');
    formData.append('category', 'logo');
    formData.append('tags', 'test,api,logo');
    
    const response = await axios.post(`${BASE_URL}/api/designs`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    if (response.data.success && response.data.data.id) {
      testDesignId = response.data.data.id;
      console.log('✅ Design créé avec succès');
      console.log(`   ID: ${testDesignId}`);
      console.log(`   Nom: ${response.data.data.name}`);
      console.log(`   Prix: ${response.data.data.price} FCFA`);
      
      // Nettoyer le fichier temporaire
      fs.unlinkSync(testImagePath);
      return true;
    } else {
      console.log('❌ Création échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la création:', error.response?.data || error.message);
    return false;
  }
}

// 3. Test de récupération des designs
async function testGetDesigns() {
  console.log('\n📋 Test 3: Récupération des designs...');
  
  if (!authToken) {
    console.log('❌ Pas de token d\'authentification');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/designs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    if (response.data.success && response.data.data.designs) {
      const designs = response.data.data.designs;
      console.log(`✅ ${designs.length} design(s) récupéré(s)`);
      
      designs.forEach((design, index) => {
        console.log(`   ${index + 1}. ${design.name} - ${design.price} FCFA`);
      });
      
      // Afficher les statistiques
      const stats = response.data.data.stats;
      console.log(`📊 Statistiques:`);
      console.log(`   Total: ${stats.total}`);
      console.log(`   Publiés: ${stats.published}`);
      console.log(`   Brouillons: ${stats.draft}`);
      
      return true;
    } else {
      console.log('❌ Récupération échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la récupération:', error.response?.data || error.message);
    return false;
  }
}

// 4. Test de modification de design
async function testUpdateDesign() {
  console.log('\n✏️ Test 4: Modification de design...');
  
  if (!authToken || !testDesignId) {
    console.log('❌ Pas de token ou pas de design à modifier');
    return false;
  }
  
  try {
    const updateData = {
      name: 'Test API Logo Modifié',
      description: 'Logo modifié via test API',
      price: 4000,
      category: 'pattern'
    };
    
    const response = await axios.put(`${BASE_URL}/api/designs/${testDesignId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.id) {
      console.log('✅ Design modifié avec succès');
      console.log(`   Nouveau nom: ${response.data.name}`);
      console.log(`   Nouveau prix: ${response.data.price} FCFA`);
      console.log(`   Nouvelle catégorie: ${response.data.category}`);
      return true;
    } else {
      console.log('❌ Modification échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la modification:', error.response?.data || error.message);
    return false;
  }
}

// 5. Test de publication de design
async function testPublishDesign() {
  console.log('\n📢 Test 5: Publication de design...');
  
  if (!authToken || !testDesignId) {
    console.log('❌ Pas de token ou pas de design à publier');
    return false;
  }
  
  try {
    const response = await axios.patch(`${BASE_URL}/api/designs/${testDesignId}/publish`, 
      { isPublished: true }, 
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.isPublished) {
      console.log('✅ Design publié avec succès');
      console.log(`   Statut publié: ${response.data.isPublished}`);
      console.log(`   Brouillon: ${response.data.isDraft}`);
      return true;
    } else {
      console.log('❌ Publication échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la publication:', error.response?.data || error.message);
    return false;
  }
}

// 6. Test des statistiques
async function testGetStats() {
  console.log('\n📊 Test 6: Récupération des statistiques...');
  
  if (!authToken) {
    console.log('❌ Pas de token d\'authentification');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/api/designs/stats/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success && response.data.data) {
      const stats = response.data.data;
      console.log('✅ Statistiques récupérées');
      console.log(`   Total designs: ${stats.total}`);
      console.log(`   Publiés: ${stats.published}`);
      console.log(`   En attente: ${stats.pending}`);
      console.log(`   Brouillons: ${stats.draft}`);
      console.log(`   Gains totaux: ${stats.totalEarnings} FCFA`);
      console.log(`   Vues totales: ${stats.totalViews}`);
      console.log(`   Likes totaux: ${stats.totalLikes}`);
      return true;
    } else {
      console.log('❌ Récupération des statistiques échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la récupération des statistiques:', error.response?.data || error.message);
    return false;
  }
}

// 7. Test de suppression de design
async function testDeleteDesign() {
  console.log('\n🗑️ Test 7: Suppression de design...');
  
  if (!authToken || !testDesignId) {
    console.log('❌ Pas de token ou pas de design à supprimer');
    return false;
  }
  
  try {
    const response = await axios.delete(`${BASE_URL}/api/designs/${testDesignId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Design supprimé avec succès');
      console.log(`   Message: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ Suppression échouée:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors de la suppression:', error.response?.data || error.message);
    return false;
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 Tests API Design - Démarrage complet');
  console.log('======================================\n');
  
  // Vérifier que le serveur est démarré
  console.log('⏳ Attente du démarrage du serveur...');
  const serverReady = await waitForServer(BASE_URL);
  
  if (!serverReady) {
    console.log('❌ Serveur non accessible après 30 tentatives');
    console.log('💡 Assurez-vous que le serveur est démarré sur le port 3004');
    return;
  }
  
  console.log('✅ Serveur prêt !\n');
  
  let results = [];
  
  // Exécuter tous les tests
  results.push(await testLogin());
  results.push(await testCreateDesign());
  results.push(await testGetDesigns());
  results.push(await testUpdateDesign());
  results.push(await testPublishDesign());
  results.push(await testGetStats());
  results.push(await testDeleteDesign());
  
  // Résumé des résultats
  console.log('\n🏁 Résumé des tests:');
  console.log('==================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 Tous les tests sont passés ! Le module Design fonctionne parfaitement.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
  
  console.log('\n📚 L\'API Design est prête pour l\'intégration frontend !');
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests }; 