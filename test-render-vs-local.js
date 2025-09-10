const axios = require('axios');

async function testRenderVsLocal() {
  console.log('🔍 Test Render vs Local Backend...\n');
  
  const renderURL = 'https://printalma-back-dep.onrender.com';
  const localURL = 'http://localhost:3004';
  
  // Test simple GET pour voir si les backends répondent
  console.log('1️⃣ Test GET /products/1');
  
  try {
    console.log('\n🌐 Test Render:');
    const renderResponse = await axios.get(`${renderURL}/products/1`);
    console.log('✅ Render répond:', renderResponse.status);
    console.log('📊 suggestedPrice sur Render:', renderResponse.data.suggestedPrice);
    console.log('📊 genre sur Render:', renderResponse.data.genre);
  } catch (error) {
    console.log('❌ Render erreur:', error.response?.status || 'Network Error');
  }
  
  try {
    console.log('\n🏠 Test Local:');
    const localResponse = await axios.get(`${localURL}/products/1`);
    console.log('✅ Local répond:', localResponse.status);
    console.log('📊 suggestedPrice sur Local:', localResponse.data.suggestedPrice);
    console.log('📊 genre sur Local:', localResponse.data.genre);
  } catch (error) {
    console.log('❌ Local erreur:', error.response?.status || 'Network Error');
  }
  
  // Test simple pour voir la différence de version
  console.log('\n2️⃣ Test des endpoints pour vérifier les versions:');
  
  try {
    console.log('\n🌐 Test Render health:');
    const renderHealth = await axios.get(`${renderURL}/health`).catch(() => ({ status: 404, data: 'No health endpoint' }));
    console.log('📊 Render status:', renderHealth.status);
  } catch (error) {
    console.log('⚠️ Pas d\'endpoint health sur Render');
  }
  
  console.log('\n🎯 Conclusion:');
  console.log('   - Render: Version de production (sans nos corrections)');
  console.log('   - Local: Version avec nos corrections');
  console.log('   - Il faut déployer les corrections sur Render');
  
  console.log('\n📋 Actions à faire:');
  console.log('   1. Configurez votre Git (git config --global user.name/user.email)');
  console.log('   2. Ou utilisez l\'interface web de Render pour redéployer');
  console.log('   3. Ou changez temporairement vers le backend local');
}

if (require.main === module) {
  testRenderVsLocal()
    .catch(console.error);
}