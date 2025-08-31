const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la base de données...\n');

    // 1. Vérifier les produits vendeur
    console.log('📦 Produits vendeur:');
    const vendorProducts = await prisma.vendorProduct.findMany({
      take: 5,
      include: {
        design: true,
        baseProduct: true
      }
    });
    
    console.log(`Total: ${vendorProducts.length} produits trouvés`);
    vendorProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. Produit ID: ${product.id}`);
      console.log(`   - Design ID: ${product.designId}`);
      console.log(`   - Design URL: ${product.design?.imageUrl || 'Aucun'}`);
      console.log(`   - Design Width: ${product.designWidth || 'Non défini'}`);
      console.log(`   - Design Height: ${product.designHeight || 'Non défini'}`);
      console.log(`   - Status: ${product.status}`);
    });

    // 2. Vérifier les positions de design
    console.log('\n🎯 Positions de design (ProductDesignPosition):');
    const designPositions = await prisma.productDesignPosition.findMany({
      take: 10,
      include: {
        design: true,
        vendorProduct: true
      }
    });
    
    console.log(`Total: ${designPositions.length} positions trouvées`);
    designPositions.forEach((position, index) => {
      console.log(`\n${index + 1}. Position pour Produit ${position.vendorProductId}, Design ${position.designId}`);
      console.log(`   - Position JSON:`, JSON.stringify(position.position, null, 2));
      console.log(`   - Créé le: ${position.createdAt}`);
      console.log(`   - Modifié le: ${position.updatedAt}`);
    });

    // 3. Vérifier les designs
    console.log('\n🎨 Designs:');
    const designs = await prisma.design.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: true,
        isValidated: true
      }
    });
    
    console.log(`Total: ${designs.length} designs trouvés`);
    designs.forEach((design, index) => {
      console.log(`\n${index + 1}. Design ID: ${design.id}`);
      console.log(`   - Nom: ${design.name}`);
      console.log(`   - Catégorie: ${design.category}`);
      console.log(`   - URL: ${design.imageUrl}`);
      console.log(`   - Validé: ${design.isValidated}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 