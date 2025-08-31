/**
 * FRONTEND VENDOR PUBLISH FIX
 * 
 * Ce fichier contient les fonctions corrigées pour résoudre le problème
 * "Structure colorImages invalide ou manquante" lors de la publication vendeur.
 * 
 * PROBLÈME: Le frontend envoie finalImagesBase64 avec des clés comme "287_340"
 * mais le backend s'attend à des clés comme "Blanc", "Blue", etc.
 */

// ✅ FONCTION CORRIGÉE: Conversion avec mapping des couleurs
export async function convertImagesToBase64Fixed(
  images, // Record<string, string> - { "287_340": "blob:...", "287_341": "blob:..." }
  colorMappings // Record<string, string> - { "287_340": "Blanc", "287_341": "Blue" }
) {
  console.log('🔄 Conversion de', Object.keys(images).length, 'images vers base64...');
  console.log('🗺️ Mappings couleurs:', colorMappings);
  
  const result = {};
  
  for (const [imageKey, blobUrl] of Object.entries(images)) {
    const colorName = colorMappings[imageKey];
    if (!colorName) {
      console.warn(`⚠️ Aucune couleur trouvée pour imageKey: ${imageKey}`);
      continue;
    }
    
    console.log(`📝 Conversion ${imageKey} -> ${colorName}...`);
    
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      result[colorName] = base64; // ✅ Utilise le nom de couleur comme clé
      console.log(`✅ ${colorName} converti (${(blob.size / 1024).toFixed(0)}KB)`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${colorName}:`, error);
    }
  }
  
  console.log('✅ Toutes les images converties en base64');
  console.log('🔑 Clés finales:', Object.keys(result));
  return result;
}

// ✅ FONCTION HELPER: Créer le mapping imageKey -> colorName
export function createColorMappings(selectedProducts) {
  const colorMappings = {};
  
  selectedProducts.forEach(product => {
    product.productViews.forEach(view => {
      if (view.colors) {
        view.colors.forEach(color => {
          const imageKey = `${product.id}_${color.id}`;
          colorMappings[imageKey] = color.name;
        });
      }
    });
  });
  
  console.log('🗺️ Mapping couleurs créé:', colorMappings);
  return colorMappings;
}

// ✅ FONCTION VALIDATION: Vérifier la structure avant envoi
export function validatePayloadStructure(payload) {
  console.log('🔍 Validation structure pour produit', payload.baseProductId);
  
  if (!payload.finalImages?.colorImages) {
    console.error('❌ finalImages.colorImages manquant');
    return false;
  }
  
  if (!payload.finalImagesBase64) {
    console.error('❌ finalImagesBase64 manquant');
    return false;
  }
  
  const colorImageKeys = Object.keys(payload.finalImages.colorImages);
  const base64Keys = Object.keys(payload.finalImagesBase64);
  
  console.log('🔑 Clés colorImages:', colorImageKeys);
  console.log('🔑 Clés base64:', base64Keys);
  
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  if (missingBase64.length > 0) {
    console.error('❌ Images base64 manquantes pour:', missingBase64);
    return false;
  }
  
  console.log('✅ Structure payload valide pour produit', payload.baseProductId);
  return true;
}

// ✅ FONCTION COMPLÈTE: Processus de publication corrigé
export async function publishProductsFixed(
  selectedProducts,
  captureAllProductImages, // Votre fonction existante
  prepareProductsData,     // Votre fonction existante
  publishAllProducts       // Votre fonction existante
) {
  try {
    console.log('🚀 === DÉBUT PUBLICATION CORRIGÉE ===');
    
    // 1. Capture des images
    console.log('📸 Capture des images...');
    const capturedImages = await captureAllProductImages();
    console.log('📸 Images capturées:', Object.keys(capturedImages).length, 'images');

    // 2. Créer le mapping imageKey -> colorName
    console.log('🗺️ Création du mapping couleurs...');
    const colorMappings = createColorMappings(selectedProducts);

    // 3. Conversion avec le mapping corrigé
    console.log('🔄 Conversion images avec mapping...');
    const imagesBase64 = await convertImagesToBase64Fixed(capturedImages, colorMappings);
    console.log('✅ Images converties:', Object.keys(imagesBase64).length, 'images');

    // 4. Préparation des données
    console.log('📦 Préparation des données...');
    const productsData = prepareProductsData(selectedProducts, capturedImages, imagesBase64);
    
    // 5. Validation avant envoi
    console.log('🔍 Validation des structures...');
    for (const productData of productsData) {
      if (!validatePayloadStructure(productData)) {
        throw new Error(`Structure invalide pour le produit ${productData.baseProductId}`);
      }
    }
    
    // 6. Envoi vers le backend
    console.log('🚀 Envoi vers le backend...');
    const results = await publishAllProducts(productsData);
    
    console.log('✅ === PUBLICATION TERMINÉE ===');
    return results;

  } catch (error) {
    console.error('❌ Erreur publication:', error);
    throw error;
  }
}

// ✅ DIAGNOSTIC: Analyser les données avant envoi
export function diagnoseProblem(payload) {
  console.log('🔍 === DIAGNOSTIC DU PROBLÈME ===');
  
  const colorImages = payload.finalImages?.colorImages || {};
  const base64Images = payload.finalImagesBase64 || {};
  
  console.log('🎨 Structure colorImages:');
  Object.entries(colorImages).forEach(([colorName, imageData]) => {
    console.log(`   ${colorName}:`, {
      hasColorInfo: !!imageData.colorInfo,
      hasImageKey: !!imageData.imageKey,
      imageKey: imageData.imageKey
    });
  });
  
  console.log('🖼️ Structure finalImagesBase64:');
  console.log('   Clés:', Object.keys(base64Images));
  
  const colorImageKeys = Object.keys(colorImages);
  const base64Keys = Object.keys(base64Images);
  
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  const extraBase64 = base64Keys.filter(key => !colorImageKeys.includes(key));
  
  if (missingBase64.length > 0) {
    console.log('❌ PROBLÈME: Images base64 manquantes pour:', missingBase64);
  }
  
  if (extraBase64.length > 0) {
    console.log('⚠️ PROBLÈME: Clés base64 en trop:', extraBase64);
    console.log('💡 Ces clés semblent être des imageKeys au lieu de noms de couleurs');
  }
  
  if (missingBase64.length === 0 && extraBase64.length === 0) {
    console.log('✅ Structure semble correcte');
  } else {
    console.log('📋 SOLUTION:');
    console.log('   1. Créer un mapping imageKey -> colorName');
    console.log('   2. Utiliser le mapping lors de la conversion base64');
    console.log('   3. Les clés finalImagesBase64 doivent correspondre aux clés colorImages');
  }
}

// ✅ EXEMPLE D'UTILISATION:
/*
// Dans votre composant React ou hook

import { 
  convertImagesToBase64Fixed, 
  createColorMappings, 
  validatePayloadStructure,
  publishProductsFixed 
} from './frontend-vendor-publish-fix.js';

// Au lieu de:
// const imagesBase64 = await convertImagesToBase64(capturedImages);

// Utilisez:
const colorMappings = createColorMappings(selectedProducts);
const imagesBase64 = await convertImagesToBase64Fixed(capturedImages, colorMappings);

// Et validez avant envoi:
if (!validatePayloadStructure(productData)) {
  throw new Error('Structure de données invalide');
}
*/ 