const { PrismaClient } = require('@prisma/client');

async function fixMissingDesignIds() {
  const prisma = new PrismaClient();
  
  console.log('🔧 === CORRECTION DES DESIGN IDS MANQUANTS ===');
  
  try {
    // Trouver tous les produits vendeurs sans designId
    const productsWithoutDesign = await prisma.vendorProduct.findMany({
      where: {
        designId: null
      },
      include: {
        vendor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    console.log(`🔍 Trouvé ${productsWithoutDesign.length} produits sans designId`);

    for (const product of productsWithoutDesign) {
      try {
        console.log(`🔗 Traitement produit ${product.id} (vendeur: ${product.vendor.firstName} ${product.vendor.lastName})`);
        
        // Créer automatiquement un design pour ce produit
        const autoDesign = await prisma.design.create({
          data: {
            vendorId: product.vendorId,
            name: product.vendorName || `Design auto - Produit ${product.id}`,
            description: product.vendorDescription || `Design créé automatiquement pour le produit vendeur ${product.id}`,
            price: Math.max(product.price * 0.3, 5000), // 30% du prix produit ou min 5000
            category: 'ILLUSTRATION', // Catégorie par défaut
            imageUrl: product.originalDesignUrl || product.designUrl,
            thumbnailUrl: product.originalDesignUrl || product.designUrl,
            cloudinaryPublicId: extractPublicIdFromUrl(product.originalDesignUrl || product.designUrl),
            fileSize: 0,
            originalFileName: `auto_design_product_${product.id}.jpg`,
            dimensions: { width: 1920, height: 1080 },
            format: 'jpg',
            tags: ['auto-generated', 'missing-design-fix', `product-${product.id}`],
            
            // Statuts selon le statut du produit
            isDraft: product.status === 'DRAFT',
            isPending: product.status === 'PENDING',
            isPublished: product.status === 'PUBLISHED',
            isValidated: product.isValidated,
            validatedAt: product.validatedAt,
            validatedBy: product.validatedBy,
            submittedForValidationAt: product.submittedForValidationAt,
            
            // Stats initiales
            views: 0,
            likes: 0,
            earnings: 0,
            usageCount: 1
          }
        });

        // Lier le design au produit vendeur
        await prisma.vendorProduct.update({
          where: { id: product.id },
          data: {
            designId: autoDesign.id,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Produit ${product.id} lié au design ${autoDesign.id} - "${autoDesign.name}"`);

      } catch (productError) {
        console.error(`❌ Erreur traitement produit ${product.id}:`, productError);
        // Continuer avec les autres produits
      }
    }
    
    console.log(`🎉 Correction terminée pour ${productsWithoutDesign.length} produits`);
    
    // Statistiques finales
    const remainingWithoutDesign = await prisma.vendorProduct.count({
      where: { designId: null }
    });
    
    const totalWithDesign = await prisma.vendorProduct.count({
      where: { designId: { not: null } }
    });
    
    console.log(`📊 Résultats:`);
    console.log(`   - Produits avec designId: ${totalWithDesign}`);
    console.log(`   - Produits sans designId: ${remainingWithoutDesign}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des designId:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractPublicIdFromUrl(cloudinaryUrl) {
  try {
    if (!cloudinaryUrl) return 'unknown';
    
    const urlParts = cloudinaryUrl.split('/');
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const fileName = fileNameWithExt.split('.')[0];
    
    // Inclure le dossier si présent
    if (urlParts.length > 2 && urlParts[urlParts.length - 2]) {
      return `${urlParts[urlParts.length - 2]}/${fileName}`;
    }
    
    return fileName;
  } catch (error) {
    console.warn(`⚠️ Impossible d'extraire public_id de: ${cloudinaryUrl}`);
    return cloudinaryUrl || 'unknown';
  }
}

// Exécuter le script
fixMissingDesignIds()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur dans le script:', error);
    process.exit(1);
  }); 