const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function debugCascadeValidation() {
  console.log('🔍 DEBUG - ANALYSE CASCADE VALIDATION');
  console.log('='.repeat(60));

  try {
    // 1. Setup utilisateurs
    console.log('\n1. 👥 Setup utilisateurs...');
    let adminToken, adminId, vendorToken, vendorId;

    // Admin
    try {
      const adminResponse = await axios.post(`${API_BASE}/auth/register`, {
        firstName: 'Admin',
        lastName: 'Debug',
        email: 'admin.debug@test.com',
        password: 'password123',
        role: 'ADMIN'
      });
      adminToken = adminResponse.data.token;
      adminId = adminResponse.data.user.id;
      console.log(`✅ Admin créé: ID ${adminId}`);
    } catch (error) {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin.debug@test.com',
        password: 'password123'
      });
      adminToken = loginResponse.data.token;
      adminId = loginResponse.data.user.id;
      console.log(`✅ Admin connecté: ID ${adminId}`);
    }

    // Vendeur
    try {
      const vendorResponse = await axios.post(`${API_BASE}/auth/register`, {
        firstName: 'Vendeur',
        lastName: 'Debug',
        email: 'vendeur.debug@test.com',
        password: 'password123',
        role: 'VENDOR'
      });
      vendorToken = vendorResponse.data.token;
      vendorId = vendorResponse.data.user.id;
      console.log(`✅ Vendeur créé: ID ${vendorId}`);
    } catch (error) {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'vendeur.debug@test.com',
        password: 'password123'
      });
      vendorToken = loginResponse.data.token;
      vendorId = loginResponse.data.user.id;
      console.log(`✅ Vendeur connecté: ID ${vendorId}`);
    }

    // 2. Créer un design
    console.log('\n2. 🎨 Création design...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('name', 'Design Debug Cascade');
    form.append('description', 'Test debug cascade validation');
    form.append('price', '4000');
    form.append('category', 'LOGO');
    form.append('tags', 'debug,cascade,test');
    
    const imageBuffer = Buffer.from('fake-image-data-debug-cascade');
    fs.writeFileSync('./temp-design-debug.jpg', imageBuffer);
    form.append('image', fs.createReadStream('./temp-design-debug.jpg'));

    const designResponse = await axios.post(`${API_BASE}/designs`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${vendorToken}`
      }
    });
    
    const designId = designResponse.data.data.id;
    const designImageUrl = designResponse.data.data.imageUrl;
    console.log(`✅ Design créé:`);
    console.log(`   - ID: ${designId}`);
    console.log(`   - Image URL: ${designImageUrl}`);

    // 3. Créer un produit avec ce design
    console.log('\n3. 📦 Création produit...');
    
    const productResponse = await axios.post(`${API_BASE}/vendor/publish`, {
      vendorName: 'Produit Debug Cascade',
      vendorDescription: 'Test debug cascade validation',
      vendorPrice: 3000,
      vendorStock: 5,
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
      designCloudinaryUrl: designImageUrl, // ✅ IMPORTANT: Lien avec le design
      postValidationAction: 'AUTO_PUBLISH'
    }, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });

    const productId = productResponse.data.productId;
    console.log(`✅ Produit créé: ID ${productId}`);

    // 4. DIAGNOSTIC: Vérifier les données en base
    console.log('\n4. 🔍 DIAGNOSTIC - Vérification données...');
    
    const productsCheck = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const createdProduct = productsCheck.data.products.find(p => p.id === productId);
    
    console.log(`📋 Produit créé - État initial:`);
    console.log(`   - ID: ${createdProduct?.id}`);
    console.log(`   - Status: ${createdProduct?.status}`);
    console.log(`   - isValidated: ${createdProduct?.isValidated}`);
    console.log(`   - postValidationAction: ${createdProduct?.postValidationAction}`);
    console.log(`   - designCloudinaryUrl: ${createdProduct?.designCloudinaryUrl}`);
    console.log(`   - vendorId: ${createdProduct?.vendorId}`);

    // 5. Vérifier correspondance avec design
    console.log('\n5. 🔗 DIAGNOSTIC - Vérification correspondance Design ↔ Produit...');
    console.log(`   Design imageUrl: ${designImageUrl}`);
    console.log(`   Produit designCloudinaryUrl: ${createdProduct?.designCloudinaryUrl}`);
    console.log(`   Correspondance: ${designImageUrl === createdProduct?.designCloudinaryUrl ? '✅ OUI' : '❌ NON'}`);
    console.log(`   VendorId design: ${vendorId}`);
    console.log(`   VendorId produit: ${createdProduct?.vendorId}`);
    console.log(`   Même vendeur: ${vendorId === createdProduct?.vendorId ? '✅ OUI' : '❌ NON'}`);

    // 6. Soumettre design pour validation
    console.log('\n6. 📤 Soumission design pour validation...');
    await axios.post(`${API_BASE}/designs/${designId}/submit`, {}, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    console.log('✅ Design soumis');

    // 7. VALIDATION DESIGN - TEST CASCADE
    console.log('\n7. ✅ VALIDATION DESIGN - TEST CASCADE...');
    
    console.log('🎯 AVANT validation - État du produit:');
    const beforeValidation = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    const productBefore = beforeValidation.data.products.find(p => p.id === productId);
    console.log(`   - Status: ${productBefore?.status}`);
    console.log(`   - isValidated: ${productBefore?.isValidated}`);
    
    // Validation du design
    const validationResponse = await axios.put(`${API_BASE}/designs/${designId}/validate`, {
      action: 'VALIDATE'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('🎯 DESIGN VALIDÉ - Vérification cascade...');

    // Attendre un peu pour la cascade
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 8. Vérifier résultat cascade
    console.log('\n8. 🔍 VÉRIFICATION RÉSULTAT CASCADE...');
    
    const afterValidation = await axios.get(`${API_BASE}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${vendorToken}` }
    });
    
    const productAfter = afterValidation.data.products.find(p => p.id === productId);
    
    console.log('📊 RÉSULTATS APRÈS VALIDATION DESIGN:');
    console.log('='.repeat(50));
    console.log(`📦 Produit ${productId}:`);
    console.log(`   - Status AVANT: ${productBefore?.status}`);
    console.log(`   - Status APRÈS: ${productAfter?.status}`);
    console.log(`   - isValidated AVANT: ${productBefore?.isValidated}`);
    console.log(`   - isValidated APRÈS: ${productAfter?.isValidated}`);
    console.log(`   - postValidationAction: ${productAfter?.postValidationAction}`);
    console.log(`   - validatedAt: ${productAfter?.validatedAt}`);

    // 9. Diagnostic final
    console.log('\n9. 🎯 DIAGNOSTIC FINAL...');
    
    const cascadeSuccess = (
      productBefore?.status === 'PENDING' &&
      productAfter?.status === 'PUBLISHED' &&
      productAfter?.isValidated === true
    );
    
    if (cascadeSuccess) {
      console.log('🎉 CASCADE VALIDATION RÉUSSIE !');
      console.log('✅ Le produit a été publié automatiquement');
      console.log('✅ Le champ isValidated est à true');
    } else {
      console.log('❌ CASCADE VALIDATION ÉCHOUÉE !');
      console.log('🔍 PROBLÈMES DÉTECTÉS:');
      
      if (productBefore?.status !== 'PENDING') {
        console.log(`   ❌ Statut initial incorrect: ${productBefore?.status} (attendu: PENDING)`);
      }
      
      if (productAfter?.status !== 'PUBLISHED') {
        console.log(`   ❌ Statut final incorrect: ${productAfter?.status} (attendu: PUBLISHED)`);
      }
      
      if (productAfter?.isValidated !== true) {
        console.log(`   ❌ isValidated incorrect: ${productAfter?.isValidated} (attendu: true)`);
      }
      
      console.log('\n🔧 SOLUTIONS POSSIBLES:');
      console.log('1. Vérifier que designCloudinaryUrl correspond entre Design et VendorProduct');
      console.log('2. Vérifier que la méthode applyValidationActionToProducts est appelée');
      console.log('3. Vérifier les logs backend pour les erreurs');
      console.log('4. Vérifier que le vendorId correspond');
    }

    // Nettoyer
    fs.unlinkSync('./temp-design-debug.jpg');
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.response?.data || error.message);
    
    // Nettoyer en cas d'erreur
    try {
      fs.unlinkSync('./temp-design-debug.jpg');
    } catch (e) {
      // Ignorer
    }
  }
}

// Exécuter le debug
debugCascadeValidation().catch(console.error); 
 