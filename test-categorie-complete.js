const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testCategorieComplete() {
  try {
    console.log('🔍 Test complet du filtrage par catégorie (Design + Base)...');

    // 1. Lister les catégories disponibles dans les deux systèmes
    console.log('\n📋 Catégories de design (DesignCategory):');
    const designCategories = await prisma.designCategory.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    console.log(`Nombre total: ${designCategories.length}`);
    designCategories.forEach(cat => {
      console.log(`- ID: ${cat.id}, Name: "${cat.name}", Active: ${cat.isActive}`);
    });

    console.log('\n📋 Catégories de base (Category):');
    const baseCategories = await prisma.category.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    console.log(`Nombre total: ${baseCategories.length}`);
    baseCategories.forEach(cat => {
      console.log(`- ID: ${cat.id}, Name: "${cat.name}", Active: ${cat.isActive}`);
    });

    // 2. Test avec une catégorie de design existante
    if (designCategories.length > 0) {
      const testDesignCategory = designCategories[0];
      console.log(`\n🎨 Test avec DesignCategory: "${testDesignCategory.name}" (ID: ${testDesignCategory.id})`);

      const designProducts = await prisma.vendorProduct.findMany({
        where: {
          design: {
            categoryId: testDesignCategory.id
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

      console.log(`Produits trouvés avec cette catégorie de design: ${designProducts.length}`);
      designProducts.forEach(p => {
        console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name} | Catégorie: ${p.design?.category?.name}`);
      });
    }

    // 3. Test avec une catégorie de base existante
    if (baseCategories.length > 0) {
      const testBaseCategory = baseCategories[0];
      console.log(`\n📦 Test avec Category: "${testBaseCategory.name}" (ID: ${testBaseCategory.id})`);

      const baseProducts = await prisma.vendorProduct.findMany({
        where: {
          baseProduct: {
            categories: {
              some: {
                id: testBaseCategory.id
              }
            }
          }
        },
        take: 5,
        include: {
          baseProduct: {
            include: {
              categories: true
            }
          }
        }
      });

      console.log(`Produits trouvés avec cette catégorie de base: ${baseProducts.length}`);
      baseProducts.forEach(p => {
        const categoryNames = p.baseProduct.categories.map(cat => cat.name).join(', ');
        console.log(`- Produit ${p.id}: ${p.name} | Categories: [${categoryNames}]`);
      });
    }

    // 4. Test de la logique OR (combinée)
    console.log('\n🔗 Test de la logique OR combinée:');
    if (designCategories.length > 0 && baseCategories.length > 0) {
      const designCat = designCategories[0];
      const baseCat = baseCategories[0];

      const combinedProducts = await prisma.vendorProduct.findMany({
        where: {
          OR: [
            {
              design: {
                categoryId: designCat.id
              }
            },
            {
              baseProduct: {
                categories: {
                  some: {
                    id: baseCat.id
                  }
                }
              }
            }
          ]
        },
        take: 10,
        include: {
          design: {
            include: {
              category: true
            }
          },
          baseProduct: {
            include: {
              categories: true
            }
          }
        }
      });

      console.log(`Produits trouvés avec logique OR combinée: ${combinedProducts.length}`);
      combinedProducts.forEach(p => {
        const hasDesignCategory = p.design?.category?.name;
        const hasBaseCategories = p.baseProduct?.categories?.map(cat => cat.name).join(', ') || 'Aucune';
        console.log(`- Produit ${p.id}: ${p.name} | DesignCat: ${hasDesignCategory || 'NULL'} | BaseCats: [${hasBaseCategories}]`);
      });
    }

    // 5. Vérification des produits sans catégories
    console.log('\n❓ Produits sans catégories:');
    const uncategorizedProducts = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          {
            OR: [
              { design: null },
              { design: { categoryId: null } }
            ]
          },
          {
            OR: [
              { baseProduct: null },
              {
                baseProduct: {
                  categories: {
                    none: {}
                  }
                }
              }
            ]
          }
        ]
      },
      take: 5,
      include: {
        design: {
          include: {
            category: true
          }
        },
        baseProduct: {
          include: {
            categories: true
          }
        }
      }
    });

    console.log(`Produits sans catégories: ${uncategorizedProducts.length}`);
    uncategorizedProducts.forEach(p => {
      const categoryNames = p.baseProduct?.categories?.map(cat => cat.name).join(', ') || 'Aucune';
      console.log(`- Produit ${p.id}: ${p.name} | Design: ${p.design?.name || 'NULL'} | DesignCat: ${p.design?.category?.name || 'NULL'} | BaseCats: [${categoryNames}]`);
    });

    console.log('\n✅ Test terminé!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategorieComplete();