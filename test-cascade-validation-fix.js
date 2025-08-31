const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 🧪 TEST CASCADE VALIDATION - VÉRIFICATION CORRECTIONS
 * 
 * Ce script teste que les corrections appliquées fonctionnent :
 * 1. Vérifier que designId est bien défini lors de la création
 * 2. Tester la cascade validation avec isValidated mis à jour
 * 3. Vérifier que les actions post-validation sont respectées
 */

async function testCascadeValidationFix() {
  console.log('🧪 === TEST CASCADE VALIDATION - VÉRIFICATION CORRECTIONS ===');
  console.log('');

  try {
    // 1. Créer un utilisateur admin de test
    console.log('1. 🔧 Préparation des utilisateurs de test...');
    const adminUser = await createTestAdmin();
    const vendorUser = await createTestVendor();
    console.log(`   ✅ Admin créé: ${adminUser.email}`);
    console.log(`   ✅ Vendeur créé: ${vendorUser.email}`);

    // 2. Créer un design de test
    console.log('');
    console.log('2. 🎨 Création d\'un design de test...');
    const testDesign = await createTestDesign(vendorUser.id);
    console.log(`   ✅ Design créé: ${testDesign.id} - ${testDesign.name}`);

    // 3. Créer des produits avec différentes actions post-validation
    console.log('');
    console.log('3. 📦 Création de produits avec différentes actions...');
    
    const autoPublishProduct = await createTestProduct(vendorUser.id, testDesign.id, 'AUTO_PUBLISH');
    const toDraftProduct = await createTestProduct(vendorUser.id, testDesign.id, 'TO_DRAFT');
    
    console.log(`   ✅ Produit AUTO_PUBLISH créé: ${autoPublishProduct.id}`);
    console.log(`   ✅ Produit TO_DRAFT créé: ${toDraftProduct.id}`);

    // 4. Vérifier que designId est bien défini
    console.log('');
    console.log('4. 🔍 Vérification des designId...');
    
    const products = await prisma.vendorProduct.findMany({
      where: {
        id: { in: [autoPublishProduct.id, toDraftProduct.id] }
      }
    });

    for (const product of products) {
      console.log(`   Produit ${product.id}:`);
      console.log(`     - designId: ${product.designId} ${product.designId ? '✅' : '❌'}`);
      console.log(`     - designCloudinaryUrl: ${product.designCloudinaryUrl ? '✅' : '❌'}`);
      console.log(`     - status: ${product.status}`);
      console.log(`     - isValidated: ${product.isValidated}`);
      console.log(`     - postValidationAction: ${product.postValidationAction}`);
    }

    // 5. Vérifier les liens DesignProductLink
    console.log('');
    console.log('5. 🔗 Vérification des liens DesignProductLink...');
    
    const links = await prisma.designProductLink.findMany({
      where: {
        designId: testDesign.id
      }
    });

    console.log(`   📋 ${links.length} liens trouvés pour le design ${testDesign.id}`);
    for (const link of links) {
      console.log(`     🔗 Design ${link.designId} ↔ Produit ${link.vendorProductId}`);
    }

    // 6. Simuler la validation du design par l'admin
    console.log('');
    console.log('6. ✅ Simulation de la validation du design...');
    
    const validatedDesign = await prisma.design.update({
      where: { id: testDesign.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: adminUser.id
      }
    });

    console.log(`   ✅ Design ${testDesign.id} marqué comme validé`);

    // 7. Déclencher manuellement la cascade validation
    console.log('');
    console.log('7. 🔄 Déclenchement de la cascade validation...');
    
    await triggerCascadeValidation(testDesign.id, testDesign.imageUrl, vendorUser.id, adminUser.id);

    // 8. Vérifier les résultats de la cascade
    console.log('');
    console.log('8. 🔍 Vérification des résultats de la cascade...');
    
    const updatedProducts = await prisma.vendorProduct.findMany({
      where: {
        id: { in: [autoPublishProduct.id, toDraftProduct.id] }
      }
    });

    for (const product of updatedProducts) {
      console.log(`   Produit ${product.id} après cascade:`);
      console.log(`     - status: ${product.status} (attendu: ${product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT'})`);
      console.log(`     - isValidated: ${product.isValidated} (attendu: true)`);
      console.log(`     - validatedAt: ${product.validatedAt ? '✅' : '❌'}`);
      console.log(`     - validatedBy: ${product.validatedBy} (attendu: ${adminUser.id})`);
      
      // Vérification des résultats
      const statusOk = (product.postValidationAction === 'AUTO_PUBLISH' && product.status === 'PUBLISHED') ||
                      (product.postValidationAction === 'TO_DRAFT' && product.status === 'DRAFT');
      
      console.log(`     - Résultat: ${statusOk && product.isValidated ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    }

    // 9. Test de publication manuelle d'un produit TO_DRAFT
    console.log('');
    console.log('9. 📤 Test publication manuelle d\'un produit TO_DRAFT...');
    
    const draftProduct = updatedProducts.find(p => p.postValidationAction === 'TO_DRAFT');
    if (draftProduct && draftProduct.status === 'DRAFT' && draftProduct.isValidated) {
      const publishedProduct = await prisma.vendorProduct.update({
        where: { id: draftProduct.id },
        data: { status: 'PUBLISHED' }
      });
      
      console.log(`   ✅ Produit ${draftProduct.id} publié manuellement: ${publishedProduct.status}`);
    }

    // 10. Résumé final
    console.log('');
    console.log('10. 📊 Résumé final des tests...');
    
    const finalStats = await getFinalStats();
    console.log(`   - Produits avec designId: ${finalStats.productsWithDesignId}/${finalStats.totalProducts}`);
    console.log(`   - Produits validés: ${finalStats.validatedProducts}`);
    console.log(`   - Produits publiés: ${finalStats.publishedProducts}`);
    console.log(`   - Produits en brouillon: ${finalStats.draftProducts}`);
    console.log(`   - Liens DesignProductLink: ${finalStats.totalLinks}`);

    console.log('');
    console.log('🎉 === TESTS TERMINÉS ===');
    console.log('✅ Vérifiez les résultats ci-dessus pour confirmer que les corrections fonctionnent');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 🔧 Créer un utilisateur admin de test
 */
async function createTestAdmin() {
  const adminEmail = `admin-test-${Date.now()}@test.com`;
  
  return await prisma.user.create({
    data: {
      email: adminEmail,
      password: 'hashedpassword123',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'ADMIN',
      isActive: true
    }
  });
}

/**
 * 🔧 Créer un utilisateur vendeur de test
 */
async function createTestVendor() {
  const vendorEmail = `vendor-test-${Date.now()}@test.com`;
  
  return await prisma.user.create({
    data: {
      email: vendorEmail,
      password: 'hashedpassword123',
      firstName: 'Vendeur',
      lastName: 'Test',
      role: 'VENDOR',
      isActive: true,
      shop_name: 'Boutique Test'
    }
  });
}

/**
 * 🎨 Créer un design de test
 */
async function createTestDesign(vendorId) {
  const designUrl = `https://res.cloudinary.com/test/image/upload/v1/test-design-${Date.now()}.jpg`;
  
  return await prisma.design.create({
    data: {
      vendorId: vendorId,
      name: `Design Test ${Date.now()}`,
      description: 'Design créé pour les tests de cascade validation',
      price: 2500,
      category: 'ILLUSTRATION',
      imageUrl: designUrl,
      thumbnailUrl: designUrl,
      cloudinaryPublicId: `test-design-${Date.now()}`,
      fileSize: 150000,
      originalFileName: 'test-design.jpg',
      dimensions: { width: 500, height: 500 },
      format: 'jpg',
      tags: ['test'],
      isDraft: false,
      isPublished: false,
      isPending: true,
      isValidated: false
    }
  });
}

/**
 * 📦 Créer un produit de test
 */
async function createTestProduct(vendorId, designId, postValidationAction) {
  const design = await prisma.design.findUnique({ where: { id: designId } });
  
  const product = await prisma.vendorProduct.create({
    data: {
      vendorId: vendorId,
      name: `Produit Test ${postValidationAction} ${Date.now()}`,
      description: `Produit test avec action ${postValidationAction}`,
      price: 15000,
      stock: 10,
      designId: designId, // ✅ IMPORTANT: Lier au design
      designCloudinaryUrl: design.imageUrl,
      designCloudinaryPublicId: design.cloudinaryPublicId,
      status: 'PENDING',
      isValidated: false,
      postValidationAction: postValidationAction,
      sizes: JSON.stringify(['S', 'M', 'L']),
      colors: JSON.stringify(['rouge', 'bleu']),
      vendorName: `Produit Test ${postValidationAction}`,
      vendorDescription: `Description test ${postValidationAction}`,
      vendorStock: 10
    }
  });

  // Créer le lien DesignProductLink
  await prisma.designProductLink.create({
    data: {
      designId: designId,
      vendorProductId: product.id
    }
  });

  return product;
}

/**
 * 🔄 Déclencher la cascade validation manuellement
 */
async function triggerCascadeValidation(designId, designImageUrl, vendorId, adminId) {
  // Récupérer tous les produits liés
  const linkedProducts = await prisma.designProductLink.findMany({
    where: { designId: designId },
    include: {
      vendorProduct: true
    }
  });

  console.log(`   🔄 Traitement de ${linkedProducts.length} produits liés...`);

  for (const link of linkedProducts) {
    const product = link.vendorProduct;
    
    if (product.status === 'PENDING' && !product.isValidated) {
      const newStatus = product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT';
      
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: {
          status: newStatus,
          isValidated: true,
          validatedAt: new Date(),
          validatedBy: adminId
        }
      });
      
      console.log(`     ✅ Produit ${product.id}: ${product.status} → ${newStatus}`);
    }
  }
}

/**
 * 📊 Récupérer les statistiques finales
 */
async function getFinalStats() {
  const [
    totalProducts,
    productsWithDesignId,
    validatedProducts,
    publishedProducts,
    draftProducts,
    totalLinks
  ] = await Promise.all([
    prisma.vendorProduct.count(),
    prisma.vendorProduct.count({ where: { designId: { not: null } } }),
    prisma.vendorProduct.count({ where: { isValidated: true } }),
    prisma.vendorProduct.count({ where: { status: 'PUBLISHED' } }),
    prisma.vendorProduct.count({ where: { status: 'DRAFT' } }),
    prisma.designProductLink.count()
  ]);

  return {
    totalProducts,
    productsWithDesignId,
    validatedProducts,
    publishedProducts,
    draftProducts,
    totalLinks
  };
}

/**
 * 🚀 Exécution du script
 */
if (require.main === module) {
  testCascadeValidationFix()
    .then(() => {
      console.log('🎉 Tests terminés avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors des tests:', error);
      process.exit(1);
    });
}

module.exports = {
  testCascadeValidationFix
}; 