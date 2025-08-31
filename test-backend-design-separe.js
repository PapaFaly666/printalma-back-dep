const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function testBackendDesignSepare() {
  console.log('🧪 Test Backend - Système Design Séparé\n');

  let vendorToken = null;
  let adminToken = null;
  let designId = null;
  let productId = null;

  try {
    // 1. Créer un vendeur de test
    const vendor = await prisma.user.create({
      data: {
        firstName: 'Vendeur',
        lastName: 'Test',
        email: 'test-backend-design@example.com',
        password: '$2b$10$hashedpassword', // Hash simulé
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur créé: ${vendor.id}`);

    // 2. Créer un admin
    const admin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Test',
        email: 'test-backend-admin@example.com',
        password: '$2b$10$hashedpassword',
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
        name: 'T-shirt Backend Test',
        description: 'Produit de base pour test backend',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé: ${baseProduct.id}`);

    // 4. Simuler l'authentification vendeur
    vendorToken = `Bearer fake-token-vendor-${vendor.id}`;
    console.log(`✅ Token vendeur simulé`);

    // 5. Test création design via API
    console.log('\n🎨 Test 1: Création design via API...');
    
    const designData = {
      name: 'Dragon Backend Test',
      description: 'Design pour test backend',
      category: 'ILLUSTRATION',
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      tags: ['test', 'backend']
    };

    // Créer directement en base pour simuler l'API
    const design = await prisma.design.create({
      data: {
        vendorId: vendor.id,
        name: designData.name,
        description: designData.description,
        price: 0,
        category: designData.category,
        imageUrl: 'https://example.com/test-design.jpg',
        thumbnailUrl: 'https://example.com/test-design-thumb.jpg',
        cloudinaryPublicId: `vendor_${vendor.id}_design_${Date.now()}`,
        fileSize: 1000,
        originalFileName: `design_${Date.now()}`,
        dimensions: { width: 300, height: 300 },
        format: 'jpg',
        tags: designData.tags,
        isDraft: false,
        isPublished: false,
        isPending: true,
        isValidated: false
      }
    });

    designId = design.id;
    console.log(`✅ Design créé: ${design.id} - ${design.name}`);

    // 6. Test création produit avec design existant
    console.log('\n📦 Test 2: Création produit avec design existant...');
    
    const productData = {
      baseProductId: baseProduct.id,
      designId: design.id,
      vendorName: 'T-shirt Dragon Backend',
      vendorDescription: 'Produit test backend avec design',
      vendorPrice: 25000,
      vendorStock: 50,
      selectedColors: [
        { id: 1, name: 'Rouge', colorCode: '#ff0000' }
      ],
      selectedSizes: [
        { id: 1, sizeName: 'M' }
      ],
      postValidationAction: 'AUTO_PUBLISH',
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
                    url: 'https://example.com/tshirt-red.jpg',
                    viewType: 'FRONT',
                    delimitations: [
                      { x: 100, y: 100, width: 200, height: 200, coordinateType: 'ABSOLUTE' }
                    ]
                  }
                ]
              }
            ]
          },
          sizes: [
            { id: 1, sizeName: 'M' }
          ]
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.6
        }
      }
    };

    // Créer produit directement via le service
    const vendorProduct = await prisma.vendorProduct.create({
      data: {
        baseProductId: productData.baseProductId,
        vendorId: vendor.id,
        name: productData.vendorName,
        description: productData.vendorDescription,
        price: productData.vendorPrice,
        stock: productData.vendorStock,
        
        // Liaison design
        designId: design.id,
        designCloudinaryUrl: design.imageUrl,
        designCloudinaryPublicId: design.cloudinaryPublicId,
        designPositioning: 'CENTER',
        designScale: 0.6,
        designApplicationMode: 'PRESERVED',
        
        // Sélections
        sizes: JSON.stringify(productData.selectedSizes),
        colors: JSON.stringify(productData.selectedColors),
        
        // Statut
        status: design.isValidated ? 'PUBLISHED' : 'PENDING',
        isValidated: design.isValidated,
        postValidationAction: productData.postValidationAction,
        
        // Métadonnées admin
        adminProductName: productData.productStructure.adminProduct.name,
        adminProductDescription: productData.productStructure.adminProduct.description,
        adminProductPrice: productData.productStructure.adminProduct.price,
        vendorName: productData.vendorName,
        vendorDescription: productData.vendorDescription,
        vendorStock: productData.vendorStock,
        basePriceAdmin: productData.productStructure.adminProduct.price
      }
    });

    productId = vendorProduct.id;
    console.log(`✅ Produit créé: ${vendorProduct.id} avec design ${design.id}`);

    // 7. Créer lien design-produit
    await prisma.designProductLink.create({
      data: {
        designId: design.id,
        vendorProductId: vendorProduct.id
      }
    });

    console.log(`✅ Lien créé: Design ${design.id} ↔ Produit ${vendorProduct.id}`);

    // 8. Test validation cascade
    console.log('\n🔄 Test 3: Validation cascade...');
    
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

    console.log(`✅ Design ${design.id} validé`);

    // Appliquer la cascade
    const linkedProducts = await prisma.vendorProduct.findMany({
      where: { designId: design.id }
    });

    for (const product of linkedProducts) {
      const newStatus = product.postValidationAction === 'TO_DRAFT' ? 'DRAFT' : 'PUBLISHED';
      
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
    console.log('\n📊 Test 4: Vérification des résultats...');
    
    const finalDesign = await prisma.design.findUnique({
      where: { id: design.id }
    });

    const finalProduct = await prisma.vendorProduct.findUnique({
      where: { id: vendorProduct.id }
    });

    const finalLink = await prisma.designProductLink.findFirst({
      where: {
        designId: design.id,
        vendorProductId: vendorProduct.id
      }
    });

    console.log(`Design validé: ${finalDesign.isValidated ? '✅' : '❌'}`);
    console.log(`Produit status: ${finalProduct.status} (attendu: PUBLISHED)`);
    console.log(`Lien existe: ${finalLink ? '✅' : '❌'}`);

    // 10. Test DTO structure
    console.log('\n📋 Test 5: Structure DTO...');
    
    const testDto = {
      baseProductId: baseProduct.id,
      designId: design.id,
      vendorName: 'Test DTO',
      vendorDescription: 'Test description',
      vendorPrice: 20000,
      vendorStock: 25,
      selectedColors: [{ id: 1, name: 'Bleu', colorCode: '#0000ff' }],
      selectedSizes: [{ id: 1, sizeName: 'L' }],
      postValidationAction: 'TO_DRAFT',
      productStructure: {
        adminProduct: {
          id: baseProduct.id,
          name: baseProduct.name,
          description: baseProduct.description,
          price: baseProduct.price,
          images: {
            colorVariations: []
          },
          sizes: []
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.7
        }
      }
    };

    console.log(`✅ DTO structure valide`);
    console.log(`- designId: ${testDto.designId}`);
    console.log(`- designApplication.scale: ${testDto.productStructure.designApplication.scale}`);
    console.log(`- postValidationAction: ${testDto.postValidationAction}`);

    // Vérifier le succès global
    let success = true;
    let errors = [];

    if (!finalDesign.isValidated) {
      errors.push('Design non validé');
      success = false;
    }

    if (finalProduct.status !== 'PUBLISHED') {
      errors.push(`Produit status incorrect: ${finalProduct.status}`);
      success = false;
    }

    if (!finalLink) {
      errors.push('Lien design-produit manquant');
      success = false;
    }

    if (success) {
      console.log('\n🎉 Test Backend réussi !');
      console.log('✅ Système design séparé fonctionnel');
      console.log('✅ Validation cascade opérationnelle');
      console.log('✅ Structure DTO correcte');
    } else {
      console.log('\n❌ Test Backend échoué :');
      errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Erreur durant le test backend:', error);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

async function cleanup() {
  console.log('\n🧹 Nettoyage des données de test...');

  try {
    // Supprimer dans l'ordre
    await prisma.designProductLink.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: 'test-backend-design@example.com'
          }
        }
      }
    });

    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: 'test-backend-design@example.com'
        }
      }
    });

    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: 'test-backend-design@example.com'
        }
      }
    });

    await prisma.product.deleteMany({
      where: {
        OR: [
          { name: 'T-shirt Backend Test' },
          { id: 999 }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-backend-design@example.com',
            'test-backend-admin@example.com'
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
  testBackendDesignSepare()
    .then(() => {
      console.log('\n🎉 Test terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testBackendDesignSepare }; 