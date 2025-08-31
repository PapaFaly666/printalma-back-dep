const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004';

async function testCompleteDesignUpload() {
  console.log('🚀 Test Complet d\'Upload de Design avec Cloudinary');
  console.log('=================================================\n');
  
  try {
    // 1. S'authentifier pour obtenir le token JWT
    console.log('🔐 Étape 1: Authentification...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@vendor.com',
      password: 'testpassword'
    });
    
    if (!loginResponse.data.access_token) {
      console.log('❌ Erreur d\'authentification');
      return false;
    }
    
    const token = loginResponse.data.access_token;
    console.log(`✅ Token JWT obtenu: ${token.substring(0, 20)}...`);
    
    // 2. Vérifier que les images de test existent
    console.log('\n📁 Étape 2: Vérification des fichiers...');
    const pngPath = path.join(__dirname, 'test-logo.png');
    const svgPath = path.join(__dirname, 'test-logo.svg');
    
    if (!fs.existsSync(pngPath)) {
      console.log('❌ Fichier PNG introuvable. Exécutez: node create-test-image.js');
      return false;
    }
    
    if (!fs.existsSync(svgPath)) {
      console.log('❌ Fichier SVG introuvable. Exécutez: node create-test-image.js');
      return false;
    }
    
    console.log('✅ Fichiers PNG et SVG trouvés');
    
    // 3. Tester l'upload avec PNG
    console.log('\n🎨 Étape 3: Upload design PNG...');
    const pngResult = await uploadDesign(token, pngPath, {
      name: 'Logo moderne entreprise PNG',
      description: 'Un logo épuré et moderne pour entreprises tech (PNG)',
      price: '2500',
      category: 'logo',
      tags: 'moderne,entreprise,tech,png'
    });
    
    if (pngResult) {
      console.log('✅ Upload PNG réussi');
      console.log(`   Design ID: ${pngResult.id}`);
      console.log(`   URL Cloudinary: ${pngResult.imageUrl}`);
      console.log(`   Thumbnail: ${pngResult.thumbnailUrl || 'Non généré'}`);
    }
    
    // 4. Tester l'upload avec SVG
    console.log('\n🖼️ Étape 4: Upload design SVG...');
    const svgResult = await uploadDesign(token, svgPath, {
      name: 'Logo moderne entreprise SVG',
      description: 'Un logo épuré et moderne pour entreprises tech (SVG)',
      price: '3000',
      category: 'logo',
      tags: 'moderne,entreprise,tech,svg,vectoriel'
    });
    
    if (svgResult) {
      console.log('✅ Upload SVG réussi');
      console.log(`   Design ID: ${svgResult.id}`);
      console.log(`   URL Cloudinary: ${svgResult.imageUrl}`);
      console.log(`   Thumbnail: ${svgResult.thumbnailUrl || 'Non généré'}`);
    }
    
    // 5. Récupérer la liste des designs pour vérifier
    console.log('\n📋 Étape 5: Vérification des designs créés...');
    const designsResponse = await axios.get(`${BASE_URL}/api/designs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (designsResponse.data.success) {
      const designs = designsResponse.data.data.designs;
      console.log(`✅ ${designs.length} design(s) total(s) dans la base`);
      
      designs.forEach((design, index) => {
        console.log(`   ${index + 1}. ${design.name} - ${design.price} FCFA`);
        console.log(`      URL: ${design.imageUrl}`);
        console.log(`      Format: ${design.format || 'Non spécifié'}`);
      });
    }
    
    // 6. Générer les commandes curl pour l'utilisateur
    console.log('\n💡 COMMANDES CURL CORRIGÉES:');
    console.log('============================');
    
    console.log('\n1️⃣ D\'abord, s\'authentifier:');
    console.log(`curl -X POST http://localhost:3004/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email": "test@vendor.com", "password": "testpassword"}'`);
    
    console.log('\n2️⃣ Ensuite, créer le design avec fichier (PNG):');
    console.log(`curl -X POST http://localhost:3004/api/designs \\`);
    console.log(`  -H "Authorization: Bearer <VOTRE_TOKEN>" \\`);
    console.log(`  -F "file=@test-logo.png" \\`);
    console.log(`  -F "name=Logo moderne entreprise" \\`);
    console.log(`  -F "description=Un logo épuré et moderne pour entreprises tech" \\`);
    console.log(`  -F "price=2500" \\`);
    console.log(`  -F "category=logo" \\`);
    console.log(`  -F "tags=moderne,entreprise,tech"`);
    
    console.log('\n3️⃣ Ou avec fichier SVG:');
    console.log(`curl -X POST http://localhost:3004/api/designs \\`);
    console.log(`  -H "Authorization: Bearer <VOTRE_TOKEN>" \\`);
    console.log(`  -F "file=@test-logo.svg" \\`);
    console.log(`  -F "name=Logo moderne entreprise SVG" \\`);
    console.log(`  -F "description=Un logo vectoriel pour entreprises tech" \\`);
    console.log(`  -F "price=3000" \\`);
    console.log(`  -F "category=logo" \\`);
    console.log(`  -F "tags=moderne,entreprise,tech,vectoriel"`);
    
    console.log('\n✅ Test d\'upload complet terminé avec succès !');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'upload:', error.response?.data || error.message);
    return false;
  }
}

// Fonction utilitaire pour upload un design
async function uploadDesign(token, filePath, designData) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('name', designData.name);
    formData.append('description', designData.description);
    formData.append('price', designData.price);
    formData.append('category', designData.category);
    formData.append('tags', designData.tags);
    
    const response = await axios.post(`${BASE_URL}/api/designs`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      console.log('❌ Erreur upload:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur lors de l\'upload:', error.response?.data || error.message);
    return null;
  }
}

// Fonction pour tester si le serveur est accessible
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/api/products`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔍 Vérification du serveur...');
  const serverReady = await checkServer();
  
  if (!serverReady) {
    console.log('❌ Serveur non accessible sur http://localhost:3004');
    console.log('💡 Démarrez le serveur avec: npm run start:dev');
    return;
  }
  
  console.log('✅ Serveur accessible\n');
  await testCompleteDesignUpload();
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCompleteDesignUpload, uploadDesign }; 