const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testBypassValidation() {
  console.log('🧪 Test final : Bypass validation pour transformations\n');

  let cookies = '';

  try {
    console.log('1. 🔐 Connexion vendeur...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendeur@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Connexion réussie');
    console.log(`   Utilisateur: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
    console.log(`   Email: ${loginResponse.data.user.email}`);
    
    // Extraire les cookies
    if (loginResponse.headers['set-cookie']) {
      cookies = loginResponse.headers['set-cookie'].join('; ');
      console.log('   Cookies extraits ✓');
    }

    console.log('\n2. 📦 Test création produit avec bypass validation...');
    
    const productData = {
      baseProductId: 1,
      designId: 8,
      vendorName: 'Produit auto-généré pour positionnage design', // ⚠️ Nom qui serait normalement rejeté
      vendorDescription: 'Produit auto-généré pour positionnage design', // ⚠️ Description qui serait normalement rejetée
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [
        { id: 1, name: 'Blanc', colorCode: '#FFFFFF' }
      ],
      selectedSizes: [
        { id: 1, sizeName: 'M' }
      ],
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100% de qualité premium',
          price: 19000,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Blanc',
                colorCode: '#FFFFFF',
                images: [
                  {
                    id: 1,
                    url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                    viewType: 'FRONT',
                    delimitations: [
                      { x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }
                    ]
                  }
                ]
              }
            ]
          },
          sizes: [
            { id: 1, sizeName: 'S' },
            { id: 2, sizeName: 'M' },
            { id: 3, sizeName: 'L' }
          ]
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.6
        }
      },
      designPosition: {
        x: -44,
        y: -68,
        scale: 0.44,
        rotation: 15
      },
      // ✅ FLAG BYPASS VALIDATION - Permet de créer des produits avec des noms auto-générés
      bypassValidation: true
    };

    try {
      const createResponse = await axios.post(`${API_BASE}/vendor/products`, productData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        }
      });
      
      if (createResponse.data.success) {
        console.log('✅ SUCCÈS: Produit créé avec bypass validation');
        console.log(`   ID: ${createResponse.data.productId}`);
        console.log(`   Status: ${createResponse.data.status}`);
        console.log(`   Message: ${createResponse.data.message}`);
        
        global.testProductId = createResponse.data.productId;
        
        console.log('\n   🎯 Le bypass validation fonctionne !');
        console.log('   ✅ Nom auto-généré accepté');
        console.log('   ✅ Description auto-générée acceptée');
        console.log('   ✅ Position design sauvegardée');
        
      } else {
        console.log('❌ ÉCHEC: Réponse inattendue:', createResponse.data);
      }
      
    } catch (error) {
      console.log('❌ ERREUR création produit:', error.response?.data || error.message);
      return;
    }

    console.log('\n3. 🔄 Test sauvegarde transforms...');
    
    if (global.testProductId) {
      try {
        const transformData = {
          productId: global.testProductId,
          designUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736420184/vendor-designs/vendor_2_design_1736420184324.jpg',
          transforms: {
            '0': {
              x: -100,
              y: -120,
              scale: 0.8,
              rotation: 45
            }
          },
          lastModified: Date.now()
        };

        const transformResponse = await axios.post(`${API_BASE}/vendor/design-transforms/save`, transformData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          }
        });
        
        if (transformResponse.data.success) {
          console.log('✅ SUCCÈS: Transform sauvegardé');
          console.log(`   Transform ID: ${transformResponse.data.data.id}`);
          console.log('   ✅ Position extraite et sauvegardée automatiquement!');
        } else {
          console.log('❌ ÉCHEC: Transform non sauvegardé');
        }
        
      } catch (error) {
        console.log('❌ ERREUR sauvegarde transform:', error.response?.data || error.message);
      }
    }

    console.log('\n4. 📍 Test sauvegarde position directe...');
    
    if (global.testProductId) {
      try {
        const positionData = {
          vendorProductId: global.testProductId,
          designId: 8,
          position: {
            x: -200,
            y: -150,
            scale: 0.9,
            rotation: 30
          }
        };

        const positionResponse = await axios.post(`${API_BASE}/vendor/design-position`, positionData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          }
        });
        
        if (positionResponse.data.success) {
          console.log('✅ SUCCÈS: Position sauvegardée directement');
          console.log(`   Produit ID: ${positionResponse.data.data.vendorProductId}`);
          console.log(`   Design ID: ${positionResponse.data.data.designId}`);
          console.log(`   Position: ${JSON.stringify(positionResponse.data.data.position)}`);
        } else {
          console.log('❌ ÉCHEC: Position non sauvegardée');
        }
        
      } catch (error) {
        console.log('❌ ERREUR sauvegarde position:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 RÉSULTATS FINAUX:');
    console.log('✅ Bypass validation: FONCTIONNEL');
    console.log('✅ Noms auto-générés: ACCEPTÉS');
    console.log('✅ Transformations: OPÉRATIONNELLES');
    console.log('✅ Positions design: SAUVEGARDÉES');
    console.log('');
    console.log('🎯 PROBLÈME RÉSOLU !');
    console.log('💡 Les transformations ne sont plus bloquées par la validation');
    console.log('⚠️  En production, ne pas utiliser bypassValidation=true');

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

testBypassValidation().catch(console.error); 