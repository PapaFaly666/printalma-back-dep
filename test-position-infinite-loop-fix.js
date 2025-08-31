const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Configuration de test
const testConfig = {
  vendor: {
    email: 'pf.d@zig.univ.sn',
    password: 'test123456'
  },
  wrongProductId: 2, // baseProductId qui ne devrait pas être utilisé
  wrongDesignId: 1,  // Design qui pourrait ne pas exister
};

// Configuration axios pour gérer les cookies
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important pour les cookies
  timeout: 10000
});

// Fonction pour se connecter
async function login() {
  try {
    console.log('🔐 Connexion...');
    const response = await axiosInstance.post('/auth/login', testConfig.vendor);
    
    console.log('📄 Réponse login:', Object.keys(response.data));
    
    if (response.data.user) {
      console.log('✅ Connexion réussie');
      console.log('👤 Utilisateur:', response.data.user.email);
      
      // Test du profil pour vérifier l'authentification par cookie
      try {
        const profileResponse = await axiosInstance.get('/auth/profile');
        console.log('👤 Profil vérifié:', profileResponse.data.email);
        return true;
      } catch (profileError) {
        console.log('❌ Erreur vérification profil:', profileError.response?.data || profileError.message);
        return false;
      }
    } else {
      console.log('❌ Données utilisateur manquantes dans la réponse');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Fonction pour tester les erreurs 403 avec suggestions
async function testForbiddenWithSuggestions() {
  console.log('\n🔍 Test des erreurs 403 avec suggestions...');
  
  try {
    const response = await axiosInstance.put(
      `/api/vendor-products/${testConfig.wrongProductId}/designs/${testConfig.wrongDesignId}/position/direct`,
      {
        x: 0,
        y: 0,
        scale: 0.5,
        rotation: 0,
        constraints: { adaptive: true }
      }
    );
    
    console.log('⚠️ Erreur: La requête aurait dû échouer avec 403');
    console.log('📄 Réponse inattendue:', response.data);
    
  } catch (error) {
    console.log('📄 Status de l\'erreur:', error.response?.status);
    console.log('📄 Données de l\'erreur:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('✅ Erreur 403 détectée comme attendu');
      console.log('🔧 Données de debug:', JSON.stringify(error.response.data.debugInfo, null, 2));
      
      if (error.response.data.debugInfo?.suggestion) {
        console.log('💡 Suggestion trouvée:', error.response.data.debugInfo.suggestion);
        return error.response.data.debugInfo.suggestion;
      }
    } else if (error.response?.status === 401) {
      console.log('❌ Erreur 401 - Problème d\'authentification');
    } else {
      console.error('❌ Erreur inattendue:', error.response?.data || error.message);
    }
  }
  
  return null;
}

// Fonction pour tester l'endpoint de debug
async function testDebugEndpoint() {
  console.log('\n🔍 Test de l\'endpoint de debug...');
  
  try {
    const response = await axiosInstance.get(
      `/api/vendor-products/${testConfig.wrongProductId}/designs/${testConfig.wrongDesignId}/position/debug`
    );
    
    console.log('✅ Debug endpoint réussi');
    console.log('🔧 Informations de debug:', JSON.stringify(response.data.debug, null, 2));
    
    if (response.data.debug.corrections?.length > 0) {
      console.log('💡 Corrections suggérées:');
      response.data.debug.corrections.forEach((correction, index) => {
        console.log(`  ${index + 1}. ${correction.message}`);
      });
      return response.data.debug.corrections;
    }
    
  } catch (error) {
    console.log('📄 Status de l\'erreur:', error.response?.status);
    console.log('📄 Données de l\'erreur:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('❌ Erreur 401 - Problème d\'authentification pour debug');
    } else {
      console.error('❌ Erreur debug endpoint:', error.response?.data || error.message);
    }
  }
  
  return null;
}

// Fonction pour tester avec les IDs corrects
async function testWithCorrectIds(corrections) {
  if (!corrections || corrections.length === 0) {
    console.log('⚠️ Aucune correction disponible pour tester');
    return;
  }
  
  console.log('\n🔄 Test avec les IDs corrects...');
  
  // Extraire les IDs corrects
  let correctProductId = null;
  let correctDesignId = null;
  
  corrections.forEach(correction => {
    if (correction.correctProductId) {
      correctProductId = correction.correctProductId;
    }
    if (correction.correctDesignId) {
      correctDesignId = correction.correctDesignId;
    }
  });
  
  if (!correctProductId || !correctDesignId) {
    console.log('⚠️ IDs corrects non trouvés dans les corrections');
    return;
  }
  
  try {
    console.log(`🔄 Test avec produit ${correctProductId} et design ${correctDesignId}`);
    
    const response = await axiosInstance.put(
      `/api/vendor-products/${correctProductId}/designs/${correctDesignId}/position/direct`,
      {
        x: 0,
        y: 0,
        scale: 0.5,
        rotation: 0,
        constraints: { adaptive: true }
      }
    );
    
    console.log('✅ Sauvegarde réussie avec les IDs corrects');
    console.log('📍 Position sauvegardée:', response.data.data);
    
  } catch (error) {
    console.error('❌ Erreur avec les IDs corrects:', error.response?.data || error.message);
  }
}

// Fonction pour tester la récupération de position
async function testGetPosition(productId, designId) {
  console.log(`\n📥 Test de récupération de position pour produit ${productId} et design ${designId}...`);
  
  try {
    const response = await axiosInstance.get(
      `/api/vendor-products/${productId}/designs/${designId}/position/direct`
    );
    
    console.log('✅ Récupération réussie');
    console.log('📍 Position récupérée:', response.data.data);
    
  } catch (error) {
    console.error('❌ Erreur récupération position:', error.response?.data || error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Test des corrections contre les boucles infinies');
  console.log('=' .repeat(60));
  
  // Étape 1: Connexion
  if (!await login()) {
    console.log('❌ Impossible de se connecter, arrêt du test');
    return;
  }
  
  // Étape 2: Test des erreurs 403 avec suggestions
  const suggestion = await testForbiddenWithSuggestions();
  
  // Étape 3: Test de l'endpoint de debug
  const corrections = await testDebugEndpoint();
  
  // Étape 4: Test avec les IDs corrects
  await testWithCorrectIds(corrections);
  
  // Étape 5: Test de récupération avec les IDs corrects
  if (corrections && corrections.length > 0) {
    const correctProductId = corrections.find(c => c.correctProductId)?.correctProductId;
    const correctDesignId = corrections.find(c => c.correctDesignId)?.correctDesignId;
    
    if (correctProductId && correctDesignId) {
      await testGetPosition(correctProductId, correctDesignId);
    }
  }
  
  console.log('\n✅ Test terminé');
}

// Exécuter le test
main().catch(console.error); 
 
 
 
 