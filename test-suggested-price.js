const { PrismaClient } = require('@prisma/client');

async function testSuggestedPrice() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Test du champ suggestedPrice...\n');
    
    // 1. Test direct avec Prisma
    console.log('1️⃣ Test de création directe avec Prisma:');
    
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test suggestedPrice',
        description: 'Test pour vérifier suggestedPrice',
        price: 10.99,
        suggestedPrice: 15.99, // ← Test avec une valeur
        stock: 10,
        status: 'DRAFT',
        genre: 'UNISEXE',
        isValidated: false,
        isReadyProduct: false,
        isDelete: false
      }
    });
    
    console.log('✅ Produit créé avec ID:', testProduct.id);
    console.log('📊 Valeurs:');
    console.log('   - name:', testProduct.name);
    console.log('   - price:', testProduct.price);
    console.log('   - suggestedPrice:', testProduct.suggestedPrice);
    console.log('   - genre:', testProduct.genre);
    
    // 2. Test de lecture
    console.log('\n2️⃣ Test de lecture depuis la base:');
    
    const retrievedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id }
    });
    
    console.log('📖 Produit lu depuis la base:');
    console.log('   - suggestedPrice:', retrievedProduct.suggestedPrice);
    console.log('   - Type:', typeof retrievedProduct.suggestedPrice);
    
    // 3. Test de mise à jour
    console.log('\n3️⃣ Test de mise à jour:');
    
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        suggestedPrice: 20.50
      }
    });
    
    console.log('✅ Produit mis à jour:');
    console.log('   - suggestedPrice:', updatedProduct.suggestedPrice);
    
    // 4. Test avec null
    console.log('\n4️⃣ Test avec valeur null:');
    
    const nullProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        suggestedPrice: null
      }
    });
    
    console.log('✅ Produit avec null:');
    console.log('   - suggestedPrice:', nullProduct.suggestedPrice);
    
    // 5. Vérification du schéma
    console.log('\n5️⃣ Vérification du schéma:');
    
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'suggested_price'
    `;
    
    console.log('📋 Schéma de la colonne suggested_price:');
    console.log(tableInfo);
    
    // 6. Nettoyage
    await prisma.product.delete({
      where: { id: testProduct.id }
    });
    
    console.log('\n✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Test avec différents types de valeurs
async function testDifferentValues() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔬 Test avec différents types de valeurs...\n');
    
    const testValues = [
      { value: 15.99, description: 'Float normal' },
      { value: 15, description: 'Entier' },
      { value: 0, description: 'Zéro' },
      { value: null, description: 'Null explicite' },
      { value: undefined, description: 'Undefined' },
    ];
    
    for (const test of testValues) {
      console.log(`📝 Test: ${test.description} (valeur: ${test.value})`);
      
      try {
        const productData = {
          name: `Test ${test.description}`,
          description: 'Test suggestedPrice values',
          price: 10.99,
          stock: 5,
          status: 'DRAFT',
          genre: 'UNISEXE',
          isValidated: false,
          isReadyProduct: false,
          isDelete: false
        };
        
        // Ajouter suggestedPrice seulement si pas undefined
        if (test.value !== undefined) {
          productData.suggestedPrice = test.value;
        }
        
        const product = await prisma.product.create({
          data: productData
        });
        
        console.log(`   ✅ Créé avec suggestedPrice: ${product.suggestedPrice} (type: ${typeof product.suggestedPrice})`);
        
        // Nettoyage
        await prisma.product.delete({ where: { id: product.id } });
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test des valeurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution des tests
if (require.main === module) {
  console.log('🚀 Début des tests pour suggestedPrice\n');
  
  testSuggestedPrice()
    .then(() => testDifferentValues())
    .then(() => {
      console.log('\n🎉 Tous les tests terminés');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}