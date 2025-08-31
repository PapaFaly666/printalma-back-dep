/**
 * 🔧 SCRIPT DE CORRECTION DES DONNÉES PRODUITS VENDEURS
 * 
 * Problèmes résolus :
 * - designUrl avec blob:// ou localhost
 * - mockupUrl null
 * - formats JSON sizes/colors incomplets
 * 
 * Usage: node fix-vendor-products-data.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 === CORRECTION DES DONNÉES PRODUITS VENDEURS ===');
  console.log('⏰ Début:', new Date().toISOString());
  
  try {
    // 1. Corriger les URLs design
    await fixDesignUrls();
    
    // 2. Corriger les formats JSON
    await fixJsonFormats();
    
    console.log('\n🎉 === CORRECTION TERMINÉE AVEC SUCCÈS ===');
    console.log('⏰ Fin:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixDesignUrls() {
  console.log('\n📋 Étape 1: Correction des URLs design...');
  
  // Trouver tous les produits avec des URLs design invalides
  const productsToFix = await prisma.vendorProduct.findMany({
    where: {
      OR: [
        { designUrl: { startsWith: 'blob:' } },
        { designUrl: 'placeholder://design-not-available' },
        { designUrl: { contains: 'localhost' } },
        { mockupUrl: null }
      ]
    },
    include: {
      images: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  console.log(`🔍 Trouvé ${productsToFix.length} produits à corriger`);

  let fixedCount = 0;
  let mockupCount = 0;

  for (const product of productsToFix) {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      const mockupImage = product.images.find(img => img.imageType === 'default');
      
      const updateData = {
        designUrl: firstImage.cloudinaryUrl,
        updatedAt: new Date()
      };
      
      if (mockupImage && !product.mockupUrl) {
        updateData.mockupUrl = mockupImage.cloudinaryUrl;
        mockupCount++;
      }
      
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: updateData
      });
      
      console.log(`✅ Produit ${product.id} corrigé:`);
      console.log(`   - designUrl: ${firstImage.cloudinaryUrl}`);
      if (mockupImage && !product.mockupUrl) {
        console.log(`   - mockupUrl: ${mockupImage.cloudinaryUrl}`);
      }
      
      fixedCount++;
    } else {
      console.log(`⚠️ Produit ${product.id}: aucune image disponible`);
    }
  }
  
  console.log(`✅ URLs corrigées: ${fixedCount} produits`);
  console.log(`✅ MockupUrl ajoutées: ${mockupCount} produits`);
}

async function fixJsonFormats() {
  console.log('\n📋 Étape 2: Correction des formats JSON...');
  
  const products = await prisma.vendorProduct.findMany({
    include: {
      baseProduct: {
        include: {
          sizes: true,
          colorVariations: true
        }
      }
    }
  });

  console.log(`🔍 Vérification de ${products.length} produits`);

  let sizesFixed = 0;
  let colorsFixed = 0;

  for (const product of products) {
    let needsUpdate = false;
    const updateData = {};

    // Vérifier le format sizes
    try {
      const currentSizes = JSON.parse(product.sizes);
      if (Array.isArray(currentSizes) && currentSizes.length > 0) {
        // Si c'est juste un array d'IDs, enrichir avec les détails
        if (typeof currentSizes[0] === 'number') {
          const enrichedSizes = product.baseProduct.sizes
            .filter(size => currentSizes.includes(size.id))
            .map(size => ({
              id: size.id,
              sizeName: size.sizeName
            }));
          
          updateData.sizes = JSON.stringify(enrichedSizes);
          needsUpdate = true;
          sizesFixed++;
          console.log(`📐 Sizes enrichies pour produit ${product.id}:`, enrichedSizes);
        }
      }
    } catch (error) {
      console.log(`⚠️ Format sizes invalide pour produit ${product.id}:`, error.message);
    }

    // Vérifier le format colors
    try {
      const currentColors = JSON.parse(product.colors);
      if (Array.isArray(currentColors) && currentColors.length > 0) {
        // Si c'est juste un array d'IDs, enrichir avec les détails
        if (typeof currentColors[0] === 'number') {
          const enrichedColors = product.baseProduct.colorVariations
            .filter(color => currentColors.includes(color.id))
            .map(color => ({
              id: color.id,
              name: color.name,
              colorCode: color.colorCode
            }));
          
          updateData.colors = JSON.stringify(enrichedColors);
          needsUpdate = true;
          colorsFixed++;
          console.log(`🎨 Colors enrichies pour produit ${product.id}:`, enrichedColors);
        }
      }
    } catch (error) {
      console.log(`⚠️ Format colors invalide pour produit ${product.id}:`, error.message);
    }

    if (needsUpdate) {
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: updateData
      });
      console.log(`✅ Produit ${product.id} mis à jour`);
    }
  }
  
  console.log(`✅ Formats sizes corrigés: ${sizesFixed} produits`);
  console.log(`✅ Formats colors corrigés: ${colorsFixed} produits`);
}

// Exécuter le script
main().catch(console.error); 