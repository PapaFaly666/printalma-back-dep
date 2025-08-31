const axios = require('axios');

const API_BASE = 'http://localhost:3004';

// Configuration de test
const TEST_CONFIG = {
  admin: {
    email: 'admin.test@printalma.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'Test'
  },
  vendor: {
    email: 'vendor.test@printalma.com', 
    password: 'vendor123',
    firstName: 'Vendeur',
    lastName: 'Test'
  }
};

async function testCascadeValidation() {
  console.log('🧪 === TEST CASCADE VALIDATION ===');
  console.log('='.repeat(50));

  let adminToken, vendorToken, designId, productId;

  try {
    // 1. Setup utilisateurs
    console.log('\n1. 👥 Setup utilisateurs...');
    
    // Admin
    try {
      const adminAuth = await axios.post(`${API_BASE}/auth/login`, {
        email: TEST_CONFIG.admin.email,
        password: TEST_CONFIG.admin.password
      });
      adminToken = adminAuth.data.token;
      console.log('✅ Admin connecté');
    } catch (error) {
      console.log('❌ Admin login failed, creating...');
      const adminReg = await axios.post(`${API_BASE}/auth/register`, {
        ...TEST_CONFIG.admin,
        role: 'ADMIN'
      });
      adminToken = adminReg.data.token;
      console.log('✅ Admin créé et connecté');
    }

    // Vendeur
    try {
      const vendorAuth = await axios.post(`${API_BASE}/auth/login`, {
        email: TEST_CONFIG.vendor.email,
        password: TEST_CONFIG.vendor.password
      });
      vendorToken = vendorAuth.data.token;
      console.log('✅ Vendeur connecté');
    } catch (error) {
      console.log('❌ Vendor login failed, creating...');
      const vendorReg = await axios.post(`${API_BASE}/auth/register`, {
        ...TEST_CONFIG.vendor,
        role: 'VENDOR'
      });
      vendorToken = vendorReg.data.token;
      console.log('✅ Vendeur créé et connecté');
    }

    // 2. Créer un design
    console.log('\n2. 🎨 Création design...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('name', 'Design Test Cascade');
    form.append('description', 'Test cascade validation automatique');
    form.append('price', '5000');
    form.append('category', 'LOGO');
    form.append('tags', 'test,cascade,validation');
    
    // Créer un fichier image fictif
    const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('./test-design.png', imageBuffer);
    form.append('image', fs.createReadStream('./test-design.png'));

    const designResponse = await axios.post(`${API_BASE}/designs`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${vendorToken}`
      }
    });
    
    designId = designResponse.data.data.id;
    const designImageUrl = designResponse.data.data.imageUrl;
    console.log(`✅ Design créé: ID ${designId}`);
    console.log(`   URL: ${designImageUrl}`);

    // 3. Créer un produit avec ce design
    console.log('\n3. 📦 Création produit...');
    
    const productData = {
      vendorName: 'Produit Test Cascade',
      vendorDescription: 'Test cascade validation',
      vendorPrice: 3000,
      vendorStock: 10,
      selectedSizes: ['M', 'L'],
      selectedColors: ['Rouge'],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-Shirt Base',
          description: 'T-Shirt de base admin',
          price: 1500,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Rouge',
                colorCode: '#FF0000',
                images: [{ 
                  id: 1, 
                  url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
                  view: 'Front'
                }]
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
      postValidationAction: 'AUTO_PUBLISH'
    };

    const productResponse = await axios.post(`${API_BASE}/vendor/publish`, productData, {
      headers: { 
        'Authorization': `Bearer ${vendorToken}`,
        'Content-Type': 'application/json'
      }
    });

    productId = productResponse.data.productId;
    console.log(`✅ Produit créé: ID ${productId}`);

    // 4. Vérifier l'état initial
    console.log('\n4. 🔍 Vérification état initial...');
    
    const initialCheck = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const initialProduct = initialCheck.data.products.find(p => p.id === productId);
    console.log('📋 État initial du produit:');
    console.log(`   - ID: ${initialProduct.id}`);
    console.log(`   - Status: ${initialProduct.status}`);
    console.log(`   - isValidated: ${initialProduct.isValidated}`);
    console.log(`   - postValidationAction: ${initialProduct.postValidationAction}`);
    console.log(`   - designCloudinaryUrl: ${initialProduct.designCloudinaryUrl ? 'Présent' : 'Absent'}`);

    // 5. Soumettre le design pour validation
    console.log('\n5. 📤 Soumission design pour validation...');
    
    try {
      await axios.post(`${API_BASE}/designs/${designId}/submit`, {}, {
        headers: { 'Authorization': `Bearer ${vendorToken}` }
      });
      console.log('✅ Design soumis pour validation');
    } catch (error) {
      console.log('⚠️ Design déjà soumis ou erreur:', error.response?.data?.message);
    }

    // 6. VALIDATION DU DESIGN (CASCADE)
    console.log('\n6. ✅ VALIDATION DESIGN - DÉCLENCHEMENT CASCADE...');
    
    const validationResponse = await axios.put(`${API_BASE}/designs/${designId}/validate`, {
      action: 'VALIDATE'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('🎯 Design validé par admin');
    console.log('⏳ Attente cascade validation...');
    
    // Attendre la cascade
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 7. Vérifier le résultat
    console.log('\n7. 🔍 VÉRIFICATION RÉSULTAT CASCADE...');
    
    const finalCheck = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const finalProduct = finalCheck.data.products.find(p => p.id === productId);
    
    console.log('📊 RÉSULTAT FINAL:');
    console.log('='.repeat(30));
    console.log(`📦 Produit ${productId}:`);
    console.log(`   - Status AVANT: ${initialProduct.status}`);
    console.log(`   - Status APRÈS: ${finalProduct.status}`);
    console.log(`   - isValidated AVANT: ${initialProduct.isValidated}`);
    console.log(`   - isValidated APRÈS: ${finalProduct.isValidated}`);
    console.log(`   - validatedAt: ${finalProduct.validatedAt ? 'Défini' : 'Non défini'}`);
    console.log(`   - validatedBy: ${finalProduct.validatedBy || 'Non défini'}`);

    // 8. Évaluation du succès
    console.log('\n8. 🎯 ÉVALUATION...');
    
    const cascadeSuccess = (
      initialProduct.status === 'PENDING' &&
      finalProduct.status === 'PUBLISHED' &&
      finalProduct.isValidated === true &&
      finalProduct.validatedAt !== null
    );
    
    if (cascadeSuccess) {
      console.log('🎉 ✅ CASCADE VALIDATION RÉUSSIE !');
      console.log('✅ Le produit a été publié automatiquement');
      console.log('✅ Tous les champs sont correctement mis à jour');
    } else {
      console.log('❌ CASCADE VALIDATION ÉCHOUÉE !');
      console.log('🔍 PROBLÈMES DÉTECTÉS:');
      
      if (finalProduct.status !== 'PUBLISHED') {
        console.log(`   ❌ Status incorrect: ${finalProduct.status} (attendu: PUBLISHED)`);
      }
      
      if (finalProduct.isValidated !== true) {
        console.log(`   ❌ isValidated incorrect: ${finalProduct.isValidated} (attendu: true)`);
      }
      
      if (!finalProduct.validatedAt) {
        console.log(`   ❌ validatedAt manquant`);
      }

      console.log('\n🔧 VÉRIFICATIONS RECOMMANDÉES:');
      console.log('1. Vérifier les logs backend pour les erreurs de cascade');
      console.log('2. Vérifier que designCloudinaryUrl correspond entre Design et VendorProduct');
      console.log('3. Vérifier que la méthode applyValidationActionToProducts est appelée');
      console.log('4. Vérifier la transaction de mise à jour en base');
    }

    // Nettoyer
    try {
      fs.unlinkSync('./test-design.png');
    } catch (e) {
      // Ignorer
    }

  } catch (error) {
    console.error('❌ ERREUR LORS DU TEST:', error.response?.data || error.message);
    
    // Nettoyer en cas d'erreur
    try {
      fs.unlinkSync('./test-design.png');
    } catch (e) {
      // Ignorer
    }
  }
}

// Exécuter le test
testCascadeValidation().catch(console.error); 
 