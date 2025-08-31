const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testCascadeFix() {
  console.log('🔧 TEST CORRECTION CASCADE VALIDATION');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier serveur
    console.log('\n1. 🔗 Vérification serveur...');
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Serveur accessible');

    // 2. Créer un admin pour test
    console.log('\n2. 👑 Création admin test...');
    let adminToken, adminId;
    try {
      const adminResponse = await axios.post(`${API_BASE}/auth/register`, {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin.cascade@test.com',
        password: 'password123',
        role: 'ADMIN'
      });
      adminToken = adminResponse.data.token;
      adminId = adminResponse.data.user.id;
      console.log(`✅ Admin créé: ID ${adminId}`);
    } catch (error) {
      // Admin existe déjà, tenter connexion
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: 'admin.cascade@test.com',
          password: 'password123'
        });
        adminToken = loginResponse.data.token;
        adminId = loginResponse.data.user.id;
        console.log(`✅ Admin connecté: ID ${adminId}`);
      } catch (loginError) {
        console.error('❌ Impossible de créer/connecter admin');
        return;
      }
    }

    // 3. Créer un vendeur pour test
    console.log('\n3. 👤 Création vendeur test...');
    let vendorToken, vendorId;
    try {
      const vendorResponse = await axios.post(`${API_BASE}/auth/register`, {
        firstName: 'Vendeur',
        lastName: 'Cascade',
        email: 'vendeur.cascade@test.com',
        password: 'password123',
        role: 'VENDOR'
      });
      vendorToken = vendorResponse.data.token;
      vendorId = vendorResponse.data.user.id;
      console.log(`✅ Vendeur créé: ID ${vendorId}`);
    } catch (error) {
      // Vendeur existe déjà, tenter connexion
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: 'vendeur.cascade@test.com',
          password: 'password123'
        });
        vendorToken = loginResponse.data.token;
        vendorId = loginResponse.data.user.id;
        console.log(`✅ Vendeur connecté: ID ${vendorId}`);
      } catch (loginError) {
        console.error('❌ Impossible de créer/connecter vendeur');
        return;
      }
    }

    // 4. Créer un design
    console.log('\n4. 🎨 Création design...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('name', 'Design Test Cascade Fix');
    form.append('description', 'Test de correction cascade');
    form.append('price', '3000');
    form.append('category', 'LOGO');
    form.append('tags', 'test,cascade,fix');
    
    // Créer un fichier image temporaire
    const imageBuffer = Buffer.from('fake-image-data-cascade-fix');
    fs.writeFileSync('./temp-design-cascade.jpg', imageBuffer);
    form.append('image', fs.createReadStream('./temp-design-cascade.jpg'));

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

    // 5. Créer un produit avec ce design
    console.log('\n5. 📦 Création produit avec AUTO_PUBLISH...');
    
    const productResponse = await axios.post(`${API_BASE}/vendor/publish`, {
      vendorName: 'Produit Test Cascade',
      vendorDescription: 'Test cascade validation',
      vendorPrice: 2500,
      vendorStock: 10,
      selectedSizes: ['M', 'L'],
      selectedColors: ['Rouge'],
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

    const productId = productResponse.data.productId;
    console.log(`✅ Produit créé (AUTO_PUBLISH): ID ${productId}`);

    // 6. Vérifier état initial
    console.log('\n6. 🔍 Vérification état initial...');
    const initialProducts = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const initialProduct = initialProducts.data.products.find(p => p.id === productId);
    console.log(`📋 État initial: status=${initialProduct?.status}, isValidated=${initialProduct?.isValidated}`);

    // 7. Soumettre design pour validation
    console.log('\n7. 📤 Soumission design pour validation...');
    await axios.post(`${API_BASE}/designs/${designId}/submit`, {}, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Design soumis');

    // 8. VALIDER LE DESIGN (cascade devrait se déclencher)
    console.log('\n8. ✅ VALIDATION DESIGN - DÉCLENCHEMENT CASCADE...');
    
    const validationResponse = await axios.put(`${API_BASE}/designs/${designId}/validate`, {
      action: 'VALIDATE'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('🎯 DESIGN VALIDÉ - CASCADE EXÉCUTÉE !');

    // 9. Vérifier résultat cascade
    console.log('\n9. 🔍 Vérification résultat cascade...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
    
    const finalProducts = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const finalProduct = finalProducts.data.products.find(p => p.id === productId);
    
    console.log('\n📊 RÉSULTATS APRÈS CASCADE:');
    console.log('='.repeat(40));
    console.log(`📦 Produit ${productId}:`);
    console.log(`   - Status initial: PENDING`);
    console.log(`   - Status final: ${finalProduct?.status}`);
    console.log(`   - isValidated: ${finalProduct?.isValidated}`);
    console.log(`   - postValidationAction: ${finalProduct?.postValidationAction}`);
    
    // 10. Validation du résultat
    if (finalProduct?.status === 'PUBLISHED' && finalProduct?.isValidated === true) {
      console.log('\n🎉 CASCADE RÉUSSIE !');
      console.log('✅ Le produit a été publié automatiquement');
      console.log('✅ Le champ isValidated est à true');
    } else {
      console.log('\n❌ CASCADE ÉCHOUÉE !');
      console.log(`❌ Status attendu: PUBLISHED, reçu: ${finalProduct?.status}`);
      console.log(`❌ isValidated attendu: true, reçu: ${finalProduct?.isValidated}`);
    }

    // Nettoyer
    fs.unlinkSync('./temp-design-cascade.jpg');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    // Nettoyer en cas d'erreur
    try {
      fs.unlinkSync('./temp-design-cascade.jpg');
    } catch (e) {
      // Ignorer
    }
  }
}

// Exécuter le test
testCascadeFix().catch(console.error); 
 