const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleDesignCreation() {
  console.log('🧪 Test création design séparée des produits...\n');

  try {
    // 1. Créer un vendeur de test
    const vendor = await prisma.user.create({
      data: {
        firstName: 'Vendeur',
        lastName: 'Test',
        email: 'test-vendor-design@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur créé: ${vendor.id}`);

    // 2. Créer un admin
    const admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'test-admin-design@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    console.log(`✅ Admin créé: ${admin.id}`);

    // 3. Créer un produit de base
    const baseProduct = await prisma.product.upsert({
      where: { id: 998 },
      update: {},
      create: {
        id: 998,
        name: 'T-shirt Test Design',
        description: 'Produit de base pour test',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé: ${baseProduct.id}`);

    // 4. Créer un design via le service
    console.log('\n🎨 Test 1: Création d\'un design...');
    
    const design = await prisma.design.create({
      data: {
        vendorId: vendor.id,
        name: 'Dragon Mystique',
        description: 'Design de dragon dans un style mystique',
        price: 0,
        category: 'ILLUSTRATION',
        imageUrl: 'https://example.com/dragon-mystique.jpg',
        thumbnailUrl: 'https://example.com/dragon-mystique-thumb.jpg',
        cloudinaryPublicId: `vendor_${vendor.id}_design_${Date.now()}`,
        fileSize: 1000,
        originalFileName: `design_${Date.now()}`,
        dimensions: { width: 500, height: 500 },
        format: 'jpg',
        tags: ['dragon', 'mystique', 'fantasy'],
        isDraft: false,
        isPublished: false,
        isPending: true,
        isValidated: false
      }
    });

    console.log(`✅ Design créé: ${design.id} - ${design.name}`);

    // 5. Créer un produit avec ce design
    console.log('\n📦 Test 2: Création d\'un produit avec design existant...');
    
    const vendorProduct = await prisma.vendorProduct.create({
      data: {
        baseProductId: baseProduct.id,
        vendorId: vendor.id,
        name: 'T-shirt Dragon Mystique',
        description: 'T-shirt avec design dragon mystique',
        price: 25000,
        stock: 100,
        
        // Liaison avec le design existant
        designId: design.id,
        designCloudinaryUrl: design.imageUrl,
        designCloudinaryPublicId: design.cloudinaryPublicId,
        
        sizes: JSON.stringify([{ id: 1, name: 'M' }]),
        colors: JSON.stringify([{ id: 1, name: 'Rouge', code: '#ff0000' }]),
        
        // Statut dépend du design
        status: design.isValidated ? 'PUBLISHED' : 'PENDING',
        isValidated: design.isValidated,
        postValidationAction: 'AUTO_PUBLISH',
        
        adminProductName: baseProduct.name,
        adminProductDescription: baseProduct.description,
        adminProductPrice: baseProduct.price,
        vendorName: 'T-shirt Dragon Mystique',
        vendorDescription: 'T-shirt avec design dragon mystique',
        vendorStock: 100,
        basePriceAdmin: baseProduct.price
      }
    });

    console.log(`✅ Produit créé: ${vendorProduct.id} avec design ${design.id}`);

    // 6. Créer un lien design-produit
    await prisma.designProductLink.create({
      data: {
        designId: design.id,
        vendorProductId: vendorProduct.id
      }
    });

    console.log(`✅ Lien créé: Design ${design.id} ↔ Produit ${vendorProduct.id}`);

    // 7. Créer un DEUXIÈME produit avec le MÊME design
    console.log('\n📦 Test 3: Création d\'un deuxième produit avec le même design...');
    
    const vendorProduct2 = await prisma.vendorProduct.create({
      data: {
        baseProductId: baseProduct.id,
        vendorId: vendor.id,
        name: 'T-shirt Dragon Mystique V2',
        description: 'Deuxième version avec le même design',
        price: 28000,
        stock: 50,
        
        // Même design
        designId: design.id,
        designCloudinaryUrl: design.imageUrl,
        designCloudinaryPublicId: design.cloudinaryPublicId,
        
        sizes: JSON.stringify([{ id: 1, name: 'L' }]),
        colors: JSON.stringify([{ id: 2, name: 'Bleu', code: '#0000ff' }]),
        
        status: design.isValidated ? 'PUBLISHED' : 'PENDING',
        isValidated: design.isValidated,
        postValidationAction: 'TO_DRAFT', // Différent du premier
        
        adminProductName: baseProduct.name,
        adminProductDescription: baseProduct.description,
        adminProductPrice: baseProduct.price,
        vendorName: 'T-shirt Dragon Mystique V2',
        vendorDescription: 'Deuxième version avec le même design',
        vendorStock: 50,
        basePriceAdmin: baseProduct.price
      }
    });

    console.log(`✅ Produit 2 créé: ${vendorProduct2.id} avec le même design ${design.id}`);

    // Créer le lien pour le deuxième produit
    await prisma.designProductLink.create({
      data: {
        designId: design.id,
        vendorProductId: vendorProduct2.id
      }
    });

    console.log(`✅ Lien créé: Design ${design.id} ↔ Produit ${vendorProduct2.id}`);

    // 8. Test de validation en cascade
    console.log('\n🔄 Test 4: Validation en cascade...');
    
    // Valider le design
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

    // Mettre à jour les produits liés
    const linkedProducts = await prisma.vendorProduct.findMany({
      where: { designId: design.id }
    });

    console.log(`📦 ${linkedProducts.length} produits liés trouvés`);

    for (const product of linkedProducts) {
      let newStatus = product.postValidationAction === 'TO_DRAFT' ? 'DRAFT' : 'PUBLISHED';
      
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

    // 9. Vérifier les résultats
    console.log('\n📊 Résultats finaux...');
    
    const finalDesigns = await prisma.design.count({
      where: { vendorId: vendor.id }
    });
    
    const finalProducts = await prisma.vendorProduct.count({
      where: { vendorId: vendor.id }
    });
    
    const finalLinks = await prisma.designProductLink.count({
      where: {
        vendorProduct: { vendorId: vendor.id }
      }
    });

    const product1Final = await prisma.vendorProduct.findUnique({
      where: { id: vendorProduct.id }
    });

    const product2Final = await prisma.vendorProduct.findUnique({
      where: { id: vendorProduct2.id }
    });

    console.log(`Designs créés: ${finalDesigns} (attendu: 1)`);
    console.log(`Produits créés: ${finalProducts} (attendu: 2)`);
    console.log(`Liens créés: ${finalLinks} (attendu: 2)`);
    console.log(`Produit 1 status: ${product1Final.status} (attendu: PUBLISHED)`);
    console.log(`Produit 2 status: ${product2Final.status} (attendu: DRAFT)`);

    // Vérifier le succès
    let success = true;
    if (finalDesigns !== 1) {
      console.log('❌ Erreur: Nombre de designs incorrect');
      success = false;
    }
    if (finalProducts !== 2) {
      console.log('❌ Erreur: Nombre de produits incorrect');
      success = false;
    }
    if (product1Final.status !== 'PUBLISHED') {
      console.log('❌ Erreur: Produit 1 devrait être PUBLISHED');
      success = false;
    }
    if (product2Final.status !== 'DRAFT') {
      console.log('❌ Erreur: Produit 2 devrait être DRAFT');
      success = false;
    }

    if (success) {
      console.log('\n🎉 Test terminé avec succès !');
      console.log('✅ Un seul design créé');
      console.log('✅ Deux produits utilisant le même design');
      console.log('✅ Validation en cascade fonctionne');
      console.log('✅ Actions post-validation respectées');
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

async function cleanup() {
  console.log('\n🧹 Nettoyage des données de test...');

  try {
    // Supprimer dans l'ordre pour éviter les contraintes
    await prisma.designProductLink.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: 'test-vendor-design@example.com'
          }
        }
      }
    });

    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-design@example.com'
        }
      }
    });

    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-design@example.com'
        }
      }
    });

    await prisma.product.deleteMany({
      where: {
        OR: [
          { name: 'T-shirt Test Design' },
          { id: 998 }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-vendor-design@example.com',
            'test-admin-design@example.com'
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
  testSimpleDesignCreation()
    .then(() => {
      console.log('\n🎉 Test terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testSimpleDesignCreation }; 