// Test de la nouvelle logique de validation en cascade design -> produits
const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testDesignValidationCascade() {
  console.log('🧪 TEST: Validation en cascade design -> produits');
  console.log('='.repeat(60));

  try {
    // 1. Créer un vendeur de test
    console.log('\n1. 👤 Création vendeur de test...');
    const vendorResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: 'Test',
      lastName: 'Validation',
      email: 'test.validation@example.com',
      password: 'password123',
      role: 'VENDOR'
    });
    
    const vendorId = vendorResponse.data.user.id;
    const vendorToken = vendorResponse.data.token;
    console.log(`✅ Vendeur créé: ID ${vendorId}`);

    // 2. Créer un design
    console.log('\n2. 🎨 Création design...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('name', 'Design Test Cascade');
    form.append('description', 'Design pour tester la validation en cascade');
    form.append('price', '5000');
    form.append('category', 'TSHIRT');
    form.append('tags', 'test,cascade,validation');
    
    // Créer un fichier image temporaire
    const imageBuffer = Buffer.from('fake-image-data');
    fs.writeFileSync('/tmp/test-design.jpg', imageBuffer);
    form.append('image', fs.createReadStream('/tmp/test-design.jpg'));

    const designResponse = await axios.post(`${API_BASE}/designs`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${vendorToken}`
      }
    });
    
    const designId = designResponse.data.data.id;
    const designImageUrl = designResponse.data.data.imageUrl;
    console.log(`✅ Design créé: ID ${designId}`);
    console.log(`📸 Image URL: ${designImageUrl}`);

    // 3. Créer 2 produits avec ce design - un AUTO_PUBLISH et un TO_DRAFT
    console.log('\n3. 📦 Création produits avec design...');
    
    // Produit 1: AUTO_PUBLISH
    const product1Response = await axios.post(`${API_BASE}/vendor/publish`, {
      vendorName: 'Produit Auto-Publish',
      vendorDescription: 'Produit qui sera publié automatiquement',
      vendorPrice: 2500,
      vendorStock: 10,
      selectedSizes: ['M', 'L'],
      selectedColors: ['Rouge', 'Bleu'],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-Shirt Base',
          description: 'T-Shirt de base',
          price: 1500,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Rouge',
                colorCode: '#FF0000',
                images: [{ id: 1, url: 'https://example.com/red.jpg' }]
              },
              {
                id: 2,
                name: 'Bleu',
                colorCode: '#0000FF',
                images: [{ id: 2, url: 'https://example.com/blue.jpg' }]
              }
            ]
          }
        },
        designApplication: {
          scale: 0.6,
          positioning: 'CENTER'
        }
      },
      forcedStatus: 'PENDING',
      designCloudinaryUrl: designImageUrl,
      postValidationAction: 'AUTO_PUBLISH'
    }, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });

    const product1Id = product1Response.data.productId;
    console.log(`✅ Produit 1 créé (AUTO_PUBLISH): ID ${product1Id}`);

    // Produit 2: TO_DRAFT
    const product2Response = await axios.post(`${API_BASE}/vendor/publish`, {
      vendorName: 'Produit To-Draft',
      vendorDescription: 'Produit qui sera mis en brouillon',
      vendorPrice: 3000,
      vendorStock: 5,
      selectedSizes: ['S', 'M'],
      selectedColors: ['Vert', 'Noir'],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-Shirt Base',
          description: 'T-Shirt de base',
          price: 1500,
          images: {
            colorVariations: [
              {
                id: 3,
                name: 'Vert',
                colorCode: '#00FF00',
                images: [{ id: 3, url: 'https://example.com/green.jpg' }]
              },
              {
                id: 4,
                name: 'Noir',
                colorCode: '#000000',
                images: [{ id: 4, url: 'https://example.com/black.jpg' }]
              }
            ]
          }
        },
        designApplication: {
          scale: 0.7,
          positioning: 'CENTER'
        }
      },
      forcedStatus: 'PENDING',
      designCloudinaryUrl: designImageUrl,
      postValidationAction: 'TO_DRAFT'
    }, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });

    const product2Id = product2Response.data.productId;
    console.log(`✅ Produit 2 créé (TO_DRAFT): ID ${product2Id}`);

    // 4. Vérifier l'état initial des produits
    console.log('\n4. 🔍 Vérification état initial...');
    
    const initialProducts = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    console.log('État initial des produits:');
    initialProducts.data.products.forEach(p => {
      console.log(`  - Produit ${p.id}: ${p.status} (Action: ${p.postValidationAction})`);
    });

    // 5. Créer un admin pour la validation
    console.log('\n5. 👑 Création admin...');
    const adminResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin.test@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    
    const adminToken = adminResponse.data.token;
    const adminId = adminResponse.data.user.id;
    console.log(`✅ Admin créé: ID ${adminId}`);

    // 6. Soumettre le design pour validation
    console.log('\n6. 📤 Soumission design pour validation...');
    await axios.post(`${API_BASE}/designs/${designId}/submit`, {}, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Design soumis pour validation');

    // 7. Valider le design (admin) - ici la cascade devrait se déclencher
    console.log('\n7. ✅ Validation du design par admin...');
    console.log('🔄 DÉCLENCHEMENT DE LA CASCADE...');
    
    const validationResponse = await axios.put(`${API_BASE}/designs/${designId}/validate`, {
      action: 'VALIDATE'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('✅ Design validé par admin');
    console.log('🎯 CASCADE EXÉCUTÉE !');

    // 8. Vérifier l'état final des produits
    console.log('\n8. 🔍 Vérification état final...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
    
    const finalProducts = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    console.log('\n📊 RÉSULTATS DE LA CASCADE:');
    console.log('='.repeat(40));
    
    finalProducts.data.products.forEach(p => {
      const expectedStatus = p.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT';
      const isCorrect = p.status === expectedStatus;
      
      console.log(`📦 Produit ${p.id}:`);
      console.log(`   - Action choisie: ${p.postValidationAction}`);
      console.log(`   - Statut attendu: ${expectedStatus}`);
      console.log(`   - Statut réel: ${p.status}`);
      console.log(`   - Validé: ${p.isValidated}`);
      console.log(`   - Résultat: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log('');
    });

    // 9. Statistiques finales
    console.log('\n📈 STATISTIQUES FINALES:');
    console.log('='.repeat(40));
    
    const publishedCount = finalProducts.data.products.filter(p => p.status === 'PUBLISHED').length;
    const draftCount = finalProducts.data.products.filter(p => p.status === 'DRAFT').length;
    const validatedCount = finalProducts.data.products.filter(p => p.isValidated).length;
    
    console.log(`📊 Produits publiés automatiquement: ${publishedCount}`);
    console.log(`📝 Produits en brouillon validés: ${draftCount}`);
    console.log(`✅ Total produits validés: ${validatedCount}`);
    console.log(`🎯 Cascade réussie: ${validatedCount === 2 ? 'OUI' : 'NON'}`);

    // 10. Nettoyer les fichiers temporaires
    fs.unlinkSync('/tmp/test-design.jpg');
    
    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    // Nettoyer en cas d'erreur
    try {
      fs.unlinkSync('/tmp/test-design.jpg');
    } catch (e) {
      // Ignorer l'erreur de nettoyage
    }
  }
}

// Fonction d'aide pour vérifier le statut du serveur
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Serveur accessible');
    return true;
  } catch (error) {
    console.error('❌ Serveur non accessible. Assurez-vous que le serveur est démarré sur le port 3004');
    return false;
  }
}

// Exécuter le test
async function runTest() {
  console.log('🚀 DÉMARRAGE DU TEST DE VALIDATION EN CASCADE');
  console.log('='.repeat(60));
  
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    process.exit(1);
  }
  
  await testDesignValidationCascade();
}

runTest().catch(console.error); 
 