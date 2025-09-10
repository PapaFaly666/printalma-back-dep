const axios = require('axios');

async function testCurrentStatus() {
  const renderURL = 'https://printalma-back-dep.onrender.com';
  
  console.log('🧪 Test du statut actuel du backend Render...\n');
  
  // Test plusieurs produits
  const productIds = [1, 20, 30];
  
  for (const id of productIds) {
    try {
      console.log(`📊 Test produit ${id}:`);
      
      const response = await axios.get(`${renderURL}/products/${id}`);
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 suggestedPrice: ${response.data.suggestedPrice}`);
      console.log(`   🏷️  genre: ${response.data.genre}`);
      console.log(`   📝 status: ${response.data.status}`);
      
      if (response.data.suggestedPrice !== null) {
        console.log(`   🎉 suggestedPrice fonctionne !`);
      } else {
        console.log(`   ⚠️  suggestedPrice est null`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur ${id}:`, error.response?.status || 'Network Error');
      if (error.response?.status === 404) {
        console.log(`   📄 Produit ${id} n'existe pas`);
      }
    }
    console.log('');
  }
  
  // Test d'une modification simple
  console.log('🔧 Test de modification (PATCH):');
  
  try {
    const testPayload = {
      name: "Test PATCH " + Date.now(),
      suggestedPrice: 25000,
      genre: "HOMME"
    };
    
    console.log(`📤 Test PATCH sur produit 1...`);
    console.log(`   Payload:`, JSON.stringify(testPayload));
    
    // NOTE: Ce test échouera probablement à cause de l'auth
    // mais ça nous dira si l'erreur 500 persiste
    const patchResponse = await axios.patch(`${renderURL}/products/1`, testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   ✅ PATCH réussi: ${patchResponse.status}`);
    console.log(`   📦 suggestedPrice après PATCH: ${patchResponse.data.suggestedPrice}`);
    
  } catch (error) {
    const status = error.response?.status;
    console.log(`   ❌ PATCH échoué: ${status}`);
    
    if (status === 401) {
      console.log(`   🔐 Erreur d'authentification (normal pour ce test)`);
    } else if (status === 500) {
      console.log(`   💥 Erreur 500 - Le problème persiste`);
    } else {
      console.log(`   📄 Autre erreur:`, error.response?.data?.message);
    }
  }
  
  console.log('\n🎯 Conclusion:');
  console.log('   - Si suggestedPrice n\'est plus null: ✅ Problème résolu');
  console.log('   - Si erreur 500 sur PATCH: ⚠️ Problème spécifique à la modification');
  console.log('   - Si erreur 401 sur PATCH: 🔐 Problème d\'authentification uniquement');
}

if (require.main === module) {
  testCurrentStatus().catch(console.error);
}