/**
 * SCRIPT DE DIAGNOSTIC FRONTEND
 * 
 * À exécuter dans la console du navigateur (F12) pour analyser
 * la structure des données avant envoi au backend.
 */

// ✅ Fonction de diagnostic à coller dans la console du navigateur
function diagnoseFrontendStructure() {
  console.log('🔍 === DIAGNOSTIC STRUCTURE FRONTEND ===');
  
  // Récupérer les données actuelles depuis le localStorage ou état React
  // (Vous devrez adapter cette partie selon votre implémentation)
  
  console.log('💡 Pour utiliser ce diagnostic:');
  console.log('   1. Ouvrez DevTools (F12) sur votre page de publication');
  console.log('   2. Allez dans l\'onglet Console');
  console.log('   3. Juste avant d\'envoyer au backend, ajoutez ce code:');
  console.log('');
  console.log('// Dans votre fonction de publication, avant l\'envoi:');
  console.log('console.log("🔍 DIAGNOSTIC PAYLOAD:", payload);');
  console.log('diagnoseProblem(payload);');
  console.log('');
  
  return {
    step1: 'Ajouter des logs dans votre code frontend',
    step2: 'Analyser la structure finalImagesBase64',
    step3: 'Comparer avec finalImages.colorImages'
  };
}

// ✅ Fonction d'analyse des données (à copier dans votre frontend)
function diagnoseProblem(payload) {
  console.log('🔍 === ANALYSE STRUCTURE PAYLOAD ===');
  
  if (!payload) {
    console.error('❌ Payload vide ou undefined');
    return;
  }
  
  // Analyser finalImages
  console.log('📋 1. STRUCTURE finalImages:');
  if (!payload.finalImages) {
    console.error('❌ finalImages manquant');
    return;
  }
  
  if (!payload.finalImages.colorImages) {
    console.error('❌ finalImages.colorImages manquant');
    return;
  }
  
  const colorImageKeys = Object.keys(payload.finalImages.colorImages);
  console.log('✅ Clés colorImages:', colorImageKeys);
  
  // Analyser finalImagesBase64
  console.log('📋 2. STRUCTURE finalImagesBase64:');
  if (!payload.finalImagesBase64) {
    console.error('❌ finalImagesBase64 manquant');
    return;
  }
  
  const base64Keys = Object.keys(payload.finalImagesBase64);
  console.log('📊 Clés finalImagesBase64:', base64Keys);
  
  // DIAGNOSTIC PRINCIPAL
  console.log('📋 3. CORRESPONDANCE DES CLÉS:');
  console.log('   finalImages.colorImages:', colorImageKeys);
  console.log('   finalImagesBase64:', base64Keys);
  
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  const extraBase64 = base64Keys.filter(key => !colorImageKeys.includes(key));
  
  if (missingBase64.length > 0) {
    console.error('❌ PROBLÈME: Images base64 manquantes pour:', missingBase64);
  }
  
  if (extraBase64.length > 0) {
    console.error('⚠️ PROBLÈME: Clés base64 en trop:', extraBase64);
    console.log('💡 Ces clés semblent être des imageKeys au lieu de noms de couleurs');
    
    // Suggérer la correction
    console.log('📋 4. CORRECTION SUGGÉRÉE:');
    console.log('   Au lieu de clés comme:', extraBase64);
    console.log('   Il faut des clés comme:', colorImageKeys);
    
    // Exemple de mapping
    console.log('📋 5. EXEMPLE DE MAPPING:');
    const exampleMapping = {};
    extraBase64.forEach((imageKey, index) => {
      if (colorImageKeys[index]) {
        exampleMapping[imageKey] = colorImageKeys[index];
      }
    });
    console.log('   Mapping suggéré:', exampleMapping);
  }
  
  if (missingBase64.length === 0 && extraBase64.length === 0) {
    console.log('✅ Structure correcte! Les clés correspondent parfaitement.');
  } else {
    console.log('❌ STRUCTURE INCORRECTE - Voir les erreurs ci-dessus');
    console.log('💡 SOLUTION: Utiliser le mapping des couleurs dans la conversion base64');
  }
  
  // Analyser les selectedColors
  console.log('📋 6. COULEURS SÉLECTIONNÉES:');
  if (payload.selectedColors) {
    const selectedColorNames = payload.selectedColors.map(c => c.name);
    console.log('   Noms:', selectedColorNames);
    console.log('   IDs:', payload.selectedColors.map(c => c.id));
  }
  
  return {
    colorImageKeys,
    base64Keys,
    missingBase64,
    extraBase64,
    isValid: missingBase64.length === 0 && extraBase64.length === 0
  };
}

// ✅ Code à ajouter temporairement dans votre frontend
const frontendDebugCode = `
// AJOUTER CE CODE TEMPORAIREMENT DANS VOTRE FONCTION DE PUBLICATION:

// Juste avant l'envoi au backend, ajoutez ces lignes:
console.log('🔍 === DIAGNOSTIC AVANT ENVOI ===');
console.log('📦 Payload complet:', productData);

// Analyser la structure
const diagnosis = diagnoseProblem(productData);
if (!diagnosis.isValid) {
  console.error('❌ STRUCTURE INVALIDE - ARRÊT');
  return; // Arrêter l'envoi pour déboguer
}

// Si la structure est valide, continuer l'envoi
console.log('✅ Structure valide, envoi au backend...');
`;

console.log('📋 CODE À AJOUTER DANS VOTRE FRONTEND:');
console.log(frontendDebugCode);

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { diagnoseFrontendStructure, diagnoseProblem };
} 