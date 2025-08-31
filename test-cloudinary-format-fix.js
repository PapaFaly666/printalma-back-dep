/**
 * 🔧 SCRIPT DE TEST - CORRECTION FORMAT CLOUDINARY
 * 
 * Teste la correction de l'erreur "Invalid extension in transformation: auto"
 * 
 * Usage: node test-cloudinary-format-fix.js
 */

const { CloudinaryService } = require('./dist/src/core/cloudinary/cloudinary.service');

// Simuler un petit base64 pour test
const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testCloudinaryFix() {
  console.log('🔧 === TEST CORRECTION FORMAT CLOUDINARY ===');
  console.log('⏰ Début:', new Date().toISOString());
  
  try {
    console.log('\n🧪 Test 1: Upload Image Produit...');
    
    // Créer une instance du service
    const cloudinaryService = new CloudinaryService();
    
    // Test de la méthode uploadProductImage
    console.log('📤 Test uploadProductImage avec nouveau format...');
    const result = await cloudinaryService.uploadProductImage(testBase64, {
      public_id: `test_fix_${Date.now()}`,
      tags: ['test-fix', 'format-correction']
    });
    
    console.log('✅ Upload réussi !');
    console.log('🔗 URL générée:', result.secure_url);
    console.log('📋 Format détecté:', result.format);
    console.log('📊 Taille:', result.bytes, 'bytes');
    
    // Vérifier que l'URL ne contient pas l'extension .auto
    if (result.secure_url.includes('.auto')) {
      console.log('❌ ERREUR: URL contient encore .auto');
      return false;
    }
    
    console.log('\n🧪 Test 2: Upload Design Original...');
    
    // Test de la méthode uploadHighQualityDesign
    const designResult = await cloudinaryService.uploadHighQualityDesign(testBase64, {
      public_id: `test_design_${Date.now()}`,
      tags: ['test-design', 'format-correction']
    });
    
    console.log('✅ Upload design réussi !');
    console.log('🔗 URL design:', designResult.secure_url);
    console.log('📋 Format design:', designResult.format);
    
    console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
    console.log('✅ Correction format Cloudinary fonctionnelle');
    console.log('✅ Plus d\'erreur "Invalid extension in transformation: auto"');
    console.log('✅ URLs générées correctement');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ === ERREUR DÉTECTÉE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Analyser l'erreur spécifique
    if (error.message.includes('Invalid extension in transformation')) {
      console.error('🚨 PROBLÈME: Erreur format Cloudinary persiste');
      console.error('💡 SOLUTION: Vérifier que format: "auto" a été supprimé');
    }
    
    return false;
  }
}

// Fonction de test simplifiée pour environnement sans TypeScript
async function testSimpleCloudinaryFix() {
  console.log('🔧 === TEST SIMPLE CORRECTION CLOUDINARY ===');
  
  try {
    // Test direct avec l'API Cloudinary
    const { v2: cloudinary } = require('cloudinary');
    
    // Configuration Cloudinary (utilise vos variables d'environnement)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    console.log('📤 Test upload direct avec paramètres corrigés...');
    
    const result = await cloudinary.uploader.upload(testBase64, {
      folder: 'test-fix',
      public_id: `test_format_fix_${Date.now()}`,
      transformation: [
        {
          width: 1500,
          height: 1500,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',  // ✅ Corrigé: fetch_format au lieu de format
          flags: 'progressive'
        }
      ]
    });
    
    console.log('✅ Upload direct réussi !');
    console.log('🔗 URL:', result.secure_url);
    console.log('📋 Format:', result.format);
    console.log('📊 Transformations appliquées:', result.eager?.length || 0);
    
    // Vérifier l'URL
    if (result.secure_url && !result.secure_url.includes('.auto')) {
      console.log('🎉 SUCCESS: Format Cloudinary corrigé !');
      return true;
    } else {
      console.log('❌ ÉCHEC: URL contient encore .auto');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur test simple:', error.message);
    return false;
  }
}

// Exécuter les tests
async function main() {
  try {
    console.log('🚀 Démarrage des tests de correction Cloudinary...\n');
    
    // Test 1: Avec service TypeScript (si disponible)
    let success = false;
    try {
      success = await testCloudinaryFix();
    } catch (error) {
      console.log('⚠️ Test TypeScript échoué, essai test simple...');
      success = await testSimpleCloudinaryFix();
    }
    
    if (success) {
      console.log('\n🎉 === CORRECTION VALIDÉE ===');
      console.log('✅ L\'erreur "Invalid extension in transformation: auto" est résolue');
      console.log('✅ Les uploads Cloudinary fonctionnent maintenant');
      console.log('✅ Vous pouvez maintenant publier des produits vendeur');
    } else {
      console.log('\n❌ === CORRECTION INCOMPLÈTE ===');
      console.log('❌ Des problèmes persistent avec Cloudinary');
      console.log('💡 Vérifiez la configuration et les paramètres');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCloudinaryFix, testSimpleCloudinaryFix }; 