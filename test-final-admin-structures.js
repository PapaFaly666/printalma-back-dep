const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testFinalAdminStructures() {
  console.log(`${colors.blue}🎯 TEST FINAL - Structures Admin selon Documentation${colors.reset}\n`);

  let adminToken;

  try {
    // Connexion admin
    console.log(`${colors.yellow}📝 Connexion administrateur${colors.reset}`);
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    adminToken = loginResponse.data.access_token;
    console.log(`${colors.green}✅ Connexion réussie${colors.reset}\n`);

    // Test des nouvelles structures
    const response = await axios.get(
      `${API_BASE_URL}/vendor-product-validation/all-products?limit=1`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    if (response.data.products.length === 0) {
      console.log(`${colors.yellow}⚠️ Aucun produit disponible pour tester${colors.reset}`);
      return;
    }

    const product = response.data.products[0];
    console.log(`${colors.magenta}🧪 Test du produit ID: ${product.id}${colors.reset}\n`);

    // ✅ 1. TEST DESIGN APPLICATION
    console.log(`${colors.cyan}🎨 1. DESIGN APPLICATION (CRITIQUE)${colors.reset}`);
    if (product.designApplication) {
      console.log(`${colors.green}✅ Structure présente${colors.reset}`);
      console.log(`   hasDesign: ${product.designApplication.hasDesign}`);
      console.log(`   designUrl: ${product.designApplication.designUrl ? '✅ Present' : '❌ Missing'}`);
      console.log(`   positioning: ${product.designApplication.positioning}`);
      console.log(`   scale: ${product.designApplication.scale}`);
      console.log(`   mode: ${product.designApplication.mode}`);
      
      // Test ordre de priorité
      const designUrl = product.designApplication.designUrl || 
                       product.design?.imageUrl || 
                       product.designPositions?.[0]?.design?.imageUrl;
      console.log(`   🎯 URL Design (priorité): ${designUrl ? '✅ Trouvée' : '❌ Manquante'}`);
    } else {
      console.log(`${colors.red}❌ Structure designApplication MANQUANTE${colors.reset}`);
    }

    // ✅ 2. TEST SELECTED COLORS
    console.log(`\n${colors.cyan}🌈 2. SELECTED COLORS (CRITIQUE)${colors.reset}`);
    if (product.selectedColors && Array.isArray(product.selectedColors)) {
      console.log(`${colors.green}✅ Structure présente (${product.selectedColors.length} couleurs)${colors.reset}`);
      product.selectedColors.slice(0, 3).forEach((color, i) => {
        console.log(`   ${i + 1}. ${color.name} (${color.colorCode}) - ID: ${color.id}`);
      });
      
      // Test logique fallback
      if (product.selectedColors.length === 0 && product.adminProduct?.colorVariations?.length > 0) {
        console.log(`   🔄 Fallback vers adminProduct.colorVariations: ${product.adminProduct.colorVariations.length} couleurs`);
      }
    } else {
      console.log(`${colors.red}❌ Structure selectedColors MANQUANTE ou invalide${colors.reset}`);
    }

    // ✅ 3. TEST ADMIN PRODUCT
    console.log(`\n${colors.cyan}🏭 3. ADMIN PRODUCT (VARIATIONS COMPLÈTES)${colors.reset}`);
    if (product.adminProduct) {
      console.log(`${colors.green}✅ Structure présente${colors.reset}`);
      console.log(`   ID: ${product.adminProduct.id}`);
      console.log(`   Nom: ${product.adminProduct.name}`);
      console.log(`   Catégories: ${product.adminProduct.categories?.length || 0}`);
      console.log(`   Tailles: ${product.adminProduct.sizes?.length || 0}`);
      console.log(`   Variations couleur: ${product.adminProduct.colorVariations?.length || 0}`);
      
      // Test des variations de couleur
      if (product.adminProduct.colorVariations?.length > 0) {
        const firstColor = product.adminProduct.colorVariations[0];
        console.log(`   🎨 Première couleur: ${firstColor.name} (${firstColor.colorCode})`);
        console.log(`   📸 Images: ${firstColor.images?.length || 0}`);
        
        if (firstColor.images?.length > 0) {
          const firstImage = firstColor.images[0];
          console.log(`   📐 Délimitations: ${firstImage.delimitations?.length || 0}`);
          
          if (firstImage.delimitations?.length > 0) {
            const delim = firstImage.delimitations[0];
            console.log(`   🎯 Première délimitation: ${delim.name} (${delim.coordinateType})`);
          }
        }
      }
    } else {
      console.log(`${colors.red}❌ Structure adminProduct MANQUANTE${colors.reset}`);
    }

    // ✅ 4. TEST DESIGN POSITIONS ENRICHIES
    console.log(`\n${colors.cyan}📍 4. DESIGN POSITIONS ENRICHIES${colors.reset}`);
    if (product.designPositions && Array.isArray(product.designPositions)) {
      console.log(`${colors.green}✅ Structure présente (${product.designPositions.length} positions)${colors.reset}`);
      
      if (product.designPositions.length > 0) {
        const position = product.designPositions[0];
        console.log(`   Design ID: ${position.designId}`);
        console.log(`   Position: x=${position.position?.x}, y=${position.position?.y}`);
        console.log(`   Scale: ${position.position?.scale}, Rotation: ${position.position?.rotation}`);
        console.log(`   Design: ${position.design?.name || 'N/A'}`);
        console.log(`   Image URL: ${position.design?.imageUrl ? '✅ Present' : '❌ Missing'}`);
      }
    } else {
      console.log(`${colors.yellow}⚠️ Aucune position de design (normal si pas de design)${colors.reset}`);
    }

    // ✅ 5. TEST COMPATIBILITÉ LEGACY
    console.log(`\n${colors.cyan}🔄 5. COMPATIBILITÉ LEGACY${colors.reset}`);
    const legacyFields = [
      'baseProduct',
      'designCloudinaryUrl', 
      'designPositioning',
      'designScale',
      'sizes',
      'colors'
    ];
    
    legacyFields.forEach(field => {
      const present = product[field] !== undefined;
      console.log(`   ${field}: ${present ? '✅' : '❌'}`);
    });

    // ✅ 6. RÉSUMÉ FINAL
    console.log(`\n${colors.blue}📊 RÉSUMÉ FINAL${colors.reset}`);
    const criticalStructures = {
      'designApplication': !!product.designApplication,
      'selectedColors': Array.isArray(product.selectedColors),
      'adminProduct': !!product.adminProduct,
      'designPositions': Array.isArray(product.designPositions)
    };

    const successCount = Object.values(criticalStructures).filter(Boolean).length;
    const totalCount = Object.keys(criticalStructures).length;

    console.log(`\n${colors.magenta}🎯 Structures critiques: ${successCount}/${totalCount}${colors.reset}`);
    Object.entries(criticalStructures).forEach(([key, present]) => {
      console.log(`   ${key}: ${present ? `${colors.green}✅` : `${colors.red}❌`}${colors.reset}`);
    });

    if (successCount === totalCount) {
      console.log(`\n${colors.green}🎉 SUCCÈS COMPLET ! Toutes les structures critiques sont présentes.${colors.reset}`);
      console.log(`${colors.green}L'interface admin peut maintenant afficher les produits avec designs incorporés !${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠️ ${totalCount - successCount} structure(s) manquante(s).${colors.reset}`);
    }

    // ✅ 7. EXEMPLES D'USAGE FRONTEND
    console.log(`\n${colors.cyan}💻 EXEMPLES D'USAGE FRONTEND${colors.reset}`);
    
    console.log(`\n// 1. Récupérer l'URL du design (ordre de priorité)`);
    const designUrl = product.designApplication?.designUrl || 
                     product.design?.imageUrl || 
                     product.designPositions?.[0]?.design?.imageUrl;
    console.log(`const designUrl = "${designUrl || 'N/A'}";`);
    
    console.log(`\n// 2. Récupérer les couleurs sélectionnées`);
    const colors = product.selectedColors?.length > 0 ? 
                   product.selectedColors : 
                   product.adminProduct?.colorVariations?.map(cv => ({ 
                     id: cv.id, name: cv.name, colorCode: cv.colorCode 
                   }));
    console.log(`const colors = [${colors?.slice(0, 2).map(c => `"${c.name}"`).join(', ')}...]; // ${colors?.length || 0} couleurs`);
    
    console.log(`\n// 3. Récupérer la position du design`);
    const position = product.designPositions?.[0]?.position || { x: 0.5, y: 0.3, scale: 0.8, rotation: 0 };
    console.log(`const position = ${JSON.stringify(position)};`);

  } catch (error) {
    console.log(`${colors.red}❌ Erreur lors du test:${colors.reset}`);
    console.log(`📋 Message:`, error.response?.data?.message || error.message);
    console.log(`🔢 Code:`, error.response?.status);
  }
}

// Exécuter le test
testFinalAdminStructures();

module.exports = { testFinalAdminStructures }; 