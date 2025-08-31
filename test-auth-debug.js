const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function debugAuth() {
  console.log('🔍 Debug authentification...\n');

  try {
    console.log('1. Test de connexion...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Réponse reçue:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('   Headers:', response.headers);
    
    if (response.headers['set-cookie']) {
      console.log('   Cookies:', response.headers['set-cookie']);
    }

    console.log('\n2. Test accès endpoint protégé avec cookies...');
    try {
      const protectedResponse = await axios.get(`${API_BASE}/vendor/products`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': response.headers['set-cookie'] ? response.headers['set-cookie'].join('; ') : ''
        }
      });
      
      console.log('✅ Accès avec cookies réussi:', protectedResponse.status);
      console.log('   Produits:', protectedResponse.data.data?.products?.length || 0);
      
    } catch (error) {
      console.log('❌ Erreur accès avec cookies:', error.response?.status, error.response?.data);
    }

    console.log('\n3. Test avec bypassValidation...');
    const productData = {
      baseProductId: 1,
      designId: 8,
      vendorName: 'Test Produit Bypass',
      vendorDescription: 'Test bypass validation',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [{ id: 1, name: 'Blanc', colorCode: '#FFFFFF' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton',
          price: 19000,
          images: { colorVariations: [] },
          sizes: [{ id: 1, sizeName: 'M' }]
        },
        designApplication: { positioning: 'CENTER', scale: 0.6 }
      },
      bypassValidation: true
    };

    try {
      const createResponse = await axios.post(`${API_BASE}/vendor/products`, productData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': response.headers['set-cookie'] ? response.headers['set-cookie'].join('; ') : ''
        }
      });
      
      console.log('✅ Création produit avec bypass réussie:', createResponse.status);
      console.log('   Produit ID:', createResponse.data.productId);
      
    } catch (error) {
      console.log('❌ Erreur création produit:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Erreur connexion:', error.response?.data || error.message);
  }
}

debugAuth().catch(console.error); 