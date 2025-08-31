const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testSimpleDeduplication() {
  console.log('🧪 Test simple de déduplication des designs...\n');

  try {
    // 1. Créer un vendeur de test
    const vendor = await prisma.user.upsert({
      where: { email: 'test-vendor-simple@example.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'test-vendor-simple@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur créé: ${vendor.id}`);

    // 2. Créer un produit de base
    const baseProduct = await prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'T-shirt Test',
        description: 'Produit de base pour test',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé: ${baseProduct.id}`);

    // 3. Design de test
    const testDesignBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const designContent = testDesignBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const designHash = crypto.createHash('sha256').update(designContent).digest('hex');

    console.log(`🎨 Hash du design: ${designHash.substring(0, 12)}...`);

    // 4. Nettoyer les données précédentes
    await cleanup();

    // 5. Test 1: Créer le premier design
    console.log('\n📦 Test 1: Création du premier design...');
    
    const design1 = await createDesignWithHash(designHash, vendor.id);
    console.log(`✅ Design 1 créé: ${design1.id}`);

    // 6. Test 2: Essayer de créer le même design (doit être réutilisé)
    console.log('\n📦 Test 2: Tentative de création du même design...');
    
    const design2 = await createDesignWithHash(designHash, vendor.id);
    
    if (design1.id === design2.id) {
      console.log(`✅ SUCCÈS: Design réutilisé (ID: ${design1.id})`);
    } else {
      console.log(`❌ ÉCHEC: Nouveau design créé (${design1.id} vs ${design2.id})`);
    }

    // 7. Vérifier qu'il n'y a qu'un seul design avec ce hash
    const designsWithHash = await prisma.design.findMany({
      where: { contentHash: designHash }
    });

    console.log(`📊 Nombre de designs avec ce hash: ${designsWithHash.length}`);

    // 8. Test de création de produits avec ce design
    console.log('\n📦 Test 3: Création de produits avec le design...');
    
    const product1 = await createProductWithDesign(design1.id, vendor.id, baseProduct.id, 'AUTO_PUBLISH');
    const product2 = await createProductWithDesign(design1.id, vendor.id, baseProduct.id, 'TO_DRAFT');
    
    console.log(`✅ Produit 1 créé: ${product1.id} (AUTO_PUBLISH)`);
    console.log(`✅ Produit 2 créé: ${product2.id} (TO_DRAFT)`);

    // 9. Test de cascade validation
    console.log('\n🔄 Test 4: Cascade validation...');
    
    // Valider le design
    await prisma.design.update({
      where: { id: design1.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        isPending: false
      }
    });

    // Simuler la cascade
    await simulateCascadeValidation(design1.id);

    // 10. Vérifier les résultats
    const updatedProduct1 = await prisma.vendorProduct.findUnique({
      where: { id: product1.id }
    });

    const updatedProduct2 = await prisma.vendorProduct.findUnique({
      where: { id: product2.id }
    });

    console.log(`Produit 1 - isValidated: ${updatedProduct1.isValidated}, status: ${updatedProduct1.status}`);
    console.log(`Produit 2 - isValidated: ${updatedProduct2.isValidated}, status: ${updatedProduct2.status}`);

    if (updatedProduct1.isValidated && updatedProduct1.status === 'PUBLISHED') {
      console.log('✅ Produit 1: Validé et publié (AUTO_PUBLISH)');
    } else {
      console.log('❌ Produit 1: Problème cascade validation');
    }

    if (updatedProduct2.isValidated && updatedProduct2.status === 'DRAFT') {
      console.log('✅ Produit 2: Validé et en brouillon (TO_DRAFT)');
    } else {
      console.log('❌ Produit 2: Problème cascade validation');
    }

    console.log('\n🎉 Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

async function createDesignWithHash(contentHash, vendorId) {
  // Chercher un design existant
  let design = await prisma.design.findFirst({
    where: { contentHash: contentHash }
  });

  if (!design) {
    // Créer un nouveau design
    design = await prisma.design.create({
      data: {
        vendorId: vendorId,
        name: `Design ${contentHash.substring(0, 8)}`,
        description: `Design créé par vendeur ${vendorId}`,
        price: 0,
        category: 'ILLUSTRATION',
        imageUrl: `https://example.com/design_${contentHash.substring(0, 12)}.jpg`,
        thumbnailUrl: `https://example.com/design_${contentHash.substring(0, 12)}_thumb.jpg`,
        cloudinaryPublicId: `design_${contentHash.substring(0, 12)}`,
        fileSize: 1000,
        originalFileName: `design_${contentHash.substring(0, 12)}`,
        contentHash: contentHash,
        dimensions: JSON.stringify({ width: 500, height: 500 }), // Utiliser JSON.stringify
        format: 'jpg',
        tags: ['test'],
        isDraft: false,
        isPublished: false,
        isPending: true,
        isValidated: false
      }
    });
    console.log(`🎨 Nouveau design créé: ${design.id}`);
  } else {
    console.log(`🔄 Design existant trouvé: ${design.id}`);
  }

  return design;
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
      status: 'PENDING',
      isValidated: false,
      postValidationAction: postValidationAction,
      adminProductName: 'T-shirt Test',
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

  // Mettre à jour chaque produit selon son action post-validation
  for (const product of linkedProducts) {
    const newStatus = product.postValidationAction === 'AUTO_PUBLISH' ? 'PUBLISHED' : 'DRAFT';
    
    await prisma.vendorProduct.update({
      where: { id: product.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        status: newStatus
      }
    });

    console.log(`✅ Produit ${product.id}: ${product.postValidationAction} → ${newStatus}`);
  }
}

async function cleanup() {
  console.log('🧹 Nettoyage des données de test...');

  try {
    // Supprimer les liens
    await prisma.designProductLink.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: 'test-vendor-simple@example.com'
          }
        }
      }
    });

    // Supprimer les produits de test
    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-simple@example.com'
        }
      }
    });

    // Supprimer les designs de test
    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-simple@example.com'
        }
      }
    });

    // Supprimer les utilisateurs de test
    await prisma.user.deleteMany({
      where: {
        email: 'test-vendor-simple@example.com'
      }
    });

    console.log('✅ Nettoyage terminé');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le test
if (require.main === module) {
  testSimpleDeduplication()
    .then(() => {
      console.log('\n🎉 Tous les tests terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testSimpleDeduplication }; 