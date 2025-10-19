#!/usr/bin/env node

// 🧪 Test de création de produit avec images
// Ce script simule la requête frontend corrigée

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Données de test
const productData = {
  name: "Produit Test avec Images",
  description: "Description du produit de test avec gestion des images",
  price: 15000,
  suggestedPrice: 20000,
  stock: 50,
  status: "published",
  categoryId: 40,
  subCategoryId: 45,
  variationId: 71,
  sizes: ["S", "M", "L"],
  genre: "UNISEXE",
  isReadyProduct: false,
  colorVariations: [
    {
      name: "Bleu",
      colorCode: "#0066cc",
      price: 15000,
      stock: 25,
      images: [
        {
          fileId: 1,
          viewType: "FRONT"
        }
      ]
    }
  ]
};

async function testProductCreation() {
  try {
    console.log('🧪 [TEST] Création de produit avec images...');

    // Créer une image de test si elle n'existe pas
    const testImagePath = './test-image.jpg';

    if (!fs.existsSync(testImagePath)) {
      console.log('📷 Création d\'une image de test...');
      // Créer une simple image placeholder (en pratique, utilisez une vraie image)
      const placeholderImage = Buffer.from('fake-image-data-for-testing');
      fs.writeFileSync(testImagePath, placeholderImage);
    }

    // Préparer FormData
    const formData = new FormData();

    // Ajouter les données produit en JSON string
    formData.append('productData', JSON.stringify(productData));
    console.log('📦 productData ajouté:', JSON.stringify(productData, null, 2));

    // Ajouter le fichier image
    const imageBuffer = fs.readFileSync(testImagePath);
    formData.append('file_1', imageBuffer, {
      filename: 'test-product-image.jpg',
      contentType: 'image/jpeg'
    });
    console.log('📷 file_1 ajouté: test-product-image.jpg');

    // Afficher le contenu FormData pour debug
    console.log('🔍 [DEBUG] Contenu FormData:');
    const formDataEntries = Array.from(formData.entries());
    formDataEntries.forEach(([key, value]) => {
      if (key === 'productData') {
        console.log(`  ${key}:`, value);
      } else {
        console.log(`  ${key}:`, value.name || value);
      }
    });

    // Appel API
    console.log('🚀 Envoi de la requête à l\'API...');
    const response = await fetch('https://printalma-back-dep.onrender.com/products', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log(`📡 Status de la réponse: ${response.status}`);

    const responseData = await response.text();
    console.log('📄 Réponse brute:', responseData);

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log('✅ Produit créé avec succès!');
        console.log('📋 Détails:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('✅ Réponse reçue (non-JSON):', responseData);
      }
    } else {
      console.log('❌ Erreur lors de la création');
      try {
        const errorResponse = JSON.parse(responseData);
        console.log('🚨 Détails de l\'erreur:', errorResponse);
      } catch (e) {
        console.log('🚨 Message d\'erreur:', responseData);
      }
    }

    // Nettoyer l'image de test
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Image de test supprimée');
    }

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter le test
testProductCreation();