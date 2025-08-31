/**
 * 🔍 SCRIPT DE VÉRIFICATION DES DONNÉES PRODUITS VENDEURS
 * 
 * Vérifie l'état des données :
 * - URLs design valides
 * - MockupUrl présents
 * - Formats JSON corrects
 * 
 * Usage: node test-vendor-products-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 === VÉRIFICATION DES DONNÉES PRODUITS VENDEURS ===');
  console.log('⏰ Début:', new Date().toISOString());
  
  try {
    await checkDataStatus();
    
    console.log('\n✅ === VÉRIFICATION TERMINÉE ===');
    console.log('⏰ Fin:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDataStatus() {
  console.log('\n📊 Récupération des données...');
  
  const products = await prisma.vendorProduct.findMany({
    include: {
      images: true,
      baseProduct: {
        select: { name: true }
      }
    }
  });

  console.log(`📦 Total produits: ${products.length}`);
  
  if (products.length === 0) {
    console.log('ℹ️ Aucun produit vendeur trouvé');
    return;
  }

  // Statistiques URLs
  let validDesignUrls = 0;
  let invalidDesignUrls = 0;
  let nullMockupUrls = 0;
  let validMockupUrls = 0;
  
  // Statistiques formats JSON
  let validSizesFormat = 0;
  let invalidSizesFormat = 0;
  let validColorsFormat = 0;
  let invalidColorsFormat = 0;
  
  const issues = [];

  console.log('\n🔍 Analyse détaillée...');
  
  for (const product of products) {
    const productInfo = `Produit ${product.id} (${product.baseProduct.name})`;
    
    // Vérifier designUrl
    if (product.designUrl) {
      if (product.designUrl.startsWith('blob:') || 
          product.designUrl.includes('localhost') || 
          product.designUrl === 'placeholder://design-not-available') {
        invalidDesignUrls++;
        issues.push(`❌ ${productInfo}: designUrl invalide -> ${product.designUrl}`);
      } else if (product.designUrl.startsWith('https://res.cloudinary.com/')) {
        validDesignUrls++;
        console.log(`✅ ${productInfo}: designUrl valide`);
      } else {
        invalidDesignUrls++;
        issues.push(`⚠️ ${productInfo}: designUrl suspect -> ${product.designUrl}`);
      }
    } else {
      invalidDesignUrls++;
      issues.push(`❌ ${productInfo}: designUrl null`);
    }
    
    // Vérifier mockupUrl
    if (product.mockupUrl) {
      validMockupUrls++;
      console.log(`✅ ${productInfo}: mockupUrl présent`);
    } else {
      nullMockupUrls++;
      issues.push(`⚠️ ${productInfo}: mockupUrl null`);
    }
    
    // Vérifier format sizes
    try {
      const sizes = JSON.parse(product.sizes);
      if (Array.isArray(sizes) && sizes.length > 0) {
        if (typeof sizes[0] === 'object' && sizes[0].id && sizes[0].sizeName) {
          validSizesFormat++;
          console.log(`✅ ${productInfo}: format sizes correct (${sizes.length} tailles)`);
        } else {
          invalidSizesFormat++;
          issues.push(`⚠️ ${productInfo}: format sizes basique (${sizes.length} IDs)`);
        }
      } else {
        invalidSizesFormat++;
        issues.push(`❌ ${productInfo}: sizes vide ou invalide`);
      }
    } catch (error) {
      invalidSizesFormat++;
      issues.push(`❌ ${productInfo}: JSON sizes invalide -> ${error.message}`);
    }
    
    // Vérifier format colors
    try {
      const colors = JSON.parse(product.colors);
      if (Array.isArray(colors) && colors.length > 0) {
        if (typeof colors[0] === 'object' && colors[0].id && colors[0].name && colors[0].colorCode) {
          validColorsFormat++;
          console.log(`✅ ${productInfo}: format colors correct (${colors.length} couleurs)`);
        } else {
          invalidColorsFormat++;
          issues.push(`⚠️ ${productInfo}: format colors basique (${colors.length} IDs)`);
        }
      } else {
        invalidColorsFormat++;
        issues.push(`❌ ${productInfo}: colors vide ou invalide`);
      }
    } catch (error) {
      invalidColorsFormat++;
      issues.push(`❌ ${productInfo}: JSON colors invalide -> ${error.message}`);
    }
    
    // Vérifier images disponibles
    if (product.images.length === 0) {
      issues.push(`❌ ${productInfo}: aucune image disponible`);
    } else {
      console.log(`✅ ${productInfo}: ${product.images.length} images disponibles`);
    }
  }

  // Afficher le résumé
  console.log('\n📊 === RÉSUMÉ DES STATISTIQUES ===');
  
  console.log('\n🔗 URLs Design:');
  console.log(`✅ Valides: ${validDesignUrls}`);
  console.log(`❌ Invalides: ${invalidDesignUrls}`);
  
  console.log('\n🖼️ URLs Mockup:');
  console.log(`✅ Présents: ${validMockupUrls}`);
  console.log(`❌ Nulls: ${nullMockupUrls}`);
  
  console.log('\n📐 Format Sizes:');
  console.log(`✅ Format enrichi: ${validSizesFormat}`);
  console.log(`⚠️ Format basique/invalide: ${invalidSizesFormat}`);
  
  console.log('\n🎨 Format Colors:');
  console.log(`✅ Format enrichi: ${validColorsFormat}`);
  console.log(`⚠️ Format basique/invalide: ${invalidColorsFormat}`);

  // Afficher les problèmes détectés
  if (issues.length > 0) {
    console.log('\n⚠️ === PROBLÈMES DÉTECTÉS ===');
    issues.forEach(issue => console.log(issue));
    
    console.log(`\n💡 Pour corriger ces problèmes, exécutez:`);
    console.log(`   node fix-vendor-products-data.js`);
    console.log(`   Ou via API: POST /api/vendor-products/maintenance/fix-all`);
  } else {
    console.log('\n🎉 Aucun problème détecté! Toutes les données sont correctes.');
  }
}

// Exécuter le script
main().catch(console.error); 