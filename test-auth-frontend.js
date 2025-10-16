// 🧪 Script de test d'authentification pour le frontend
// Usage: node test-auth-frontend.js

const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3004';

console.log('🔧 Test d\'authentification pour le frontend\n');

// Étape 1: Test de connexion
async function testLogin() {
  try {
    console.log('1️⃣ Test de connexion admin...');

    const loginData = {
      email: 'superadmin@printalma.com',
      password: 'printalmatest123'
    };

    const response = await axios.post(`${API_BASE}/auth/login`, loginData);

    if (response.data.token) {
      console.log('✅ Connexion réussie');
      console.log('   Token:', response.data.token.substring(0, 50) + '...');
      console.log('   Utilisateur:', response.data.user.email);
      console.log('   Rôle:', response.data.user.role);
      return response.data.token;
    } else {
      console.log('❌ Token non reçu dans la réponse');
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data?.message || error.message);
    return null;
  }
}

// Étape 2: Test de création de type de vendeur
async function createVendorType(token) {
  try {
    console.log('\n2️⃣ Création d\'un type de vendeur de test...');

    const vendorTypeData = {
      label: 'Photographe Test',
      description: 'Type de vendeur pour les photographes (test)'
    };

    const response = await axios.post(`${API_BASE}/vendor-types`, vendorTypeData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Type de vendeur créé:', response.data);
    return response.data.id;
  } catch (error) {
    console.log('❌ Erreur création type vendeur:', error.response?.data?.message || error.message);

    // Si le type existe déjà, essayer de le récupérer
    if (error.response?.status === 400) {
      console.log('🔄 Tentative de récupérer un type existant...');
      try {
        const response = await axios.get(`${API_BASE}/vendor-types`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.length > 0) {
          console.log('✅ Type de vendeur existant trouvé:', response.data[0]);
          return response.data[0].id;
        }
      } catch (getError) {
        console.log('❌ Erreur récupération types:', getError.message);
      }
    }

    return 1; // ID par défaut
  }
}

// Étape 3: Test de création de vendeur avec vendeur_type_id
async function testCreateVendorWithTypeId(token, vendorTypeId) {
  try {
    console.log('\n3️⃣ Test de création de vendeur avec vendeur_type_id...');

    // Simuler exactement ce que le frontend enverrait
    const formData = new FormData();
    formData.append('firstName', 'Jean');
    formData.append('lastName', 'Photographe');
    formData.append('email', `jean.photo.test.${Date.now()}@test.com`);
    formData.append('vendeur_type_id', vendorTypeId.toString());
    formData.append('shop_name', 'Boutique Photo Test');
    formData.append('password', 'TestPassword123!');
    formData.append('phone', '+33612345678');
    formData.append('country', 'France');
    formData.append('address', '123 Rue de la Photo, 75001 Paris');

    console.log('📋 Données FormData:');
    console.log('   - firstName:', formData.get('firstName'));
    console.log('   - lastName:', formData.get('lastName'));
    console.log('   - email:', formData.get('email'));
    console.log('   - vendeur_type_id:', formData.get('vendeur_type_id'));
    console.log('   - shop_name:', formData.get('shop_name'));
    console.log('   - Token présent:', !!token);

    const response = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Vendeur créé avec succès!');
    console.log('   ID:', response.data.id);
    console.log('   Email:', response.data.email);
    console.log('   Type:', response.data.vendeur_type);
    console.log('   Type ID:', response.data.vendorTypeId);

    return true;
  } catch (error) {
    console.log('\n❌ Erreur lors de la création du vendeur:');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message || error.message);

    if (error.response?.data) {
      console.log('   Détails:', JSON.stringify(error.response.data, null, 2));
    }

    return false;
  }
}

// Étape 4: Test de compatibilité avec l'ancien système
async function testCreateVendorLegacy(token) {
  try {
    console.log('\n4️⃣ Test de compatibilité avec vendeur_type (ancien système)...');

    const formData = new FormData();
    formData.append('firstName', 'Marie');
    formData.append('lastName', 'Designer');
    formData.append('email', `marie.designer.test.${Date.now()}@test.com`);
    formData.append('vendeur_type', 'DESIGNER'); // Ancien système
    formData.append('shop_name', 'Studio Design Test');
    formData.append('password', 'TestPassword123!');

    const response = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ Vendeur créé avec l\'ancien système!');
    console.log('   ID:', response.data.id);
    console.log('   Type:', response.data.vendeur_type);

    return true;
  } catch (error) {
    console.log('❌ Erreur avec l\'ancien système:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Démarrage des tests d\'authentification frontend...\n');

  // Étape 1: Connexion
  const token = await testLogin();
  if (!token) {
    console.log('\n💥 ÉCHEC: Impossible de se connecter. Vérifiez les identifiants.');
    return;
  }

  // Étape 2: Créer/récupérer un type de vendeur
  const vendorTypeId = await createVendorType(token);

  // Étape 3: Test avec vendeur_type_id (nouveau système)
  const successNew = await testCreateVendorWithTypeId(token, vendorTypeId);

  // Étape 4: Test avec vendeur_type (ancien système)
  const successLegacy = await testCreateVendorLegacy(token);

  // Résultats finaux
  console.log('\n📊 RÉSULTATS DES TESTS:');
  console.log('   Connexion admin: ✅');
  console.log(`   Création avec vendeur_type_id: ${successNew ? '✅' : '❌'}`);
  console.log(`   Compatibilité ancien système: ${successLegacy ? '✅' : '❌'}`);

  if (successNew) {
    console.log('\n🎉 SUCCÈS: L\'intégration vendeur_type_id fonctionne correctement!');
    console.log('   Le frontend peut maintenant utiliser vendeur_type_id pour créer des vendeurs.');
  } else {
    console.log('\n💥 ÉCHEC: Problème détecté avec l\'intégration.');
    console.log('   Vérifiez les logs ci-dessus pour identifier le problème.');
  }

  console.log('\n📝 ACTIONS POUR LE FRONTEND:');
  console.log('   1. Utilisez le token JWT reçu lors de la connexion');
  console.log('   2. Ajoutez le header: Authorization: Bearer <token>');
  console.log('   3. Envoyez vendeur_type_id (prioritaire sur vendeur_type)');
  console.log('   4. Vérifiez que l\'utilisateur a le rôle ADMIN ou SUPERADMIN');
}

// Exécuter les tests
runTests().catch(console.error);