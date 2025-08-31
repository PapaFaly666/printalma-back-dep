const { PrismaClient } = require('@prisma/client');
const { VendorPublishService } = require('./src/vendor-product/vendor-publish.service');
const { CloudinaryService } = require('./src/core/cloudinary/cloudinary.service');

const prisma = new PrismaClient();

// Mock CloudinaryService
const mockCloudinaryService = {
  uploadBase64: jest.fn().mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-design.jpg',
    public_id: 'test-design',
    bytes: 1000,
    width: 500,
    height: 500,
    format: 'jpg'
  })
};

async function testVendorPublishDeduplication() {
  console.log('🧪 Test de déduplication avec VendorPublishService...\n');

  const vendorPublishService = new VendorPublishService(prisma, mockCloudinaryService);

  try {
    // 1. Créer un vendeur de test
    const vendor = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Vendor',
        email: 'test-vendor-publish@example.com',
        password: 'hashedpassword',
        role: 'VENDEUR'
      }
    });

    console.log(`✅ Vendeur créé: ${vendor.id}`);

    // 2. Créer un produit de base
    const baseProduct = await prisma.product.create({
      data: {
        name: 'T-shirt Test',
        description: 'Produit de base pour test',
        price: 15000,
        stock: 100,
        status: 'PUBLISHED'
      }
    });

    console.log(`✅ Produit de base créé: ${baseProduct.id}`);

    // 3. Créer une variation de couleur
    const colorVariation = await prisma.colorVariation.create({
      data: {
        name: 'Rouge',
        colorCode: '#ff0000',
        productId: baseProduct.id
      }
    });

    // 4. Créer une image pour la variation
    const productImage = await prisma.productImage.create({
      data: {
        view: 'Front',
        url: 'https://example.com/image1.jpg',
        publicId: 'image1',
        colorVariationId: colorVariation.id
      }
    });

    // 5. Créer une délimitation
    await prisma.delimitation.create({
      data: {
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        productImageId: productImage.id
      }
    });

    // 6. Design de test (même contenu)
    const testDesignBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // 7. DTO pour le premier produit
    const publishDto1 = {
      baseProductId: baseProduct.id,
      vendorName: 'T-shirt Design Test 1',
      vendorDescription: 'Premier produit avec design',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [{ id: colorVariation.id, name: 'Rouge', code: '#ff0000' }],
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
                id: colorVariation.id,
                name: 'Rouge',
                colorCode: '#ff0000',
                images: [
                  {
                    id: productImage.id,
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

    // 8. Test 1: Créer le premier produit
    console.log('\n📦 Test 1: Création du premier produit...');
    
    const result1 = await vendorPublishService.publishProduct(publishDto1, vendor.id);
    console.log(`✅ Produit 1 créé: ${result1.productId} avec design: ${result1.designId}`);

    // 9. Test 2: Créer le deuxième produit avec le MÊME design
    console.log('\n📦 Test 2: Création du deuxième produit avec le même design...');
    
    const publishDto2 = {
      ...publishDto1,
      vendorName: 'T-shirt Design Test 2',
      vendorDescription: 'Deuxième produit avec MÊME design',
      postValidationAction: 'TO_DRAFT'
    };

    const result2 = await vendorPublishService.publishProduct(publishDto2, vendor.id);
    console.log(`✅ Produit 2 créé: ${result2.productId} avec design: ${result2.designId}`);

    // 10. Vérifier que les deux produits utilisent le même design
    console.log('\n🔍 Vérification de la déduplication...');
    
    if (result1.designId === result2.designId) {
      console.log(`✅ SUCCÈS: Les deux produits utilisent le même design (ID: ${result1.designId})`);
    } else {
      console.log(`❌ ÉCHEC: Les produits utilisent des designs différents (${result1.designId} vs ${result2.designId})`);
    }

    // 11. Vérifier le nombre d'appels à Cloudinary
    console.log(`📊 Nombre d'appels à Cloudinary: ${mockCloudinaryService.uploadBase64.mock.calls.length}`);
    
    if (mockCloudinaryService.uploadBase64.mock.calls.length === 1) {
      console.log('✅ SUCCÈS: Un seul upload vers Cloudinary');
    } else {
      console.log('❌ ÉCHEC: Plusieurs uploads vers Cloudinary');
    }

    // 12. Vérifier les designs en base
    const designs = await prisma.design.findMany({
      where: { vendorId: vendor.id }
    });

    console.log(`📊 Nombre de designs en base: ${designs.length}`);
    
    if (designs.length === 1) {
      console.log('✅ SUCCÈS: Un seul design en base');
    } else {
      console.log('❌ ÉCHEC: Plusieurs designs en base');
    }

    // 13. Test de cascade validation
    console.log('\n🔄 Test de cascade validation...');
    
    // Valider le design
    const design = designs[0];
    await prisma.design.update({
      where: { id: design.id },
      data: {
        isValidated: true,
        validatedAt: new Date(),
        isPending: false
      }
    });

    // Simuler la cascade
    await simulateCascadeValidation(design.id);

    // 14. Vérifier les résultats
    const updatedProduct1 = await prisma.vendorProduct.findUnique({
      where: { id: result1.productId }
    });

    const updatedProduct2 = await prisma.vendorProduct.findUnique({
      where: { id: result2.productId }
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
    // Supprimer dans l'ordre pour éviter les contraintes
    await prisma.designProductLink.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: 'test-vendor-publish@example.com'
          }
        }
      }
    });

    await prisma.vendorProductImage.deleteMany({
      where: {
        vendorProduct: {
          vendor: {
            email: 'test-vendor-publish@example.com'
          }
        }
      }
    });

    await prisma.vendorProduct.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-publish@example.com'
        }
      }
    });

    await prisma.design.deleteMany({
      where: {
        vendor: {
          email: 'test-vendor-publish@example.com'
        }
      }
    });

    await prisma.delimitation.deleteMany({
      where: {
        productImage: {
          colorVariation: {
            product: {
              name: 'T-shirt Test'
            }
          }
        }
      }
    });

    await prisma.productImage.deleteMany({
      where: {
        colorVariation: {
          product: {
            name: 'T-shirt Test'
          }
        }
      }
    });

    await prisma.colorVariation.deleteMany({
      where: {
        product: {
          name: 'T-shirt Test'
        }
      }
    });

    await prisma.product.deleteMany({
      where: {
        name: 'T-shirt Test'
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: 'test-vendor-publish@example.com'
      }
    });

    console.log('✅ Nettoyage terminé');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Mock jest si non disponible
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => ({
      mockResolvedValue: (value) => ({
        mock: { calls: [] },
        ...(() => Promise.resolve(value))
      })
    })
  };
}

// Exécuter le test
if (require.main === module) {
  testVendorPublishDeduplication()
    .then(() => {
      console.log('\n🎉 Tous les tests terminés !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testVendorPublishDeduplication }; 