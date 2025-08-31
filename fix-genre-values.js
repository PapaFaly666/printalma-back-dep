const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixGenreValues() {
  console.log('🔧 Correction des valeurs de genre dans la base de données...\n');

  try {
    // 1. Vérifier les produits avec des valeurs incorrectes en utilisant SQL brut
    console.log('1️⃣ Vérification des produits avec des valeurs de genre incorrectes...');
    
    const productsWithIncorrectGenre = await prisma.$queryRaw`
      SELECT id, name, genre 
      FROM "Product" 
      WHERE genre IN ('unisexe', 'homme', 'femme', 'bébé', 'bebe')
    `;

    console.log(`📦 ${productsWithIncorrectGenre.length} produits trouvés avec des valeurs de genre incorrectes`);

    if (productsWithIncorrectGenre.length > 0) {
      console.log('\n📋 Produits à corriger:');
      productsWithIncorrectGenre.forEach(product => {
        console.log(`   - ID ${product.id}: "${product.name}" (genre: ${product.genre})`);
      });

      // 2. Corriger les valeurs en utilisant SQL brut
      console.log('\n2️⃣ Correction des valeurs de genre...');
      
      // Corriger 'homme' → 'HOMME'
      const hommeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'HOMME' 
        WHERE genre = 'homme'
      `;
      console.log(`✅ ${hommeResult} produits 'homme' → 'HOMME'`);

      // Corriger 'femme' → 'FEMME'
      const femmeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'FEMME' 
        WHERE genre = 'femme'
      `;
      console.log(`✅ ${femmeResult} produits 'femme' → 'FEMME'`);

      // Corriger 'bébé' et 'bebe' → 'BEBE'
      const bebeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'BEBE' 
        WHERE genre IN ('bébé', 'bebe')
      `;
      console.log(`✅ ${bebeResult} produits 'bébé'/'bebe' → 'BEBE'`);

      // Corriger 'unisexe' → 'UNISEXE'
      const unisexeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'UNISEXE' 
        WHERE genre = 'unisexe'
      `;
      console.log(`✅ ${unisexeResult} produits 'unisexe' → 'UNISEXE'`);

      console.log('\n🎉 Correction terminée !');
    } else {
      console.log('✅ Aucun produit avec des valeurs de genre incorrectes trouvé.');
    }

    // 3. Vérifier les statistiques finales
    console.log('\n3️⃣ Statistiques finales par genre:');
    
    const finalStats = await prisma.product.groupBy({
      by: ['genre'],
      _count: {
        id: true
      }
    });

    finalStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} produits`);
    });

    // 4. Test de création pour vérifier que tout fonctionne
    console.log('\n4️⃣ Test de création d\'un produit...');
    
    try {
      const testProduct = await prisma.product.create({
        data: {
          name: 'Test Genre Fix',
          description: 'Test pour vérifier que les genres fonctionnent',
          price: 1000,
          stock: 10,
          status: 'DRAFT',
          isReadyProduct: false,
          genre: 'HOMME'
        }
      });

      console.log('✅ Test de création réussi:', {
        id: testProduct.id,
        name: testProduct.name,
        genre: testProduct.genre
      });

      // Nettoyer le produit de test
      await prisma.product.delete({
        where: { id: testProduct.id }
      });

      console.log('✅ Produit de test supprimé');

    } catch (error) {
      console.error('❌ Erreur lors du test de création:', error);
    }

    console.log('\n🎉 Script de correction terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGenreValues(); 

const prisma = new PrismaClient();

async function fixGenreValues() {
  console.log('🔧 Correction des valeurs de genre dans la base de données...\n');

  try {
    // 1. Vérifier les produits avec des valeurs incorrectes en utilisant SQL brut
    console.log('1️⃣ Vérification des produits avec des valeurs de genre incorrectes...');
    
    const productsWithIncorrectGenre = await prisma.$queryRaw`
      SELECT id, name, genre 
      FROM "Product" 
      WHERE genre IN ('unisexe', 'homme', 'femme', 'bébé', 'bebe')
    `;

    console.log(`📦 ${productsWithIncorrectGenre.length} produits trouvés avec des valeurs de genre incorrectes`);

    if (productsWithIncorrectGenre.length > 0) {
      console.log('\n📋 Produits à corriger:');
      productsWithIncorrectGenre.forEach(product => {
        console.log(`   - ID ${product.id}: "${product.name}" (genre: ${product.genre})`);
      });

      // 2. Corriger les valeurs en utilisant SQL brut
      console.log('\n2️⃣ Correction des valeurs de genre...');
      
      // Corriger 'homme' → 'HOMME'
      const hommeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'HOMME' 
        WHERE genre = 'homme'
      `;
      console.log(`✅ ${hommeResult} produits 'homme' → 'HOMME'`);

      // Corriger 'femme' → 'FEMME'
      const femmeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'FEMME' 
        WHERE genre = 'femme'
      `;
      console.log(`✅ ${femmeResult} produits 'femme' → 'FEMME'`);

      // Corriger 'bébé' et 'bebe' → 'BEBE'
      const bebeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'BEBE' 
        WHERE genre IN ('bébé', 'bebe')
      `;
      console.log(`✅ ${bebeResult} produits 'bébé'/'bebe' → 'BEBE'`);

      // Corriger 'unisexe' → 'UNISEXE'
      const unisexeResult = await prisma.$executeRaw`
        UPDATE "Product" 
        SET genre = 'UNISEXE' 
        WHERE genre = 'unisexe'
      `;
      console.log(`✅ ${unisexeResult} produits 'unisexe' → 'UNISEXE'`);

      console.log('\n🎉 Correction terminée !');
    } else {
      console.log('✅ Aucun produit avec des valeurs de genre incorrectes trouvé.');
    }

    // 3. Vérifier les statistiques finales
    console.log('\n3️⃣ Statistiques finales par genre:');
    
    const finalStats = await prisma.product.groupBy({
      by: ['genre'],
      _count: {
        id: true
      }
    });

    finalStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} produits`);
    });

    // 4. Test de création pour vérifier que tout fonctionne
    console.log('\n4️⃣ Test de création d\'un produit...');
    
    try {
      const testProduct = await prisma.product.create({
        data: {
          name: 'Test Genre Fix',
          description: 'Test pour vérifier que les genres fonctionnent',
          price: 1000,
          stock: 10,
          status: 'DRAFT',
          isReadyProduct: false,
          genre: 'HOMME'
        }
      });

      console.log('✅ Test de création réussi:', {
        id: testProduct.id,
        name: testProduct.name,
        genre: testProduct.genre
      });

      // Nettoyer le produit de test
      await prisma.product.delete({
        where: { id: testProduct.id }
      });

      console.log('✅ Produit de test supprimé');

    } catch (error) {
      console.error('❌ Erreur lors du test de création:', error);
    }

    console.log('\n🎉 Script de correction terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixGenreValues(); 