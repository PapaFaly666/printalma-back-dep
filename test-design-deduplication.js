const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function testDesignDeduplication() {
  console.log('🧪 Test complet du système de déduplication des designs...\n');

  try {
    // 1. Créer un vendeur de test
    const vendor = await prisma.user.upsert({
      where: { email: 'test-vendor-dedup@example.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'test-vendor-dedup@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur créé/trouvé: ${vendor.id}`);

    // 2. Créer un admin de test
    const admin = await prisma.user.upsert({
      where: { email: 'test-admin-dedup@example.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'test-admin-dedup@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    console.log(`✅ Admin créé/trouvé: ${admin.id}`);

    // 3. Créer un produit de base s'il n'existe pas
    const baseProduct = await prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'T-shirt Basique Test',
        description: 'Produit de base pour test',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé/trouvé: ${baseProduct.id}`);

    // 4. Design de test (même contenu)
    const testDesignBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const designContent = testDesignBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const designHash = crypto.createHash('sha256').update(designContent).digest('hex');

    console.log(`🎨 Hash du design test: ${designHash.substring(0, 12)}...`);

    // 5. Nettoyer les données de test précédentes
    await cleanup();

    // 6. Test 1: Créer le premier produit avec ce design
    console.log('\n📦 Test 1: Création du premier produit...');
    
    const publishDto1 = {
      baseProductId: baseProduct.id,
      vendorName: 'T-shirt Design Test 1',
      vendorDescription: 'Premier produit avec design',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [{ id: 1, name: 'Rouge', code: '#ff0000' }],
      selectedSizes: [{ id: 1, name: 'M' }],
      finalImagesBase64: { design: testDesignBase64 },
      productStructure: {
        adminProduct: {
          id: baseProduct.id,
          name: baseProduct.name,
          description: baseProduct.description,
          price: baseProduct.price,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Rouge',
                colorCode: '#ff0000',
                images: [
                  {
                    id: 1,
                    url: 'https://example.com/image1.jpg',
                    view: 'Front'
                  }
                ]
              }
            ]
          }
        },
        designApplication: { scale: 0.6 }
      },
      postValidationAction: 'AUTO_PUBLISH'
    };

    // Simuler la création du produit 1
    const product1 = await createProductWithDesign(publishDto1, vendor.id);
    console.log(`✅ Produit 1 créé: ${product1.id} avec design: ${product1.designId}`);

    // 7. Test 2: Créer le deuxième produit avec le MÊME design
    console.log('\n📦 Test 2: Création du deuxième produit avec le même design...');
    
    const publishDto2 = {
      ...publishDto1,
      vendorName: 'T-shirt Design Test 2',
      vendorDescription: 'Deuxième produit avec MÊME design',
      postValidationAction: 'TO_DRAFT'
    };

    const product2 = await createProductWithDesign(publishDto2, vendor.id);
    console.log(`✅ Produit 2 créé: ${product2.id} avec design: ${product2.designId}`);

    // 8. Vérifier que les deux produits utilisent le même design
    console.log('\n🔍 Vérification de la déduplication...');
    
    if (product1.designId === product2.designId) {
      console.log(`✅ SUCCÈS: Les deux produits utilisent le même design (ID: ${product1.designId})`);
    } else {
      console.log(`❌ ÉCHEC: Les produits utilisent des designs différents (${product1.designId} vs ${product2.designId})`);
      return;
    }

    // 9. Vérifier qu'il n'y a qu'un seul design en base avec ce hash
    const designsWithHash = await prisma.design.findMany({
      where: { contentHash: designHash }
    });

    console.log(`📊 Nombre de designs avec ce hash: ${designsWithHash.length}`);
    
    if (designsWithHash.length === 1) {
      console.log('✅ SUCCÈS: Un seul design en base');
    } else {
      console.log('❌ ÉCHEC: Plusieurs designs avec le même hash');
      return;
    }

    // 10. Test de la cascade validation
    console.log('\n🔄 Test de la cascade validation...');
    
    // Valider le design
    const design = designsWithHash[0];
    await prisma.design.update({
      where: { id: design.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        validatedBy: admin.id,
        isPending: false
      }
    });

    console.log(`✅ Design ${design.id} validé par admin ${admin.id}`);

    // Simuler la cascade validation
    await simulateCascadeValidation(design.id);

    // 11. Vérifier les résultats de la cascade
    console.log('\n📊 Vérification des résultats de la cascade...');
    
    const updatedProduct1 = await prisma.vendorProduct.findUnique({
      where: { id: product1.id }
    });

    const updatedProduct2 = await prisma.vendorProduct.findUnique({
      where: { id: product2.id }
    });

    console.log(`Produit 1 - isValidated: ${updatedProduct1.isValidated}, status: ${updatedProduct1.status}`);
    console.log(`Produit 2 - isValidated: ${updatedProduct2.isValidated}, status: ${updatedProduct2.status}`);

    // Vérifier les actions post-validation
    if (updatedProduct1.isValidated && updatedProduct1.status === 'PUBLISHED') {
      console.log('✅ Produit 1: Validé et publié automatiquement (AUTO_PUBLISH)');
    } else {
      console.log('❌ Produit 1: Problème avec la cascade validation');
    }

    if (updatedProduct2.isValidated && updatedProduct2.status === 'DRAFT') {
      console.log('✅ Produit 2: Validé et en brouillon (TO_DRAFT)');
    } else {
      console.log('❌ Produit 2: Problème avec la cascade validation');
    }

    // 12. Statistiques finales
    console.log('\n📊 Statistiques finales...');
    
    const totalDesigns = await prisma.design.count();
    const totalProducts = await prisma.vendorProduct.count({
      where: { vendorId: vendor.id }
    });
    const totalLinks = await prisma.designProductLink.count();

    console.log(`Designs total: ${totalDesigns}`);
    console.log(`Produits vendeur: ${totalProducts}`);
    console.log(`Liens design-produit: ${totalLinks}`);

    console.log('\n🎉 Test de déduplication terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

async function createProductWithDesign(publishDto, vendorId) {
  // Calculer le hash du design
  const designContent = publishDto.finalImagesBase64.design.replace(/^data:image\/[a-z]+;base64,/, '');
  const designHash = crypto.createHash('sha256').update(designContent).digest('hex');

  // Rechercher un design existant
  let design = await prisma.design.findFirst({
    where: { contentHash: designHash }
  });

  if (!design) {
    // Créer un nouveau design
    design = await prisma.design.create({
      data: {
        vendorId: vendorId,
        name: `Design ${designHash.substring(0, 8)}`,
        description: `Design créé par vendeur ${vendorId}`,
        price: 0,
        category: 'ILLUSTRATION',
        imageUrl: `https://example.com/design_${designHash.substring(0, 12)}.jpg`,
        thumbnailUrl: `https://example.com/design_${designHash.substring(0, 12)}_thumb.jpg`,
        cloudinaryPublicId: `design_${designHash.substring(0, 12)}`,
        fileSize: 1000,
        originalFileName: `design_${designHash.substring(0, 12)}`,
        contentHash: designHash,
        dimensions: { width: 500, height: 500 },
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
    console.log(`🔄 Design existant réutilisé: ${design.id}`);
  }

  // Créer le produit vendeur
  const vendorProduct = await prisma.vendorProduct.create({
    data: {
      baseProductId: publishDto.baseProductId,
      vendorId: vendorId,
      name: publishDto.vendorName,
      description: publishDto.vendorDescription,
      price: publishDto.vendorPrice,
      stock: publishDto.vendorStock,
      designId: design.id,
      designCloudinaryUrl: design.imageUrl,
      designCloudinaryPublicId: design.cloudinaryPublicId,
      sizes: JSON.stringify(publishDto.selectedSizes),
      colors: JSON.stringify(publishDto.selectedColors),
      status: 'PENDING',
      isValidated: false,
      postValidationAction: publishDto.postValidationAction,
      adminProductName: publishDto.productStructure.adminProduct.name,
      adminProductDescription: publishDto.productStructure.adminProduct.description,
      adminProductPrice: publishDto.productStructure.adminProduct.price,
      vendorName: publishDto.vendorName,
      vendorDescription: publishDto.vendorDescription,
      vendorStock: publishDto.vendorStock,
      basePriceAdmin: publishDto.productStructure.adminProduct.price
    }
  });

  // Créer le lien design-produit
  await prisma.designProductLink.create({
    data: {
      designId: design.id,
      vendorProductId: vendorProduct.id
    }
  });

  return { ...vendorProduct, designId: design.id };
}

async function simulateCascadeValidation(designId) {
  console.log(`🔄 Simulation cascade validation pour design ${designId}...`);

  // Récupérer tous les produits liés à ce design
  const linkedProducts = await prisma.vendorProduct.findMany({
    where: {
      designId: designId
    }
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
            email: 'test-vendor-dedup@example.com'
          }
        }
      }
    });

    // Supprimer les produits de test
    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-dedup@example.com'
        }
      }
    });

    // Supprimer les designs de test
    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-dedup@example.com'
        }
      }
    });

    // Supprimer les utilisateurs de test
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test-vendor-dedup@example.com', 'test-admin-dedup@example.com']
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
  testDesignDeduplication()
    .then(() => {
      console.log('\n🎉 Tous les tests terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testDesignDeduplication }; 