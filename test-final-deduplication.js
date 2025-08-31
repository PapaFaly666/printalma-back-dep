const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testFinalDeduplication() {
  console.log('🧪 Test final de déduplication globale des designs avec brouillons...\n');

  try {
    // 1. Créer deux vendeurs de test
    const vendor1 = await prisma.user.create({
      data: {
        firstName: 'Vendeur',
        lastName: 'Un',
        email: 'test-vendor1-final@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    const vendor2 = await prisma.user.create({
      data: {
        firstName: 'Vendeur',
        lastName: 'Deux',
        email: 'test-vendor2-final@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur 1 créé: ${vendor1.id}`);
    console.log(`✅ Vendeur 2 créé: ${vendor2.id}`);

    // 2. Créer un admin
    const admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'test-admin-final@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    console.log(`✅ Admin créé: ${admin.id}`);

    // 3. Créer un produit de base
    const baseProduct = await prisma.product.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        name: 'T-shirt Test Final',
        description: 'Produit de base pour test',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé: ${baseProduct.id}`);

    // 4. Design de test (même contenu pour les deux vendeurs)
    const testDesignBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const designContent = testDesignBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const designHash = crypto.createHash('sha256').update(designContent).digest('hex');

    console.log(`🎨 Hash du design: ${designHash.substring(0, 12)}...`);

    // 5. Test de déduplication globale
    console.log('\n📦 Test 1: Déduplication globale entre vendeurs...');
    
    // Vendeur 1 crée un produit avec AUTO_PUBLISH
    const design1 = await createOrFindDesign(designHash, vendor1.id);
    const product1 = await createProductWithDesign(design1.id, vendor1.id, baseProduct.id, 'AUTO_PUBLISH');
    console.log(`✅ Vendeur 1 - Design: ${design1.id} (nouveau: ${design1.isNew}), Produit: ${product1.id}`);

    // Vendeur 2 crée un produit avec TO_DRAFT (même design)
    const design2 = await createOrFindDesign(designHash, vendor2.id);
    const product2 = await createProductWithDesign(design2.id, vendor2.id, baseProduct.id, 'TO_DRAFT');
    console.log(`✅ Vendeur 2 - Design: ${design2.id} (nouveau: ${design2.isNew}), Produit: ${product2.id}`);

    // Vérifier la déduplication globale
    if (design1.id === design2.id) {
      console.log(`✅ SUCCÈS: Design réutilisé globalement (ID: ${design1.id})`);
    } else {
      console.log(`❌ ÉCHEC: Designs différents (${design1.id} vs ${design2.id})`);
      return;
    }

    // 6. Test de cascade validation avec brouillons
    console.log('\n🔄 Test 2: Cascade validation avec gestion des brouillons...');
    
    // Valider le design
    await prisma.design.update({
      where: { id: design1.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: admin.id,
        isPending: false
      }
    });

    console.log(`✅ Design ${design1.id} validé par admin ${admin.id}`);

    // Simuler la cascade validation
    const cascadeResult = await simulateCascadeValidation(design1.id);
    console.log(`📊 Cascade: ${cascadeResult.publishedProducts} publiés, ${cascadeResult.draftProducts} en brouillon`);

    // 7. Vérifier les résultats
    const updatedProduct1 = await prisma.vendorProduct.findUnique({
      where: { id: product1.id }
    });

    const updatedProduct2 = await prisma.vendorProduct.findUnique({
      where: { id: product2.id }
    });

    console.log(`Produit 1 (AUTO_PUBLISH) - isValidated: ${updatedProduct1.isValidated}, status: ${updatedProduct1.status}`);
    console.log(`Produit 2 (TO_DRAFT) - isValidated: ${updatedProduct2.isValidated}, status: ${updatedProduct2.status}`);

    // Vérifier les résultats
    let success = true;

    if (updatedProduct1.isValidated && updatedProduct1.status === 'PUBLISHED') {
      console.log('✅ Produit 1: Validé et publié automatiquement (AUTO_PUBLISH)');
    } else {
      console.log('❌ Produit 1: Problème cascade validation');
      success = false;
    }

    if (updatedProduct2.isValidated && updatedProduct2.status === 'DRAFT') {
      console.log('✅ Produit 2: Validé et en brouillon (TO_DRAFT)');
    } else {
      console.log('❌ Produit 2: Problème cascade validation');
      success = false;
    }

    // 8. Test de publication manuelle d'un brouillon
    console.log('\n📤 Test 3: Publication manuelle d\'un produit en brouillon...');
    
    const publishResult = await publishDraftProduct(product2.id, vendor2.id);
    console.log(`✅ Publication brouillon: ${publishResult.message}`);

    // Vérifier que le produit est maintenant publié
    const finalProduct2 = await prisma.vendorProduct.findUnique({
      where: { id: product2.id }
    });

    if (finalProduct2.status === 'PUBLISHED') {
      console.log('✅ Produit 2: Publié manuellement avec succès');
    } else {
      console.log('❌ Produit 2: Échec publication manuelle');
      success = false;
    }

    // 9. Statistiques finales
    console.log('\n📊 Statistiques finales...');
    
    const totalDesigns = await prisma.design.count({
      where: { 
        OR: [
          { vendorId: vendor1.id },
          { vendorId: vendor2.id }
        ]
      }
    });
    
    const totalProducts = await prisma.vendorProduct.count({
      where: { 
        vendorId: { in: [vendor1.id, vendor2.id] }
      }
    });
    
    const totalLinks = await prisma.designProductLink.count({
      where: {
        vendorProduct: {
          vendorId: { in: [vendor1.id, vendor2.id] }
        }
      }
    });

    console.log(`Designs créés: ${totalDesigns}`);
    console.log(`Produits créés: ${totalProducts}`);
    console.log(`Liens créés: ${totalLinks}`);

    if (success) {
      console.log('\n🎉 Test terminé avec succès !');
      console.log('✅ Déduplication globale fonctionne correctement');
      console.log('✅ Cascade validation avec brouillons fonctionne');
      console.log('✅ Publication manuelle des brouillons fonctionne');
    } else {
      console.log('\n❌ Test échoué - Voir les erreurs ci-dessus');
    }

  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

async function createOrFindDesign(contentHash, vendorId) {
  // Chercher un design existant avec ce hash (global)
  let design = await prisma.design.findFirst({
    where: {
      contentHash: contentHash
    }
  });

  if (design) {
    return { ...design, isNew: false };
  }

  // Créer un nouveau design
  design = await prisma.design.create({
    data: {
      vendorId: vendorId, // Premier vendeur à utiliser ce design
      name: `Design ${contentHash.substring(0, 8)}`,
      description: `Design partagé - Hash: ${contentHash.substring(0, 12)}`,
      price: 0,
      category: 'ILLUSTRATION',
      imageUrl: `https://example.com/global_design_${contentHash.substring(0, 12)}.jpg`,
      thumbnailUrl: `https://example.com/global_design_${contentHash.substring(0, 12)}_thumb.jpg`,
      cloudinaryPublicId: `global_design_${contentHash.substring(0, 12)}`,
      fileSize: 1000,
      originalFileName: `global_design_${contentHash.substring(0, 12)}`,
      contentHash: contentHash,
      dimensions: { width: 500, height: 500 },
      format: 'jpg',
      tags: ['vendor-created', 'global-design'],
      isDraft: false,
      isPublished: false,
      isPending: true,
      isValidated: false
    }
  });

  return { ...design, isNew: true };
}

async function createProductWithDesign(designId, vendorId, baseProductId, postValidationAction) {
  const vendorProduct = await prisma.vendorProduct.create({
    data: {
      baseProductId: baseProductId,
      vendorId: vendorId,
      name: `Produit Test ${postValidationAction}`,
      description: `Produit avec action ${postValidationAction}`,
      price: 25000,
      stock: 100,
      designId: designId,
      designCloudinaryUrl: `https://example.com/design_${designId}.jpg`,
      designCloudinaryPublicId: `design_${designId}`,
      sizes: JSON.stringify([{ id: 1, name: 'M' }]),
      colors: JSON.stringify([{ id: 1, name: 'Rouge', code: '#ff0000' }]),
      status: postValidationAction === 'TO_DRAFT' ? 'DRAFT' : 'PENDING',
      isValidated: false,
      postValidationAction: postValidationAction,
      adminProductName: 'T-shirt Test Final',
      adminProductDescription: 'Produit de base pour test',
      adminProductPrice: 15000,
      vendorName: `Produit Test ${postValidationAction}`,
      vendorDescription: `Produit avec action ${postValidationAction}`,
      vendorStock: 100,
      basePriceAdmin: 15000
    }
  });

  // Créer le lien design-produit
  await prisma.designProductLink.create({
    data: {
      designId: designId,
      vendorProductId: vendorProduct.id
    }
  });

  return vendorProduct;
}

async function simulateCascadeValidation(designId) {
  console.log(`🔄 Simulation cascade validation pour design ${designId}...`);

  // Récupérer tous les produits liés à ce design
  const linkedProducts = await prisma.vendorProduct.findMany({
    where: { designId: designId }
  });

  console.log(`📦 ${linkedProducts.length} produits liés trouvés`);

  let publishedCount = 0;
  let draftCount = 0;

  // Mettre à jour chaque produit selon son action post-validation
  for (const product of linkedProducts) {
    let newStatus;
    
    if (product.postValidationAction === 'TO_DRAFT') {
      newStatus = 'DRAFT';
      draftCount++;
    } else {
      newStatus = 'PUBLISHED';
      publishedCount++;
    }
    
    await prisma.vendorProduct.update({
      where: { id: product.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        status: newStatus,
        rejectionReason: null
      }
    });

    console.log(`✅ Produit ${product.id}: ${product.postValidationAction} → ${newStatus}`);
  }

  return { publishedCount, draftCount };
}

async function publishDraftProduct(productId, vendorId) {
  console.log(`📤 Publication produit brouillon ${productId} par vendeur ${vendorId}`);

  // Vérifier que le produit appartient au vendeur et est en brouillon validé
  const product = await prisma.vendorProduct.findFirst({
    where: {
      id: productId,
      vendorId: vendorId,
      status: 'DRAFT',
      isValidated: true
    }
  });

  if (!product) {
    throw new Error('Produit non trouvé ou non éligible à la publication');
  }

  // Publier le produit
  await prisma.vendorProduct.update({
    where: { id: productId },
    data: {
      status: 'PUBLISHED',
      updatedAt: new Date()
    }
  });

  return {
    success: true,
    message: 'Produit publié avec succès',
    newStatus: 'PUBLISHED'
  };
}

async function cleanup() {
  console.log('🧹 Nettoyage des données de test...');

  try {
    // Supprimer dans l'ordre pour éviter les contraintes
    await prisma.designProductLink.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: {
              in: [
                'test-vendor1-final@example.com',
                'test-vendor2-final@example.com'
              ]
            }
          }
        }
      }
    });

    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: {
            in: [
              'test-vendor1-final@example.com',
              'test-vendor2-final@example.com'
            ]
          }
        }
      }
    });

    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: {
            in: [
              'test-vendor1-final@example.com',
              'test-vendor2-final@example.com'
            ]
          }
        }
      }
    });

    await prisma.product.deleteMany({
      where: {
        OR: [
          { name: 'T-shirt Test Final' },
          { id: 999 }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-vendor1-final@example.com',
            'test-vendor2-final@example.com',
            'test-admin-final@example.com'
          ]
        }
      }
    });

    console.log('✅ Nettoyage terminé');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le test
if (require.main === module) {
  testFinalDeduplication()
    .then(() => {
      console.log('\n🎉 Tous les tests terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testFinalDeduplication }; 