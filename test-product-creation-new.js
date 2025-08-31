const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3004/api';

// Création d'une image de test simple
function createTestImage(color = '#FF0000', name = 'test.png') {
  // Cette fonction simule la création d'un fichier image
  // En pratique, vous utiliseriez de vraies images
  const buffer = Buffer.from(`Test image data for ${name} with color ${color}`);
  return {
    buffer,
    name,
    mimetype: 'image/png'
  };
}

async function testProductCreation() {
  try {
    console.log('🧪 Test de création de produit selon le nouveau guide...\n');

    // Données du produit selon le guide
    const productData = {
      name: "T-Shirt Premium en Coton Bio",
      price: 8500,
      stock: 150,
      status: "published",
      description: "Un t-shirt doux et résistant, parfait pour toutes les occasions. Fabriqué en coton bio certifié.",
      categories: ["T-shirts", "Vêtements éco-responsables"],
      sizes: ["S", "M", "L", "XL"],
      colorVariations: [
        {
          name: "Blanc Éclatant",
          colorCode: "#FFFFFF",
          images: [
            {
              fileId: "1678886400001",
              view: "Front",
              delimitations: [
                {
                  x: 250,
                  y: 150,
                  width: 300,
                  height: 400,
                  rotation: 0
                }
              ]
            },
            {
              fileId: "1678886400002", 
              view: "Back",
              delimitations: [
                {
                  x: 280,
                  y: 200,
                  width: 240,
                  height: 300,
                  rotation: 0
                }
              ]
            }
          ]
        },
        {
          name: "Noir Profond",
          colorCode: "#000000",
          images: [
            {
              fileId: "1678886400003",
              view: "Front", 
              delimitations: [
                {
                  x: 255,
                  y: 152,
                  width: 298,
                  height: 405,
                  rotation: 0
                }
              ]
            }
          ]
        }
      ]
    };

    // Créer le FormData
    const formData = new FormData();
    
    // Ajouter les données JSON
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter les fichiers de test
    const image1 = createTestImage('#FFFFFF', 'tshirt-blanc-face.png');
    const image2 = createTestImage('#FFFFFF', 'tshirt-blanc-dos.png');
    const image3 = createTestImage('#000000', 'tshirt-noir-face.png');
    
    formData.append('file_1678886400001', image1.buffer, {
      filename: image1.name,
      contentType: image1.mimetype
    });
    
    formData.append('file_1678886400002', image2.buffer, {
      filename: image2.name,
      contentType: image2.mimetype
    });
    
    formData.append('file_1678886400003', image3.buffer, {
      filename: image3.name,
      contentType: image3.mimetype
    });

    console.log('📦 Envoi de la requête POST /api/products...');
    
    // Envoyer la requête
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    console.log(`📡 Statut de la réponse: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Produit créé avec succès!');
    console.log('📋 Détails du produit:');
    console.log(`- ID: ${result.id}`);
    console.log(`- Nom: ${result.name}`);
    console.log(`- Prix: ${result.price} FCFA`);
    console.log(`- Stock: ${result.stock}`);
    console.log(`- Statut: ${result.status}`);
    console.log(`- Catégories: ${result.categories.map(c => c.name).join(', ')}`);
    console.log(`- Tailles: ${result.sizes.map(s => s.sizeName).join(', ')}`);
    console.log(`- Variations de couleur: ${result.colorVariations.length}`);
    
    result.colorVariations.forEach((variation, index) => {
      console.log(`  ${index + 1}. ${variation.name} (${variation.colorCode})`);
      console.log(`     Images: ${variation.images.length}`);
      variation.images.forEach((image, imgIndex) => {
        console.log(`       - ${image.view}: ${image.delimitations.length} zone(s) de personnalisation`);
      });
    });

    // Test de récupération
    console.log('\n🔍 Test de récupération du produit...');
    const getResponse = await fetch(`${API_BASE_URL}/products/${result.id}`, {
      credentials: 'include'
    });
    
    if (getResponse.ok) {
      const retrievedProduct = await getResponse.json();
      console.log('✅ Produit récupéré avec succès!');
      console.log(`📋 Nom: ${retrievedProduct.name}`);
    } else {
      console.error('❌ Erreur lors de la récupération');
    }

    // Test de récupération de tous les produits
    console.log('\n📋 Test de récupération de tous les produits...');
    const getAllResponse = await fetch(`${API_BASE_URL}/products`, {
      credentials: 'include'
    });
    
    if (getAllResponse.ok) {
      const allProducts = await getAllResponse.json();
      console.log(`✅ ${allProducts.length} produit(s) récupéré(s)`);
    } else {
      console.error('❌ Erreur lors de la récupération de tous les produits');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Test de validation des données
async function testValidation() {
  console.log('\n🧪 Test de validation des données...\n');

  // Test avec des données invalides
  const invalidData = {
    name: "A", // Trop court
    price: -100, // Prix négatif
    stock: -5, // Stock négatif
    status: "invalid", // Statut invalide
    description: "Court", // Description trop courte
    categories: [], // Aucune catégorie
    colorVariations: [] // Aucune variation
  };

  const formData = new FormData();
    formData.append('productData', JSON.stringify(invalidData));

  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('✅ Validation fonctionne correctement!');
      console.log('📋 Erreurs détectées:');
      if (error.message && Array.isArray(error.message)) {
        error.message.forEach(err => console.log(`- ${err}`));
      } else {
        console.log(`- ${error.message || 'Erreur de validation'}`);
      }
    } else {
      console.log('❌ La validation devrait échouer avec ces données invalides');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de validation:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'API produits\n');
  
  await testProductCreation();
  await testValidation();
  
  console.log('\n✅ Tests terminés!');
}

runTests().catch(console.error); 