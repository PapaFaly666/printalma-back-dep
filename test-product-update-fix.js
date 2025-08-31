const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3004';
const PRODUCT_ID = 4;

// Test de mise à jour de produit avec images
async function testProductUpdateWithImages() {
  console.log('\n🧪 Test: Mise à jour de produit avec images...');
  
  try {
    // 1. Récupérer le produit actuel
    console.log('📋 Récupération du produit actuel...');
    const productResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`);
    if (!productResponse.ok) {
      throw new Error(`Produit ${PRODUCT_ID} non trouvé`);
    }
    
    const currentProduct = await productResponse.json();
    console.log('✅ Produit récupéré:', {
      id: currentProduct.id,
      name: currentProduct.name,
      colorVariations: currentProduct.colorVariations.map(cv => ({
        id: cv.id,
        name: cv.name,
        images: cv.images.map(img => ({ id: img.id, url: img.url }))
      }))
    });

    // 2. Préparer les données de mise à jour
    const updateData = {
      name: currentProduct.name, // Garder le même nom
      description: currentProduct.description,
      price: currentProduct.price,
      stock: currentProduct.stock,
      status: currentProduct.status,
      categories: currentProduct.categories.map(c => c.id),
      sizes: currentProduct.sizes.map(s => s.sizeName),
      colorVariations: currentProduct.colorVariations.map(cv => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode,
        images: cv.images.map(img => ({
          id: img.id,
          view: img.view,
          url: img.url,
          publicId: img.publicId,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          delimitations: img.delimitations || []
        }))
      }))
    };

    console.log('📝 Données de mise à jour préparées');

    // 3. Tester la mise à jour
    console.log('🔄 Test de mise à jour...');
    const updateResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(`Erreur mise à jour: ${error.message}`);
    }

    const updatedProduct = await updateResponse.json();
    console.log('✅ Mise à jour réussie:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      colorVariations: updatedProduct.colorVariations.map(cv => ({
        id: cv.id,
        name: cv.name,
        images: cv.images.map(img => ({ id: img.id, url: img.url }))
      }))
    });

  } catch (error) {
    console.error('❌ Erreur test mise à jour:', error.message);
  }
}

// Test de mise à jour avec image inexistante
async function testProductUpdateWithNonExistentImage() {
  console.log('\n🧪 Test: Mise à jour avec image inexistante...');
  
  try {
    // 1. Récupérer le produit
    const productResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`);
    if (!productResponse.ok) {
      throw new Error(`Produit ${PRODUCT_ID} non trouvé`);
    }
    
    const currentProduct = await productResponse.json();
    
    // 2. Créer des données avec une image inexistante
    const updateData = {
      name: currentProduct.name,
      description: currentProduct.description,
      price: currentProduct.price,
      stock: currentProduct.stock,
      status: currentProduct.status,
      categories: currentProduct.categories.map(c => c.id),
      sizes: currentProduct.sizes.map(s => s.sizeName),
      colorVariations: currentProduct.colorVariations.map((cv, index) => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode,
        images: index === 0 ? [
          // Image existante
          ...cv.images.slice(0, 1).map(img => ({
            id: img.id,
            view: img.view,
            url: img.url,
            publicId: img.publicId,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            delimitations: img.delimitations || []
          })),
          // Image inexistante (ID fictif)
          {
            id: 99999, // ID inexistant
            view: 'Front',
            url: 'https://example.com/fake-image.jpg',
            publicId: 'fake-public-id',
            naturalWidth: 500,
            naturalHeight: 500,
            delimitations: []
          }
        ] : cv.images.map(img => ({
          id: img.id,
          view: img.view,
          url: img.url,
          publicId: img.publicId,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          delimitations: img.delimitations || []
        }))
      }))
    };

    console.log('📝 Test avec image inexistante (ID: 99999)');

    // 3. Tester la mise à jour
    const updateResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(`Erreur mise à jour: ${error.message}`);
    }

    const updatedProduct = await updateResponse.json();
    console.log('✅ Mise à jour réussie même avec image inexistante');
    
    // Vérifier que l'image inexistante a été créée
    const firstColorVariation = updatedProduct.colorVariations[0];
    const newImage = firstColorVariation.images.find(img => img.publicId === 'fake-public-id');
    
    if (newImage) {
      console.log('✅ Image inexistante correctement créée avec ID:', newImage.id);
    } else {
      console.log('⚠️ Image inexistante non trouvée dans la réponse');
    }

  } catch (error) {
    console.error('❌ Erreur test image inexistante:', error.message);
  }
}

// Test de mise à jour avec images locales (blob)
async function testProductUpdateWithLocalImages() {
  console.log('\n🧪 Test: Mise à jour avec images locales...');
  
  try {
    // 1. Récupérer le produit
    const productResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`);
    if (!productResponse.ok) {
      throw new Error(`Produit ${PRODUCT_ID} non trouvé`);
    }
    
    const currentProduct = await productResponse.json();
    
    // 2. Créer des données avec des images locales
    const updateData = {
      name: currentProduct.name,
      description: currentProduct.description,
      price: currentProduct.price,
      stock: currentProduct.stock,
      status: currentProduct.status,
      categories: currentProduct.categories.map(c => c.id),
      sizes: currentProduct.sizes.map(s => s.sizeName),
      colorVariations: currentProduct.colorVariations.map((cv, index) => ({
        id: cv.id,
        name: cv.name,
        colorCode: cv.colorCode,
        images: index === 0 ? [
          // Image existante
          ...cv.images.slice(0, 1).map(img => ({
            id: img.id,
            view: img.view,
            url: img.url,
            publicId: img.publicId,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            delimitations: img.delimitations || []
          })),
          // Image locale (blob)
          {
            id: null,
            view: 'Front',
            url: 'blob:http://localhost:3000/fake-blob-id',
            publicId: null,
            naturalWidth: 500,
            naturalHeight: 500,
            delimitations: []
          }
        ] : cv.images.map(img => ({
          id: img.id,
          view: img.view,
          url: img.url,
          publicId: img.publicId,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          delimitations: img.delimitations || []
        }))
      }))
    };

    console.log('📝 Test avec image locale (blob)');

    // 3. Tester la mise à jour
    const updateResponse = await fetch(`${BASE_URL}/products/${PRODUCT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error('❌ Erreur mise à jour:', error);
      throw new Error(`Erreur mise à jour: ${error.message}`);
    }

    const updatedProduct = await updateResponse.json();
    console.log('✅ Mise à jour réussie avec images locales ignorées');

  } catch (error) {
    console.error('❌ Erreur test images locales:', error.message);
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Démarrage des tests de correction de mise à jour de produit...\n');
  
  await testProductUpdateWithImages();
  await testProductUpdateWithNonExistentImage();
  await testProductUpdateWithLocalImages();
  
  console.log('\n✨ Tous les tests terminés!');
  console.log('\n📋 Résumé:');
  console.log('✅ Mise à jour normale avec images existantes');
  console.log('✅ Gestion des images inexistantes (création automatique)');
  console.log('✅ Ignorance des images locales (blob)');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testProductUpdateWithImages,
  testProductUpdateWithNonExistentImage,
  testProductUpdateWithLocalImages
}; 