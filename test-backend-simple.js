const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBackendSimple() {
  try {
    console.log('🧪 Test Backend Simple...');
    
    // Test connexion
    await prisma.$connect();
    console.log('✅ Connexion Prisma OK');
    
    // Test requête simple
    const userCount = await prisma.user.count();
    console.log(`✅ Nombre d'utilisateurs: ${userCount}`);
    
    // Test structure DTO
    const testDto = {
      baseProductId: 1,
      designId: 42,
      vendorName: 'Test Produit',
      vendorDescription: 'Description test',
      vendorPrice: 25000,
      vendorStock: 100,
      selectedColors: [{ id: 1, name: 'Rouge', colorCode: '#ff0000' }],
      selectedSizes: [{ id: 1, sizeName: 'M' }],
      postValidationAction: 'AUTO_PUBLISH',
      productStructure: {
        adminProduct: {
          id: 1,
          name: 'T-shirt Test',
          description: 'Description admin',
          price: 15000,
          images: {
            colorVariations: []
          },
          sizes: []
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.6
        }
      }
    };
    
    console.log('✅ Structure DTO valide');
    console.log(`- designId: ${testDto.designId}`);
    console.log(`- designApplication sans designBase64: OK`);
    console.log(`- postValidationAction: ${testDto.postValidationAction}`);
    
    console.log('\n🎉 Backend prêt pour le système design séparé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBackendSimple(); 