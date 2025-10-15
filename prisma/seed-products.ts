import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts(categoryData: any) {
  console.log('🛍️  Seeding products...');

  const { categories, subCategories, variations } = categoryData;

  const products = [];

  // Produits T-Shirts
  const tshirtProducts = [
    {
      name: 'T-Shirt Col Rond Blanc',
      description: 'T-shirt 100% coton bio avec col rond, parfait pour la personnalisation',
      price: 15.99,
      stock: 150,
      suggestedPrice: 25.99,
      genre: 'UNISEXE',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.tshirts.id,
      variationId: variations.colRond.id,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Blanc', code: '#FFFFFF' },
        { name: 'Noir', code: '#000000' },
        { name: 'Gris', code: '#808080' },
      ],
    },
    {
      name: 'T-Shirt Col V Noir',
      description: 'T-shirt élégant à col V, coupe ajustée',
      price: 17.99,
      stock: 120,
      suggestedPrice: 27.99,
      genre: 'HOMME',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.tshirts.id,
      variationId: variations.colV.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Noir', code: '#000000' },
        { name: 'Marine', code: '#000080' },
        { name: 'Bordeaux', code: '#800020' },
      ],
    },
    {
      name: 'T-Shirt Manches Longues',
      description: 'T-shirt à manches longues, idéal pour toutes saisons',
      price: 19.99,
      stock: 100,
      suggestedPrice: 29.99,
      genre: 'UNISEXE',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.tshirts.id,
      variationId: variations.manchesLongues.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Blanc', code: '#FFFFFF' },
        { name: 'Noir', code: '#000000' },
      ],
    },
  ];

  // Produits Sweats
  const sweatProducts = [
    {
      name: 'Hoodie Classique',
      description: 'Sweat à capuche confortable avec poche kangourou',
      price: 35.99,
      stock: 80,
      suggestedPrice: 49.99,
      genre: 'UNISEXE',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.sweats.id,
      variationId: variations.hoodie.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'Noir', code: '#000000' },
        { name: 'Gris Chiné', code: '#B0B0B0' },
        { name: 'Marine', code: '#000080' },
      ],
    },
    {
      name: 'Zip Hoodie Premium',
      description: 'Sweat zippé haut de gamme, doublure polaire',
      price: 42.99,
      stock: 60,
      suggestedPrice: 59.99,
      genre: 'UNISEXE',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.sweats.id,
      variationId: variations.zipHoodie.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Noir', code: '#000000' },
        { name: 'Gris', code: '#808080' },
      ],
    },
  ];

  // Produits Pantalons
  const pantalonProducts = [
    {
      name: 'Jogging Confort',
      description: 'Pantalon de jogging en coton, taille élastique',
      price: 28.99,
      stock: 70,
      suggestedPrice: 39.99,
      genre: 'UNISEXE',
      categoryId: categories.vetements.id,
      subCategoryId: subCategories.pantalons.id,
      variationId: null,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Noir', code: '#000000' },
        { name: 'Gris', code: '#808080' },
        { name: 'Marine', code: '#000080' },
      ],
    },
  ];

  // Produits Accessoires
  const accessoireProducts = [
    {
      name: 'Tote Bag Canvas',
      description: 'Sac en toile de coton naturel, grande capacité',
      price: 12.99,
      stock: 200,
      suggestedPrice: 19.99,
      genre: 'UNISEXE',
      categoryId: categories.accessoires.id,
      subCategoryId: subCategories.sacs.id,
      variationId: null,
      sizes: ['Unique'],
      colors: [
        { name: 'Naturel', code: '#F5F5DC' },
        { name: 'Noir', code: '#000000' },
      ],
    },
    {
      name: 'Casquette Snapback',
      description: 'Casquette ajustable, visière plate',
      price: 16.99,
      stock: 150,
      suggestedPrice: 24.99,
      genre: 'UNISEXE',
      categoryId: categories.accessoires.id,
      subCategoryId: subCategories.casquettes.id,
      variationId: null,
      sizes: ['Unique'],
      colors: [
        { name: 'Noir', code: '#000000' },
        { name: 'Blanc', code: '#FFFFFF' },
        { name: 'Marine', code: '#000080' },
      ],
    },
  ];

  const allProductsData = [
    ...tshirtProducts,
    ...sweatProducts,
    ...pantalonProducts,
    ...accessoireProducts,
  ];

  // Créer tous les produits
  for (const productData of allProductsData) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        suggestedPrice: productData.suggestedPrice,
        status: 'PUBLISHED',
        genre: productData.genre as any,
        isReadyProduct: true,
        isValidated: true,
        categoryId: productData.categoryId,
        subCategoryId: productData.subCategoryId,
        variationId: productData.variationId,
        categories: {
          connect: [{ id: productData.categoryId }],
        },
      },
    });

    // Créer les tailles
    for (const size of productData.sizes) {
      await prisma.productSize.create({
        data: {
          productId: product.id,
          sizeName: size,
        },
      });
    }

    // Créer les variations de couleur
    for (const color of productData.colors) {
      const colorVariation = await prisma.colorVariation.create({
        data: {
          name: color.name,
          colorCode: color.code,
          productId: product.id,
        },
      });

      // Créer une image par défaut pour chaque couleur
      await prisma.productImage.create({
        data: {
          view: 'Front',
          url: `https://via.placeholder.com/800x800/${color.code.replace('#', '')}/${color.code.replace('#', '')}?text=${encodeURIComponent(product.name)}`,
          publicId: `product_${product.id}_${color.name.toLowerCase()}_front`,
          naturalWidth: 800,
          naturalHeight: 800,
          colorVariationId: colorVariation.id,
        },
      });

      // Créer les stocks pour chaque combinaison couleur/taille
      for (const size of productData.sizes) {
        await prisma.productStock.create({
          data: {
            productId: product.id,
            colorId: colorVariation.id,
            sizeName: size,
            stock: Math.floor(productData.stock / (productData.colors.length * productData.sizes.length)),
          },
        });
      }
    }

    products.push(product);
  }

  console.log(`✅ ${products.length} products created with sizes, colors, and stocks`);

  return products;
}
