// Script de test pour vérifier l'envoi d'emails avec types de vendeurs
// Utilisez ce script pour tester rapidement l'envoi d'emails

const axios = require('axios');

const testEmailGeneration = async () => {
  try {
    console.log('🧪 Test de génération de mot de passe...');
    const response = await axios.get('http://localhost:3000/mail/test-password-generation');
    console.log('✅ Génération de mot de passe:', response.data);
    return response.data.password;
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.response?.data || error.message);
    return null;
  }
};

const testSellerTypes = async () => {
  try {
    console.log('\n📋 Test des types de vendeurs disponibles...');
    const response = await axios.get('http://localhost:3000/mail/seller-types');
    console.log('✅ Types de vendeurs:', response.data);
    return response.data.types;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des types:', error.response?.data || error.message);
    return [];
  }
};

const testEmailSending = async () => {
  try {
    console.log('\n📧 Test d\'envoi d\'email simple...');
    const response = await axios.post('http://localhost:3000/mail/test-send-email', {
      email: 'pfdiagne35@gmail.com',
      firstName: 'Test',
      lastName: 'Simple'
    });
    console.log('✅ Email simple envoyé:', response.data);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi simple:', error.response?.data || error.message);
  }
};

const testEmailWithSellerType = async (vendeurType) => {
  try {
    console.log(`\n🎨 Test d\'envoi d\'email pour ${vendeurType}...`);
    const response = await axios.post('http://localhost:3000/mail/test-send-email-with-type', {
      email: 'pfdiagne35@gmail.com',
      firstName: 'Test',
      lastName: vendeurType,
      vendeurType: vendeurType
    });
    console.log(`✅ Email ${vendeurType} envoyé:`, response.data);
  } catch (error) {
    console.error(`❌ Erreur lors de l\'envoi ${vendeurType}:`, error.response?.data || error.message);
  }
};

const testAdminCreateClient = async () => {
  try {
    console.log('\n👤 Test de création de client avec type...');
    
    // D'abord, vous devez avoir un token admin
    // Pour cela, connectez-vous avec un compte admin
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@printalma.com', // Remplacez par votre email admin
      password: 'your-admin-password' // Remplacez par votre mot de passe admin
    });
    
    const token = loginResponse.data.access_token;
    
    // Puis créez un client avec un type de vendeur
    const createResponse = await axios.post(
      'http://localhost:3000/auth/admin/create-client',
      {
        firstName: 'Jean',
        lastName: 'Designer',
        email: 'jean.designer@example.com',
        vendeur_type: 'DESIGNER'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Client créé avec type:', createResponse.data);
  } catch (error) {
    console.error('❌ Erreur lors de la création du client:', error.response?.data || error.message);
  }
};

// Exécuter les tests
const runTests = async () => {
  console.log('🚀 Démarrage des tests email PrintAlma avec types de vendeurs\n');
  
  // Attendre que l'application soit démarrée
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Tests de base
  await testEmailGeneration();
  const sellerTypes = await testSellerTypes();
  
  // Test d'envoi simple
  await testEmailSending();
  
  // Tests avec chaque type de vendeur
  console.log('\n🎨 Tests d\'emails avec types de vendeurs:');
  for (const type of ['DESIGNER', 'INFLUENCEUR', 'ARTISTE']) {
    await testEmailWithSellerType(type);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre les envois
  }
  
  console.log('\n📝 Note: Pour tester la création de client avec type, vous devez d\'abord:');
  console.log('   1. Créer un compte admin dans la base de données');
  console.log('   2. Modifier le script testAdminCreateClient avec vos identifiants admin');
  console.log('   3. Exécuter la migration Prisma pour ajouter le champ vendeur_type\n');
  
  console.log('📋 Types de vendeurs disponibles:');
  console.log('   - DESIGNER: Création de designs graphiques et visuels');
  console.log('   - INFLUENCEUR: Promotion via réseaux sociaux et influence');
  console.log('   - ARTISTE: Création artistique et œuvres originales\n');
  
  console.log('🎉 Tests terminés ! Vérifiez votre boîte email (pfdiagne35@gmail.com).');
  console.log('💡 Vous devriez avoir reçu 4 emails : 1 simple + 3 avec types de vendeurs');
};

// Installer axios si nécessaire
if (require.main === module) {
  runTests().catch(console.error);
} 