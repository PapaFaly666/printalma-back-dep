const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingProductsGenre() {
  console.log('🔄 Mise à jour des produits existants avec le champ genre...\n');

  try {
    // Récupérer tous les produits qui n'ont pas de genre défini
    const productsWithoutGenre = await prisma.product.findMany({
      where: {
        genre: null
      }
    });

    console.log(`📦 ${productsWithoutGenre.length} produits trouvés sans genre défini\n`);

    let updatedCount = 0;

    for (const product of productsWithoutGenre) {
      // Déterminer le genre basé sur le nom et la description du produit
      let genre = 'UNISEXE'; // Valeur par défaut

      const productName = product.name.toLowerCase();
      const productDescription = product.description.toLowerCase();

      // Logique pour déterminer le genre
      if (productName.includes('homme') || productName.includes('men') || 
          productDescription.includes('homme') || productDescription.includes('men')) {
        genre = 'HOMME';
      } else if (productName.includes('femme') || productName.includes('women') || 
                 productDescription.includes('femme') || productDescription.includes('women')) {
        genre = 'FEMME';
      } else if (productName.includes('bébé') || productName.includes('baby') || 
                 productName.includes('enfant') || productName.includes('child') ||
                 productDescription.includes('bébé') || productDescription.includes('baby') ||
                 productDescription.includes('enfant') || productDescription.includes('child')) {
        genre = 'BEBE';
      } else {
        genre = 'UNISEXE';
      }

      // Mettre à jour le produit
      await prisma.product.update({
        where: { id: product.id },
        data: { genre }
      });

      console.log(`✅ Produit ${product.id} "${product.name}" mis à jour avec genre: ${genre}`);
      updatedCount++;
    }

    console.log(`\n🎉 Mise à jour terminée ! ${updatedCount} produits mis à jour.`);

    // Vérifier les statistiques par genre
    console.log('\n📊 Statistiques par genre:');
    
    const genreStats = await prisma.product.groupBy({
      by: ['genre'],
      _count: {
        id: true
      }
    });

    genreStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} produits`);
    });

    // Vérifier les mockups spécifiquement
    console.log('\n🎨 Mockups par genre:');
    
    const mockupStats = await prisma.product.groupBy({
      by: ['genre'],
      where: {
        isReadyProduct: false
      },
      _count: {
        id: true
      }
    });

    mockupStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} mockups`);
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour produits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour créer des mockups de test avec différents genres
async function createTestMockups() {
  console.log('\n🧪 Création de mockups de test avec différents genres...\n');

  try {
    const testMockups = [
      {
        name: 'T-shirt Homme Sport',
        description: 'T-shirt sport pour homme',
        price: 5500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'HOMME',
        stock: 100
      },
      {
        name: 'T-shirt Femme Élégant',
        description: 'T-shirt élégant pour femme',
        price: 6000,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'FEMME',
        stock: 80
      },
      {
        name: 'Body Bébé Coton',
        description: 'Body en coton bio pour bébé',
        price: 3500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'BEBE',
        stock: 50
      },
      {
        name: 'T-shirt Unisexe Basic',
        description: 'T-shirt basique pour tous',
        price: 4500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'UNISEXE',
        stock: 120
      }
    ];

    for (const mockupData of testMockups) {
      const mockup = await prisma.product.create({
        data: mockupData
      });

      console.log(`✅ Mockup créé: ${mockup.name} (Genre: ${mockup.genre})`);
    }

    console.log('\n🎉 Mockups de test créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur création mockups de test:', error);
  }
}

// Fonction pour afficher les produits par genre
async function displayProductsByGenre() {
  console.log('\n📋 Affichage des produits par genre:\n');

  try {
    const genres = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];

    for (const genre of genres) {
      const products = await prisma.product.findMany({
        where: {
          genre,
          isDelete: false
        },
        select: {
          id: true,
          name: true,
          isReadyProduct: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      console.log(`🎯 Genre: ${genre}`);
      console.log(`   Total: ${products.length} produits affichés`);
      
      products.forEach(product => {
        const type = product.isReadyProduct ? 'Produit prêt' : 'Mockup';
        console.log(`   - ${product.id}: ${product.name} (${type}, ${product.status})`);
      });
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur affichage produits par genre:', error);
  }
}

// Exécuter les fonctions
async function main() {
  await updateExistingProductsGenre();
  await createTestMockups();
  await displayProductsByGenre();
}

main(); 

const prisma = new PrismaClient();

async function updateExistingProductsGenre() {
  console.log('🔄 Mise à jour des produits existants avec le champ genre...\n');

  try {
    // Récupérer tous les produits qui n'ont pas de genre défini
    const productsWithoutGenre = await prisma.product.findMany({
      where: {
        genre: null
      }
    });

    console.log(`📦 ${productsWithoutGenre.length} produits trouvés sans genre défini\n`);

    let updatedCount = 0;

    for (const product of productsWithoutGenre) {
      // Déterminer le genre basé sur le nom et la description du produit
      let genre = 'UNISEXE'; // Valeur par défaut

      const productName = product.name.toLowerCase();
      const productDescription = product.description.toLowerCase();

      // Logique pour déterminer le genre
      if (productName.includes('homme') || productName.includes('men') || 
          productDescription.includes('homme') || productDescription.includes('men')) {
        genre = 'HOMME';
      } else if (productName.includes('femme') || productName.includes('women') || 
                 productDescription.includes('femme') || productDescription.includes('women')) {
        genre = 'FEMME';
      } else if (productName.includes('bébé') || productName.includes('baby') || 
                 productName.includes('enfant') || productName.includes('child') ||
                 productDescription.includes('bébé') || productDescription.includes('baby') ||
                 productDescription.includes('enfant') || productDescription.includes('child')) {
        genre = 'BEBE';
      } else {
        genre = 'UNISEXE';
      }

      // Mettre à jour le produit
      await prisma.product.update({
        where: { id: product.id },
        data: { genre }
      });

      console.log(`✅ Produit ${product.id} "${product.name}" mis à jour avec genre: ${genre}`);
      updatedCount++;
    }

    console.log(`\n🎉 Mise à jour terminée ! ${updatedCount} produits mis à jour.`);

    // Vérifier les statistiques par genre
    console.log('\n📊 Statistiques par genre:');
    
    const genreStats = await prisma.product.groupBy({
      by: ['genre'],
      _count: {
        id: true
      }
    });

    genreStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} produits`);
    });

    // Vérifier les mockups spécifiquement
    console.log('\n🎨 Mockups par genre:');
    
    const mockupStats = await prisma.product.groupBy({
      by: ['genre'],
      where: {
        isReadyProduct: false
      },
      _count: {
        id: true
      }
    });

    mockupStats.forEach(stat => {
      console.log(`   ${stat.genre}: ${stat._count.id} mockups`);
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour produits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour créer des mockups de test avec différents genres
async function createTestMockups() {
  console.log('\n🧪 Création de mockups de test avec différents genres...\n');

  try {
    const testMockups = [
      {
        name: 'T-shirt Homme Sport',
        description: 'T-shirt sport pour homme',
        price: 5500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'HOMME',
        stock: 100
      },
      {
        name: 'T-shirt Femme Élégant',
        description: 'T-shirt élégant pour femme',
        price: 6000,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'FEMME',
        stock: 80
      },
      {
        name: 'Body Bébé Coton',
        description: 'Body en coton bio pour bébé',
        price: 3500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'BEBE',
        stock: 50
      },
      {
        name: 'T-shirt Unisexe Basic',
        description: 'T-shirt basique pour tous',
        price: 4500,
        status: 'DRAFT',
        isReadyProduct: false,
        genre: 'UNISEXE',
        stock: 120
      }
    ];

    for (const mockupData of testMockups) {
      const mockup = await prisma.product.create({
        data: mockupData
      });

      console.log(`✅ Mockup créé: ${mockup.name} (Genre: ${mockup.genre})`);
    }

    console.log('\n🎉 Mockups de test créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur création mockups de test:', error);
  }
}

// Fonction pour afficher les produits par genre
async function displayProductsByGenre() {
  console.log('\n📋 Affichage des produits par genre:\n');

  try {
    const genres = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];

    for (const genre of genres) {
      const products = await prisma.product.findMany({
        where: {
          genre,
          isDelete: false
        },
        select: {
          id: true,
          name: true,
          isReadyProduct: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      console.log(`🎯 Genre: ${genre}`);
      console.log(`   Total: ${products.length} produits affichés`);
      
      products.forEach(product => {
        const type = product.isReadyProduct ? 'Produit prêt' : 'Mockup';
        console.log(`   - ${product.id}: ${product.name} (${type}, ${product.status})`);
      });
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur affichage produits par genre:', error);
  }
}

// Exécuter les fonctions
async function main() {
  await updateExistingProductsGenre();
  await createTestMockups();
  await displayProductsByGenre();
}

main(); 