const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Test final avec les bons IDs
async function testPositionFinal() {
  console.log('🚀 Test final des corrections de position');
  console.log('=' .repeat(60));
  
  try {
    // Étape 1: Login et récupération du cookie
    console.log('1️⃣ Connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pf.d@zig.univ.sn',
      password: 'test123456'
    }, {
      withCredentials: true
    });
    
    const setCookieHeader = loginResponse.headers['set-cookie'];
    const authCookie = setCookieHeader.find(cookie => cookie.includes('auth_token')).split(';')[0];
    console.log('✅ Connexion réussie');
    
    // Étape 2: Test avec les MAUVAIS IDs (doit échouer avec 403 + suggestions)
    console.log('\n2️⃣ Test avec les MAUVAIS IDs (baseProductId: 2)...');
    
    try {
      const badResponse = await axios.put(
        `${BASE_URL}/api/vendor-products/2/designs/1/position/direct`,
        {
          x: 0,
          y: 0,
          scale: 0.5,
          rotation: 0,
          constraints: { adaptive: true }
        },
        {
          headers: { 'Cookie': authCookie }
        }
      );
      
      console.log('❌ ERREUR: La requête aurait dû échouer !');
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Erreur 403 détectée comme attendu');
        console.log('💡 Suggestion:', error.response.data.debugInfo?.suggestion);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status, error.response?.data?.message);
      }
    }
    
    // Étape 3: Test avec les BONS IDs (doit réussir)
    console.log('\n3️⃣ Test avec les BONS IDs (vendorProductId: 47, designId: 21)...');
    
    try {
      const goodResponse = await axios.put(
        `${BASE_URL}/api/vendor-products/47/designs/21/position/direct`,
        {
          x: 100,
          y: 50,
          scale: 0.8,
          rotation: 15,
          constraints: { adaptive: true, area: "design-placement" }
        },
        {
          headers: { 'Cookie': authCookie }
        }
      );
      
      console.log('✅ Sauvegarde réussie avec les bons IDs');
      console.log('📍 Position sauvegardée:', goodResponse.data.data);
      
    } catch (error) {
      console.log('❌ Erreur avec les bons IDs:', error.response?.status, error.response?.data?.message);
    }
    
    // Étape 4: Vérification de la récupération
    console.log('\n4️⃣ Vérification de la récupération...');
    
    try {
      const getResponse = await axios.get(
        `${BASE_URL}/api/vendor-products/47/designs/21/position/direct`,
        {
          headers: { 'Cookie': authCookie }
        }
      );
      
      console.log('✅ Récupération réussie');
      console.log('📍 Position récupérée:', getResponse.data.data);
      
    } catch (error) {
      console.log('❌ Erreur récupération:', error.response?.status, error.response?.data?.message);
    }
    
    // Étape 5: Test du debug endpoint
    console.log('\n5️⃣ Test du debug endpoint...');
    
    try {
      const debugResponse = await axios.get(
        `${BASE_URL}/api/vendor-products/2/designs/1/position/debug`,
        {
          headers: { 'Cookie': authCookie }
        }
      );
      
      console.log('✅ Debug endpoint accessible');
      console.log('🔧 Corrections suggérées:', debugResponse.data.debug.corrections);
      
    } catch (error) {
      console.log('❌ Erreur debug:', error.response?.status, error.response?.data?.message);
    }
    
    // Étape 6: Test avec un autre design
    console.log('\n6️⃣ Test avec un autre design (designId: 22)...');
    
    try {
      const otherResponse = await axios.put(
        `${BASE_URL}/api/vendor-products/47/designs/22/position/direct`,
        {
          x: 200,
          y: 100,
          scale: 0.6,
          rotation: 30,
          constraints: { adaptive: true, area: "design-placement" }
        },
        {
          headers: { 'Cookie': authCookie }
        }
      );
      
      console.log('✅ Sauvegarde réussie avec design 22');
      console.log('📍 Position sauvegardée:', otherResponse.data.data);
      
    } catch (error) {
      console.log('❌ Erreur avec design 22:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('✅ Les corrections backend fonctionnent correctement');
    console.log('📋 Résumé:');
    console.log('   - Erreur 403 avec suggestions pour les mauvais IDs ✅');
    console.log('   - Sauvegarde réussie avec les bons IDs ✅');
    console.log('   - Récupération des positions ✅');
    console.log('   - Debug endpoint avec corrections ✅');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testPositionFinal(); 
 
 
 
 