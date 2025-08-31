const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3004';

async function testOrdersPagination() {
  console.log('🧪 Test de la pagination des commandes...\n');

  // Vous devez remplacer ce token par un token admin valide
  const adminToken = 'YOUR_ADMIN_TOKEN_HERE';

  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Pagination normale
    console.log('1️⃣ Test pagination normale (page=1, limit=5)');
    const response1 = await fetch(`${API_BASE}/orders/admin/all?page=1&limit=5`, {
      headers
    });
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log();

    // Test 2: Page par défaut
    console.log('2️⃣ Test sans paramètres (défaut)');
    const response2 = await fetch(`${API_BASE}/orders/admin/all`, {
      headers
    });
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    console.log();

    // Test 3: Test avec paramètres invalides
    console.log('3️⃣ Test avec page invalide (page=0)');
    const response3 = await fetch(`${API_BASE}/orders/admin/all?page=0&limit=10`, {
      headers
    });
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    console.log();

    // Test 4: Test avec filtre de statut
    console.log('4️⃣ Test avec filtre de statut (status=PENDING)');
    const response4 = await fetch(`${API_BASE}/orders/admin/all?page=1&limit=10&status=PENDING`, {
      headers
    });
    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(result4, null, 2));
    console.log();

    // Test 5: Test des statistiques
    console.log('5️⃣ Test des statistiques frontend');
    const response5 = await fetch(`${API_BASE}/orders/admin/frontend-statistics`, {
      headers
    });
    const result5 = await response5.json();
    console.log('Status:', response5.status);
    console.log('Response:', JSON.stringify(result5, null, 2));
    console.log();

    console.log('✅ Tests terminés');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Instructions pour utiliser ce script
console.log(`
📋 INSTRUCTIONS:
1. Assurez-vous que votre backend PrintAlma fonctionne sur http://localhost:3004
2. Connectez-vous en tant qu'admin et récupérez votre token JWT
3. Remplacez 'YOUR_ADMIN_TOKEN_HERE' par votre token dans ce script
4. Exécutez: node test-orders-pagination.js

Pour obtenir un token admin, vous pouvez:
- Utiliser Postman ou curl pour vous connecter
- Ou utiliser le script test-login.js existant
`);

testOrdersPagination(); 