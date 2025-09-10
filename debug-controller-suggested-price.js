const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testSuggestedPriceViaAPI() {
  const baseURL = 'http://localhost:3004';
  
  try {
    console.log('🧪 Test du suggestedPrice via l\'API...\n');
    
    // 1. Test avec PATCH (update)
    console.log('1️⃣ Test PATCH avec suggestedPrice:');
    
    const patchPayload = {
      name: "Test PATCH suggestedPrice",
      description: "Test pour debug suggestedPrice",
      price: 25000,
      suggestedPrice: 30000, // ← Valeur de test
      stock: 5,
      status: "PUBLISHED",
      genre: "FEMME",
      categories: [1],
      sizes: ["S", "M", "L"],
      colorVariations: []
    };
    
    console.log('📤 Payload PATCH envoyé:');
    console.log(JSON.stringify(patchPayload, null, 2));
    
    try {
      const patchResponse = await axios({
        method: 'PATCH',
        url: `${baseURL}/products/1`, // ID existant
        data: patchPayload,
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('✅ PATCH réussi:', patchResponse.status);
      console.log('📊 Produit mis à jour:');
      console.log('   - suggestedPrice:', patchResponse.data.suggestedPrice);
      console.log('   - name:', patchResponse.data.name);
      console.log('   - price:', patchResponse.data.price);
      
    } catch (error) {
      console.log('❌ Erreur PATCH:', error.response?.status);
      console.log('📄 Message:', error.response?.data?.message);
    }
    
    // 2. Test de récupération pour vérifier
    console.log('\n2️⃣ Vérification avec GET:');
    
    try {
      const getResponse = await axios({
        method: 'GET',
        url: `${baseURL}/products/1`,
        withCredentials: true
      });
      
      console.log('✅ GET réussi');
      console.log('📖 Valeurs actuelles:');
      console.log('   - name:', getResponse.data.name);
      console.log('   - price:', getResponse.data.price);
      console.log('   - suggestedPrice:', getResponse.data.suggestedPrice);
      console.log('   - genre:', getResponse.data.genre);
      console.log('   - status:', getResponse.data.status);
      
    } catch (error) {
      console.log('❌ Erreur GET:', error.response?.status);
    }
    
    // 3. Test avec POST (création) - nécessite des fichiers
    console.log('\n3️⃣ Test POST création avec suggestedPrice:');
    console.log('⚠️ Test POST ignoré car nécessite des fichiers image');
    
  } catch (error) {
    console.error('💥 Erreur générale:', error.message);
  }
}

// Test spécifique pour voir les logs backend
async function testWithDetailedLogs() {
  const baseURL = 'http://localhost:3004';
  
  console.log('\n🔍 Test avec logs détaillés du backend...\n');
  
  const testPayload = {
    name: "Debug suggestedPrice " + Date.now(),
    description: "Test pour voir les logs backend",
    price: 12000,
    suggestedPrice: 18000, // ← Valeur claire pour debug
    stock: 10,
    status: "DRAFT",
    genre: "HOMME",
    categories: [1],
    sizes: ["M", "L"], // ← Types cohérents
    colorVariations: []
  };
  
  console.log('📤 Payload de test:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n⏳ Envoi de la requête PATCH...');
  console.log('🔍 Surveillez les logs du backend pour voir:');
  console.log('   - suggestedPrice reçu dans le DTO');
  console.log('   - suggestedPrice dans productData');
  console.log('   - suggestedPrice après création/modification');
  
  try {
    const response = await axios({
      method: 'PATCH',
      url: `${baseURL}/products/1`,
      data: testPayload,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 10000
    });
    
    console.log('\n✅ Requête terminée avec succès');
    console.log('📊 Réponse du backend:');
    console.log('   - suggestedPrice dans la réponse:', response.data.suggestedPrice);
    
  } catch (error) {
    console.log('\n❌ Erreur lors de la requête:');
    console.log('   - Status:', error.response?.status);
    console.log('   - Message:', error.response?.data?.message);
    console.log('   - Data:', error.response?.data);
  }
}

// Exécution
if (require.main === module) {
  console.log('🚀 Test du suggestedPrice via API\n');
  
  testSuggestedPriceViaAPI()
    .then(() => testWithDetailedLogs())
    .then(() => {
      console.log('\n🎉 Tests terminés');
      console.log('👀 Vérifiez les logs du backend pour voir les détails du traitement');
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
    });
}