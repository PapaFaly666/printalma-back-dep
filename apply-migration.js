const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Application de la migration pour ajouter l\'enum ProductGenre...\n');

  try {
    // 1. Créer l'enum ProductGenre
    console.log('1️⃣ Création de l\'enum ProductGenre...');
    await prisma.$executeRaw`CREATE TYPE "ProductGenre" AS ENUM ('HOMME', 'FEMME', 'BEBE', 'UNISEXE')`;
    console.log('✅ Enum ProductGenre créé avec succès');

    // 2. Ajouter la colonne genre à la table Product
    console.log('\n2️⃣ Ajout de la colonne genre à la table Product...');
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "genre" "ProductGenre" NOT NULL DEFAULT 'UNISEXE'`;
    console.log('✅ Colonne genre ajoutée avec succès');

    // 3. Créer l'index sur la colonne genre
    console.log('\n3️⃣ Création de l\'index sur la colonne genre...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Product_genre_idx" ON "Product"("genre")`;
    console.log('✅ Index créé avec succès');

    // 4. Mettre à jour les produits existants
    console.log('\n4️⃣ Mise à jour des produits existants...');
    const updateResult = await prisma.$executeRaw`UPDATE "Product" SET "genre" = 'UNISEXE' WHERE "genre" IS NULL`;
    console.log('✅ Produits existants mis à jour');

    // 5. Vérifier que tout fonctionne
    console.log('\n5️⃣ Vérification de l\'implémentation...');
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product Genre',
        description: 'Test pour vérifier l\'enum',
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

    console.log('\n🎉 Migration appliquée avec succès !');
    console.log('✅ L\'enum ProductGenre est maintenant disponible');
    console.log('✅ La colonne genre a été ajoutée à la table Product');
    console.log('✅ L\'index a été créé pour optimiser les requêtes');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    
    // Si l'enum existe déjà, on continue
    if (error.message.includes('already exists')) {
      console.log('⚠️ L\'enum ProductGenre existe déjà, continuation...');
      
      try {
        // Vérifier que la colonne existe
        const testProduct = await prisma.product.create({
          data: {
            name: 'Test Product Genre',
            description: 'Test pour vérifier l\'enum',
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

        console.log('\n🎉 L\'enum ProductGenre est déjà configuré !');
      } catch (testError) {
        console.error('❌ Erreur lors du test:', testError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration(); 

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🔄 Application de la migration pour ajouter l\'enum ProductGenre...\n');

  try {
    // 1. Créer l'enum ProductGenre
    console.log('1️⃣ Création de l\'enum ProductGenre...');
    await prisma.$executeRaw`CREATE TYPE "ProductGenre" AS ENUM ('HOMME', 'FEMME', 'BEBE', 'UNISEXE')`;
    console.log('✅ Enum ProductGenre créé avec succès');

    // 2. Ajouter la colonne genre à la table Product
    console.log('\n2️⃣ Ajout de la colonne genre à la table Product...');
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "genre" "ProductGenre" NOT NULL DEFAULT 'UNISEXE'`;
    console.log('✅ Colonne genre ajoutée avec succès');

    // 3. Créer l'index sur la colonne genre
    console.log('\n3️⃣ Création de l\'index sur la colonne genre...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Product_genre_idx" ON "Product"("genre")`;
    console.log('✅ Index créé avec succès');

    // 4. Mettre à jour les produits existants
    console.log('\n4️⃣ Mise à jour des produits existants...');
    const updateResult = await prisma.$executeRaw`UPDATE "Product" SET "genre" = 'UNISEXE' WHERE "genre" IS NULL`;
    console.log('✅ Produits existants mis à jour');

    // 5. Vérifier que tout fonctionne
    console.log('\n5️⃣ Vérification de l\'implémentation...');
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product Genre',
        description: 'Test pour vérifier l\'enum',
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

    console.log('\n🎉 Migration appliquée avec succès !');
    console.log('✅ L\'enum ProductGenre est maintenant disponible');
    console.log('✅ La colonne genre a été ajoutée à la table Product');
    console.log('✅ L\'index a été créé pour optimiser les requêtes');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    
    // Si l'enum existe déjà, on continue
    if (error.message.includes('already exists')) {
      console.log('⚠️ L\'enum ProductGenre existe déjà, continuation...');
      
      try {
        // Vérifier que la colonne existe
        const testProduct = await prisma.product.create({
          data: {
            name: 'Test Product Genre',
            description: 'Test pour vérifier l\'enum',
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

        console.log('\n🎉 L\'enum ProductGenre est déjà configuré !');
      } catch (testError) {
        console.error('❌ Erreur lors du test:', testError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration(); 