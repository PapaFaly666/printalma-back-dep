const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRealValues() {
  console.log('🔍 Vérification des vraies valeurs dans la base de données...\n');

  try {
    // Récupérer les produits vendeurs avec leurs positions de design
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: { isDelete: false },
      include: {
        design: true
      }
    });

    console.log(`📦 ${vendorProducts.length} produits vendeurs trouvés\n`);

    for (const product of vendorProducts) {
      console.log(`\n🔍 Produit ${product.id} - ${product.name}`);
      console.log(`   Design ID: ${product.designId}`);
      
      if (product.designId) {
        // Récupérer les positions de design pour ce produit
        const designPositions = await prisma.productDesignPosition.findMany({
          where: {
            vendorProductId: product.id,
            designId: product.designId
          }
        });

        console.log(`   📍 ${designPositions.length} positions trouvées`);

        for (const position of designPositions) {
          console.log(`   📍 Position ID: ${position.id}`);
          console.log(`   📍 Position data:`, position.position);
          
          // Parser la position JSON
          let positionData;
          try {
            positionData = typeof position.position === 'string' 
              ? JSON.parse(position.position) 
              : position.position;
            
            console.log(`   📍 Position parsée:`, positionData);
            console.log(`   📍 designWidth: ${positionData.designWidth}`);
            console.log(`   📍 designHeight: ${positionData.designHeight}`);
            console.log(`   📍 x: ${positionData.x}`);
            console.log(`   📍 y: ${positionData.y}`);
            console.log(`   📍 scale: ${positionData.scale}`);
            console.log(`   📍 rotation: ${positionData.rotation}`);
          } catch (error) {
            console.log(`   ❌ Erreur parsing position:`, error.message);
          }
        }
      } else {
        console.log(`   ⚠️ Pas de design associé`);
      }
    }

    // Vérifier aussi les designs directement
    console.log('\n🎨 Vérification des designs...');
    const designs = await prisma.design.findMany({
      take: 5
    });

    console.log(`🎨 ${designs.length} designs trouvés`);
    designs.forEach(design => {
      console.log(`   🎨 Design ${design.id}: ${design.name}`);
      console.log(`   🎨 Dimensions:`, design.dimensions);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealValues(); 

const prisma = new PrismaClient();

async function checkRealValues() {
  console.log('🔍 Vérification des vraies valeurs dans la base de données...\n');

  try {
    // Récupérer les produits vendeurs avec leurs positions de design
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: { isDelete: false },
      include: {
        design: true
      }
    });

    console.log(`📦 ${vendorProducts.length} produits vendeurs trouvés\n`);

    for (const product of vendorProducts) {
      console.log(`\n🔍 Produit ${product.id} - ${product.name}`);
      console.log(`   Design ID: ${product.designId}`);
      
      if (product.designId) {
        // Récupérer les positions de design pour ce produit
        const designPositions = await prisma.productDesignPosition.findMany({
          where: {
            vendorProductId: product.id,
            designId: product.designId
          }
        });

        console.log(`   📍 ${designPositions.length} positions trouvées`);

        for (const position of designPositions) {
          console.log(`   📍 Position ID: ${position.id}`);
          console.log(`   📍 Position data:`, position.position);
          
          // Parser la position JSON
          let positionData;
          try {
            positionData = typeof position.position === 'string' 
              ? JSON.parse(position.position) 
              : position.position;
            
            console.log(`   📍 Position parsée:`, positionData);
            console.log(`   📍 designWidth: ${positionData.designWidth}`);
            console.log(`   📍 designHeight: ${positionData.designHeight}`);
            console.log(`   📍 x: ${positionData.x}`);
            console.log(`   📍 y: ${positionData.y}`);
            console.log(`   📍 scale: ${positionData.scale}`);
            console.log(`   📍 rotation: ${positionData.rotation}`);
          } catch (error) {
            console.log(`   ❌ Erreur parsing position:`, error.message);
          }
        }
      } else {
        console.log(`   ⚠️ Pas de design associé`);
      }
    }

    // Vérifier aussi les designs directement
    console.log('\n🎨 Vérification des designs...');
    const designs = await prisma.design.findMany({
      take: 5
    });

    console.log(`🎨 ${designs.length} designs trouvés`);
    designs.forEach(design => {
      console.log(`   🎨 Design ${design.id}: ${design.name}`);
      console.log(`   🎨 Dimensions:`, design.dimensions);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealValues(); 