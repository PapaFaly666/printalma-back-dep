const { PrismaClient } = require('@prisma/client');

async function testBackendCreateDirect() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test direct du backend avec suggestedPrice...\n');
    
    // Simuler exactement ce que le frontend envoie
    const mockDto = {
      name: "Test Backend Direct",
      description: "Test pour vérifier suggestedPrice côté backend",
      price: 300000,
      suggestedPrice: 300000, // ← Valeur à tester
      stock: 10,
      status: "published",
      categories: ["Vêtements > T-shirts"],
      sizes: ["XS", "S", "M"],
      genre: "FEMME",
      isReadyProduct: false,
      colorVariations: [
        {
          name: "Test Color",
          colorCode: "#000000",
          images: [
            {
              fileId: "test123",
              view: "Front",
              delimitations: [
                {
                  x: 100,
                  y: 100,
                  width: 200,
                  height: 200,
                  rotation: 0
                }
              ]
            }
          ]
        }
      ]
    };
    
    console.log('📤 DTO simulé à envoyer au backend:');
    console.log(JSON.stringify(mockDto, null, 2));
    
    // Test 1: Vérification directe Prisma
    console.log('\n1️⃣ Test direct Prisma:');
    
    const directProduct = await prisma.product.create({
      data: {
        name: mockDto.name,
        description: mockDto.description,
        price: mockDto.price,
        suggestedPrice: mockDto.suggestedPrice, // ← Test direct
        stock: mockDto.stock,
        status: 'PUBLISHED',
        genre: mockDto.genre,
        isValidated: false,
        isReadyProduct: mockDto.isReadyProduct,
        isDelete: false
      }
    });
    
    console.log('✅ Produit créé directement avec Prisma:');
    console.log('   - ID:', directProduct.id);
    console.log('   - suggestedPrice:', directProduct.suggestedPrice);
    console.log('   - genre:', directProduct.genre);
    
    // Test 2: Lecture pour vérifier
    const savedProduct = await prisma.product.findUnique({
      where: { id: directProduct.id }
    });
    
    console.log('\n📖 Produit relu depuis la base:');
    console.log('   - suggestedPrice:', savedProduct.suggestedPrice);
    console.log('   - Type:', typeof savedProduct.suggestedPrice);
    
    // Test 3: Simulation du ProductService (sans les fichiers)
    console.log('\n2️⃣ Simulation ProductService create():');
    
    // Traitement genre comme dans le service
    const isReadyProduct = mockDto.isReadyProduct ?? false;
    const genreValue = mockDto.genre || 'UNISEXE';
    
    console.log('🔍 Valeurs traitées:');
    console.log('   - suggestedPrice:', mockDto.suggestedPrice);
    console.log('   - genre:', genreValue);
    console.log('   - isReadyProduct:', isReadyProduct);
    
    // Création comme dans le service
    const serviceProduct = await prisma.product.create({
      data: {
        name: mockDto.name,
        description: mockDto.description,
        price: mockDto.price,
        suggestedPrice: mockDto.suggestedPrice, // ← Même ligne que dans le service
        stock: mockDto.stock,
        status: mockDto.status === 'published' ? 'PUBLISHED' : 'DRAFT',
        isReadyProduct: isReadyProduct,
        genre: genreValue,
        isValidated: true,
      },
    });
    
    console.log('✅ Produit créé via simulation service:');
    console.log('   - ID:', serviceProduct.id);
    console.log('   - suggestedPrice:', serviceProduct.suggestedPrice);
    console.log('   - genre:', serviceProduct.genre);
    console.log('   - status:', serviceProduct.status);
    
    // Nettoyage
    await prisma.product.deleteMany({
      where: {
        id: {
          in: [directProduct.id, serviceProduct.id]
        }
      }
    });
    
    console.log('\n✅ Test terminé - Produits de test supprimés');
    console.log('\n🔍 Conclusion:');
    console.log('   - Prisma direct: ✅ suggestedPrice fonctionne');
    console.log('   - Service simulation: ✅ suggestedPrice fonctionne');
    console.log('   - Le problème est ailleurs...');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testBackendCreateDirect()
    .then(() => console.log('\n🎉 Test terminé'))
    .catch(console.error);
}