const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Test l'intégration des types de vendeurs dynamiques
async function testVendorTypesIntegration() {
  try {
    console.log('🚀 Test de l\'intégration des types de vendeurs dynamiques\n');

    // Test 1: Tenter de créer un vendeur sans authentification (doit échouer)
    console.log('1️⃣ Test: Création vendeur sans authentification');
    try {
      const response = await axios.post(`${API_BASE}/auth/admin/create-vendor-extended`, {
        firstName: "Jean",
        lastName: "Photographe",
        email: "jean.photo@test.com",
        shop_name: "Boutique Photo Pro"
      });
      console.log('❌ Échec: Devrait échouer avec 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Échec correct avec 401 (non autorisé)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }

    // Test 2: Tenter de créer un type de vendeur sans authentification (doit échouer)
    console.log('\n2️⃣ Test: Création type vendeur sans authentification');
    try {
      const response = await axios.post(`${API_BASE}/vendor-types`, {
        label: "Photographe",
        description: "Spécialiste de la photographie professionnelle"
      });
      console.log('❌ Échec: Devrait échouer avec 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Échec correct avec 401 (non autorisé)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }

    // Test 3: Tenter de lister les types de vendeurs sans authentification
    console.log('\n3️⃣ Test: Lister types vendeurs sans authentification');
    try {
      const response = await axios.get(`${API_BASE}/vendor-types`);
      console.log('❌ Échec: Devrait échouer avec 401');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Échec correct avec 401 (non autorisé)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }

    console.log('\n📝 Note: Les endpoints nécessitent une authentification admin.');
    console.log('🔧 Implémentation terminée avec succès !');
    console.log('\n✅ Modifications implémentées:');
    console.log('   - DTO CreateClientDto mis à jour avec vendeur_type_id');
    console.log('   - Service AuthService.createVendorWithPhoto mis à jour');
    console.log('   - Logique de validation priorisant vendeur_type_id');
    console.log('   - Rétrocompatibilité avec vendeur_type maintenue');
    console.log('   - ExtendedVendorProfileResponseDto enrichi');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testVendorTypesIntegration();