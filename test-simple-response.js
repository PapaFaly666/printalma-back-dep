const axios = require('axios');

async function testSimpleResponse() {
  console.log('🔍 Test simple de la réponse API...\n');

  try {
    const response = await axios.get('http://localhost:3004/public/best-sellers?limit=5');
    
    console.log('📊 Réponse complète:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📋 Analyse:');
    console.log(`- Success: ${response.data.success}`);
    console.log(`- Data length: ${response.data.data?.length || 0}`);
    console.log(`- Stats: ${JSON.stringify(response.data.stats)}`);
    console.log(`- Pagination: ${JSON.stringify(response.data.pagination)}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.log('📄 Réponse d\'erreur:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

if (require.main === module) {
  testSimpleResponse();
}

module.exports = { testSimpleResponse }; 