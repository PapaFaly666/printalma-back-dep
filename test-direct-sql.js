const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectSQL() {
  try {
    console.log('🔍 Test avec SQL direct...');

    // 1. Vérification directe des données
    console.log('\n1. Vérification des données avec jointure SQL:');
    const rawQuery = `
      SELECT
        vp.id as produit_id,
        vp.name as nom_produit,
        d.id as design_id,
        d.name as nom_design,
        dc.id as category_id,
        dc.name as nom_categorie
      FROM "VendorProduct" vp
      LEFT JOIN "Design" d ON vp.design_id = d.id
      LEFT JOIN "DesignCategory" dc ON d."categoryId" = dc.id
      WHERE dc.name = 'Test'
      LIMIT 5
    `;

    const result = await prisma.$queryRawUnsafe(rawQuery);
    console.log(`Nombre de produits avec catégorie 'Test': ${result.length}`);
    result.forEach(row => {
      console.log(`- Produit ${row.produit_id}: ${row.nom_produit} | Design: ${row.nom_design} | Catégorie: ${row.nom_categorie}`);
    });

    // 2. Test avec Prisma en utilisant categoryId directement
    console.log('\n2. Test Prisma avec categoryId:');

    // D'abord récupérer l'ID de la catégorie "Test"
    const testCategory = await prisma.designCategory.findFirst({
      where: { name: 'Test' }
    });

    console.log(`Catégorie 'Test' trouvée: ID=${testCategory?.id || 'NULL'}`);

    if (testCategory) {
      const prismaResult = await prisma.vendorProduct.findMany({
        where: {
          design: {
            categoryId: testCategory.id
          }
        },
        take: 5,
        include: {
          design: {
            include: {
              category: true
            }
          }
        }
      });

      console.log(`Nombre de résultats avec categoryId: ${prismaResult.length}`);
      prismaResult.forEach(p => {
        console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name} | CategoryId: ${p.design?.categoryId} | Category: ${p.design?.category?.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectSQL();