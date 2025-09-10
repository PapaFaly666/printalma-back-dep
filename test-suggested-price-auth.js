const axios = require('axios');

async function testWithAuth() {
  const baseURL = 'http://localhost:3004';
  
  try {
    console.log('🔐 Test avec authentification...\n');
    
    // 1. Connexion admin
    console.log('1️⃣ Connexion admin:');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Connexion réussie');
    
    // 2. Test PATCH avec suggestedPrice
    console.log('\n2️⃣ Test PATCH avec suggestedPrice:');
    
    const patchPayload = {
      name: "Test PATCH Auth " + Date.now(),
      description: "Test avec authentification",
      price: 15000,
      suggestedPrice: 20000, // ← Test avec cette valeur
      stock: 8,
      status: "DRAFT",
      genre: "HOMME",
      categories: [1],
      sizes: ["M", "L", "XL"] // ← Tous strings pour éviter le problème de types mixtes
    };
    
    console.log('📤 Payload envoyé:');
    console.log(JSON.stringify(patchPayload, null, 2));
    
    console.log('\n⏳ Envoi du PATCH...');
    console.log('👀 Surveillez les logs backend!');
    
    const patchResponse = await axios.patch(`${baseURL}/products/1`, patchPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('\n✅ PATCH réussi!');
    console.log('📊 Réponse:');
    console.log('   - name:', patchResponse.data.name);
    console.log('   - price:', patchResponse.data.price);
    console.log('   - suggestedPrice:', patchResponse.data.suggestedPrice); // ← Valeur finale
    console.log('   - genre:', patchResponse.data.genre);
    console.log('   - status:', patchResponse.data.status);
    
    // 3. Vérification avec GET
    console.log('\n3️⃣ Vérification avec GET:');
    
    const getResponse = await axios.get(`${baseURL}/products/1`, {
      withCredentials: true
    });
    
    console.log('📖 Valeurs après PATCH:');
    console.log('   - suggestedPrice:', getResponse.data.suggestedPrice);
    console.log('   - genre:', getResponse.data.genre);
    console.log('   - status:', getResponse.data.status);
    
    // 4. Test direct en base
    console.log('\n4️⃣ Vérification directe en base...');
    
    // Sortir pour laisser le temps de vérifier les logs
    console.log('\n🎯 Test terminé!');
    console.log('🔍 Vérifiez maintenant:');
    console.log('   1. Les logs du backend pour voir le traitement');
    console.log('   2. La base de données directement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('📄 Détails:', error.response.data);
    }
  }
}

// Test simple pour voir si c'est un problème de validation
async function testValidation() {
  console.log('\n🧪 Test de validation du DTO...\n');
  
  const testValues = [
    { value: 25000, description: 'Entier normal' },
    { value: 25.99, description: 'Float avec décimales' },
    { value: 0, description: 'Zéro' },
    { value: null, description: 'null' },
    { value: undefined, description: 'undefined (non envoyé)' }
  ];
  
  for (const test of testValues) {
    console.log(`🔬 Test: ${test.description} (valeur: ${test.value})`);
    
    const payload = {
      name: `Test validation ${test.description}`,
      price: 10000,
      stock: 5,
      genre: "UNISEXE"
    };
    
    // Ajouter suggestedPrice seulement si pas undefined
    if (test.value !== undefined) {
      payload.suggestedPrice = test.value;
    }
    
    console.log(`   📤 Payload:`, JSON.stringify(payload));
    console.log('   ⏳ Regardez les logs backend...\n');
  }
}

// Exécution
if (require.main === module) {
  testWithAuth()
    .then(() => {
      console.log('\n✅ Test principal terminé');
    })
    .catch(console.error);
}