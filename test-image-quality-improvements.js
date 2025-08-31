/**
 * 🎨 SCRIPT DE TEST DES AMÉLIORATIONS QUALITÉ IMAGES
 * 
 * Teste les nouvelles fonctionnalités :
 * - Stockage du design original haute qualité
 * - Amélioration de la qualité des images produits
 * - Vérification des URLs et paramètres Cloudinary
 * 
 * Usage: node test-image-quality-improvements.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 === TEST AMÉLIORATIONS QUALITÉ IMAGES ===');
  console.log('⏰ Début:', new Date().toISOString());
  
  try {
    await checkImageQualityStatus();
    
    console.log('\n✅ === TEST TERMINÉ ===');
    console.log('⏰ Fin:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkImageQualityStatus() {
  console.log('\n📊 Analyse des produits vendeurs...');
  
  const products = await prisma.vendorProduct.findMany({
    include: {
      images: true,
      baseProduct: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10 // Analyser les 10 derniers produits
  });

  console.log(`📦 Analyse de ${products.length} produits récents`);
  
  if (products.length === 0) {
    console.log('ℹ️ Aucun produit vendeur trouvé');
    return;
  }

  // Statistiques globales
  let withOriginalDesign = 0;
  let withValidDesignUrl = 0;
  let withHighQualityImages = 0;
  let totalImages = 0;
  
  const qualityIssues = [];
  const improvements = [];

  console.log('\n🔍 Analyse détaillée...');
  
  for (const product of products) {
    const productInfo = `Produit ${product.id} (${product.baseProduct.name})`;
    console.log(`\n📋 ${productInfo}`);
    
    // Vérifier originalDesignUrl
    if (product.originalDesignUrl) {
      withOriginalDesign++;
      if (product.originalDesignUrl.includes('designs-originals')) {
        console.log(`✅ Design original stocké: ${product.originalDesignUrl}`);
        improvements.push(`${productInfo}: Design original haute qualité stocké`);
      } else {
        console.log(`⚠️ Design original URL suspect: ${product.originalDesignUrl}`);
      }
    } else {
      console.log(`❌ Pas de design original stocké`);
      qualityIssues.push(`${productInfo}: Design original manquant`);
    }
    
    // Vérifier designUrl
    if (product.designUrl && product.designUrl.startsWith('https://res.cloudinary.com/')) {
      withValidDesignUrl++;
      console.log(`✅ DesignUrl valide: ${product.designUrl}`);
    } else {
      console.log(`❌ DesignUrl invalide: ${product.designUrl}`);
      qualityIssues.push(`${productInfo}: DesignUrl invalide`);
    }
    
    // Analyser la qualité des images
    console.log(`🖼️ Images disponibles: ${product.images.length}`);
    totalImages += product.images.length;
    
    let hasHighQualityImages = false;
    for (const image of product.images) {
      const url = image.cloudinaryUrl;
      
      // Vérifier les paramètres de qualité dans l'URL
      if (url.includes('q_auto:good') || url.includes('q_auto:best') || url.includes('w_1500')) {
        hasHighQualityImages = true;
        console.log(`✅ Image haute qualité détectée: ${image.colorName || 'default'}`);
      } else {
        console.log(`⚠️ Image qualité standard: ${image.colorName || 'default'} - ${url}`);
      }
      
      // Vérifier la taille du fichier si disponible
      if (image.fileSize) {
        const sizeMB = (image.fileSize / 1024 / 1024).toFixed(2);
        console.log(`📊 Taille ${image.colorName || 'default'}: ${sizeMB}MB`);
      }
    }
    
    if (hasHighQualityImages) {
      withHighQualityImages++;
      improvements.push(`${productInfo}: Images haute qualité détectées`);
    } else if (product.images.length > 0) {
      qualityIssues.push(`${productInfo}: Images qualité standard uniquement`);
    }
  }

  // Afficher les statistiques
  console.log('\n📊 === STATISTIQUES QUALITÉ ===');
  
  console.log('\n🎨 Design Original:');
  console.log(`✅ Avec design original: ${withOriginalDesign}/${products.length} (${Math.round(withOriginalDesign/products.length*100)}%)`);
  console.log(`❌ Sans design original: ${products.length - withOriginalDesign}/${products.length}`);
  
  console.log('\n🔗 URLs Design:');
  console.log(`✅ URLs valides: ${withValidDesignUrl}/${products.length} (${Math.round(withValidDesignUrl/products.length*100)}%)`);
  console.log(`❌ URLs invalides: ${products.length - withValidDesignUrl}/${products.length}`);
  
  console.log('\n📸 Qualité Images:');
  console.log(`✅ Produits avec images HQ: ${withHighQualityImages}/${products.length} (${Math.round(withHighQualityImages/products.length*100)}%)`);
  console.log(`📊 Total images analysées: ${totalImages}`);
  console.log(`📊 Moyenne images/produit: ${(totalImages/products.length).toFixed(1)}`);

  // Afficher les améliorations détectées
  if (improvements.length > 0) {
    console.log('\n🎉 === AMÉLIORATIONS DÉTECTÉES ===');
    improvements.forEach(improvement => console.log(`✅ ${improvement}`));
  }

  // Afficher les problèmes de qualité
  if (qualityIssues.length > 0) {
    console.log('\n⚠️ === PROBLÈMES DE QUALITÉ ===');
    qualityIssues.forEach(issue => console.log(`⚠️ ${issue}`));
    
    console.log(`\n💡 Recommandations:`);
    console.log(`   - Utiliser les nouvelles méthodes uploadHighQualityDesign() et uploadProductImage()`);
    console.log(`   - S'assurer que le design original est envoyé dans finalImagesBase64['design']`);
    console.log(`   - Vérifier les paramètres Cloudinary (quality: 'auto:good', width: 1500)`);
  } else {
    console.log('\n🎉 Excellente qualité ! Toutes les améliorations sont actives.');
  }

  // Recommandations pour l'optimisation
  console.log('\n🔧 === PARAMÈTRES CLOUDINARY RECOMMANDÉS ===');
  console.log('Images Produits:');
  console.log('  - width: 1500, height: 1500');
  console.log('  - quality: "auto:good"');
  console.log('  - format: "auto"');
  console.log('  - flags: "progressive"');
  console.log('  - dpr: "auto"');
  
  console.log('\nDesign Original:');
  console.log('  - quality: 100');
  console.log('  - format: "png"');
  console.log('  - transformation: [] (aucune)');
  console.log('  - folder: "designs-originals"');
}

// Exécuter le script
main().catch(console.error); 