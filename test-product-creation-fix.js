// Test de création de produit avec le format EXACT requis par le backend
// Script de test pour résoudre l'erreur 500

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');

// Désactiver la vérification SSL pour localhost
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE = 'https://localhost:3004';

// Fonction utilitaire pour faire une requête HTTPS
function makeRequest(url, options, formData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (formData) {
      formData.pipe(req);
    } else {
      req.end();
    }
  });
}

async function testProductCreation() {
  try {
    console.log('🧪 Test de création de produit - Format EXACT');
    console.log('=====================================\n');

    // 1. Données du produit au format EXACT attendu par le backend
    const productData = {
      name: "T-shirt Test API Fix",
      description: "T-shirt de test pour corriger l'erreur 500 de création de produits",
      price: 29.99,
      stock: 100,
      status: "draft",
      categories: ["T-shirts"],  // CRUCIAL: Array de strings, pas undefined
      sizes: ["S", "M", "L", "XL"],
      colorVariations: [         // CRUCIAL: Au moins 1 variation requise
        {
          name: "Rouge Foncé",
          colorCode: "#CC0000",  // CRUCIAL: Format #RRGGBB exact
          images: [              // CRUCIAL: Au moins 1 image par couleur
            {
              fileId: "test_image_front",  // CRUCIAL: doit correspondre au nom du fichier
              view: "Front",               // CRUCIAL: une des valeurs autorisées
              delimitations: [             // Optionnel mais bien structuré
                {
                  x: 30.0,
                  y: 40.0,
                  width: 40.0,
                  height: 25.0,
                  rotation: 0,
                  name: "Zone Logo Test",
                  coordinateType: "PERCENTAGE"
                }
              ]
            }
          ]
        }
      ]
    };

    console.log('📊 Structure des données:');
    console.log('- Nom:', productData.name);
    console.log('- Prix:', productData.price);
    console.log('- Catégories:', productData.categories);
    console.log('- Variations couleur:', productData.colorVariations.length);
    console.log('- Images par couleur:', productData.colorVariations[0].images.length);
    console.log('');

    // 2. Créer un fichier image de test (pixel rouge 1x1)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x2D, 0xCB, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // 3. Créer FormData avec le format EXACT
    const form = new FormData();
    
    // CRUCIAL: productData doit être un STRING JSON, pas un objet
    form.append('productData', JSON.stringify(productData));
    
    // CRUCIAL: Le nom du fichier doit être "file_" + fileId
    form.append('file_test_image_front', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('🚀 Envoi de la requête de création...');
    console.log('URL:', `${API_BASE}/products`);
    console.log('Champs FormData:');
    console.log('- productData: [JSON String]');
    console.log('- file_test_image_front: [PNG Buffer]');
    console.log('');

    // 4. Envoyer la requête
    const response = await makeRequest(`${API_BASE}/products`, {
      method: 'POST',
      headers: form.getHeaders()
    }, form);

    // 5. Analyser la réponse
    console.log('📥 Réponse du serveur:');
    console.log('Status:', response.status);
    
    if (response.status === 201) {
      console.log('✅ SUCCÈS - Produit créé!');
      console.log('ID produit:', response.data.data?.id);
      console.log('Nom:', response.data.data?.name);
      console.log('Categories:', response.data.data?.categories?.map(c => c.name));
      console.log('Couleurs:', response.data.data?.colorVariations?.map(c => c.name));
      
      return {
        success: true,
        productId: response.data.data?.id,
        message: 'Produit créé avec succès'
      };
    } else {
      console.log('❌ ÉCHEC - Erreur:', response.status);
      console.log('Message:', response.data.message || 'Pas de message');
      console.log('Détails:', JSON.stringify(response.data, null, 2));
      
      return {
        success: false,
        error: response.data,
        message: `Erreur ${response.status}: ${response.data.message || 'Erreur inconnue'}`
      };
    }

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Erreur de connexion ou d\'exécution'
    };
  }
}

// Test de récupération des produits (pour validation)
async function testGetProducts() {
  try {
    console.log('\n🔍 Test de récupération des produits...');
    
    const response = await makeRequest(`${API_BASE}/products`, {
      method: 'GET'
    });

    console.log('Status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Récupération réussie');
      console.log('Nombre de produits:', response.data.data?.length || 0);
      
      if (response.data.data?.length > 0) {
        const lastProduct = response.data.data[0];
        console.log('Dernier produit:', lastProduct.name);
        console.log('ID:', lastProduct.id);
      }
    } else {
      console.log('❌ Erreur récupération:', response.data);
    }

  } catch (error) {
    console.error('❌ Erreur GET products:', error.message);
  }
}

// Exécution des tests
async function runTests() {
  console.log('🎯 TESTS DE CRÉATION DE PRODUITS');
  console.log('Objectif: Résoudre l\'erreur 500 "Cannot read properties of undefined (reading \'map\')"');
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Création
  const createResult = await testProductCreation();
  
  if (createResult.success) {
    console.log('\n🎉 RÉSOLUTION CONFIRMÉE!');
    console.log('Le format correct a été identifié et testé avec succès.');
    
    // Test 2: Validation en récupérant la liste
    await testGetProducts();
    
    console.log('\n📋 RÉSUMÉ DE LA SOLUTION:');
    console.log('1. productData doit être un STRING JSON (pas un objet)');
    console.log('2. Les fichiers doivent être nommés "file_" + fileId');
    console.log('3. categories doit être un array de strings (jamais undefined)');
    console.log('4. colorVariations doit avoir au moins 1 élément');
    console.log('5. Chaque colorVariation doit avoir au moins 1 image');
    console.log('6. colorCode doit être au format #RRGGBB');
    
  } else {
    console.log('\n❌ PROBLÈME PERSISTANT');
    console.log('Message:', createResult.message);
    console.log('');
    console.log('🔧 ACTIONS SUGGÉRÉES:');
    console.log('1. Vérifier que le serveur est démarré sur le port 3004');
    console.log('2. Vérifier les logs du serveur pour plus de détails');
    console.log('3. Confirmer que la structure du DTO est correcte');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('Fin des tests');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testProductCreation, testGetProducts, runTests }; 