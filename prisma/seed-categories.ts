import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  console.log('🏷️  Seeding categories...');

  // Niveau 0 - Catégories principales
  const vetements = await prisma.category.upsert({
    where: { slug: 'vetements' },
    update: {},
    create: {
      name: 'Vêtements',
      slug: 'vetements',
      description: 'Tous les vêtements personnalisables',
      displayOrder: 1,
      isActive: true,
    },
  });

  const accessoires = await prisma.category.upsert({
    where: { slug: 'accessoires' },
    update: {},
    create: {
      name: 'Accessoires',
      slug: 'accessoires',
      description: 'Accessoires personnalisables',
      displayOrder: 2,
      isActive: true,
    },
  });

  const maison = await prisma.category.upsert({
    where: { slug: 'maison' },
    update: {},
    create: {
      name: 'Maison',
      slug: 'maison',
      description: 'Articles pour la maison personnalisables',
      displayOrder: 3,
      isActive: true,
    },
  });

  console.log('✅ Categories created');

  // Niveau 1 - Sous-catégories pour Vêtements
  const tshirts = await prisma.subCategory.upsert({
    where: {
      unique_subcategory_per_category: {
        name: 'T-Shirts',
        categoryId: vetements.id,
      }
    },
    update: {},
    create: {
      name: 'T-Shirts',
      slug: 'tshirts',
      description: 'T-shirts personnalisables',
      categoryId: vetements.id,
      displayOrder: 1,
      isActive: true,
    },
  });

  const sweats = await prisma.subCategory.upsert({
    where: {
      unique_subcategory_per_category: {
        name: 'Sweats',
        categoryId: vetements.id,
      }
    },
    update: {},
    create: {
      name: 'Sweats',
      slug: 'sweats',
      description: 'Sweats et hoodies personnalisables',
      categoryId: vetements.id,
      displayOrder: 2,
      isActive: true,
    },
  });

  const pantalons = await prisma.subCategory.upsert({
    where: {
      unique_subcategory_per_category: {
        name: 'Pantalons',
        categoryId: vetements.id,
      }
    },
    update: {},
    create: {
      name: 'Pantalons',
      slug: 'pantalons',
      description: 'Pantalons et jeans personnalisables',
      categoryId: vetements.id,
      displayOrder: 3,
      isActive: true,
    },
  });

  // Sous-catégories pour Accessoires
  const sacs = await prisma.subCategory.upsert({
    where: {
      unique_subcategory_per_category: {
        name: 'Sacs',
        categoryId: accessoires.id,
      }
    },
    update: {},
    create: {
      name: 'Sacs',
      slug: 'sacs',
      description: 'Sacs personnalisables',
      categoryId: accessoires.id,
      displayOrder: 1,
      isActive: true,
    },
  });

  const casquettes = await prisma.subCategory.upsert({
    where: {
      unique_subcategory_per_category: {
        name: 'Casquettes',
        categoryId: accessoires.id,
      }
    },
    update: {},
    create: {
      name: 'Casquettes',
      slug: 'casquettes',
      description: 'Casquettes personnalisables',
      categoryId: accessoires.id,
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log('✅ SubCategories created');

  // Niveau 2 - Variations pour T-Shirts
  const colRond = await prisma.variation.upsert({
    where: {
      unique_variation_per_subcategory: {
        name: 'Col Rond',
        subCategoryId: tshirts.id,
      }
    },
    update: {},
    create: {
      name: 'Col Rond',
      slug: 'col-rond',
      description: 'T-shirt à col rond classique',
      subCategoryId: tshirts.id,
      displayOrder: 1,
      isActive: true,
    },
  });

  const colV = await prisma.variation.upsert({
    where: {
      unique_variation_per_subcategory: {
        name: 'Col V',
        subCategoryId: tshirts.id,
      }
    },
    update: {},
    create: {
      name: 'Col V',
      slug: 'col-v',
      description: 'T-shirt à col V',
      subCategoryId: tshirts.id,
      displayOrder: 2,
      isActive: true,
    },
  });

  const manchesLongues = await prisma.variation.upsert({
    where: {
      unique_variation_per_subcategory: {
        name: 'Manches Longues',
        subCategoryId: tshirts.id,
      }
    },
    update: {},
    create: {
      name: 'Manches Longues',
      slug: 'manches-longues',
      description: 'T-shirt à manches longues',
      subCategoryId: tshirts.id,
      displayOrder: 3,
      isActive: true,
    },
  });

  // Variations pour Sweats
  const hoodie = await prisma.variation.upsert({
    where: {
      unique_variation_per_subcategory: {
        name: 'Hoodie',
        subCategoryId: sweats.id,
      }
    },
    update: {},
    create: {
      name: 'Hoodie',
      slug: 'hoodie',
      description: 'Sweat à capuche',
      subCategoryId: sweats.id,
      displayOrder: 1,
      isActive: true,
    },
  });

  const zipHoodie = await prisma.variation.upsert({
    where: {
      unique_variation_per_subcategory: {
        name: 'Zip Hoodie',
        subCategoryId: sweats.id,
      }
    },
    update: {},
    create: {
      name: 'Zip Hoodie',
      slug: 'zip-hoodie',
      description: 'Sweat à capuche zippé',
      subCategoryId: sweats.id,
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log('✅ Variations created');

  return {
    categories: { vetements, accessoires, maison },
    subCategories: { tshirts, sweats, pantalons, sacs, casquettes },
    variations: { colRond, colV, manchesLongues, hoodie, zipHoodie },
  };
}
