const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(express.json());

const prisma = new PrismaClient({
  log: ['info'],
});

// Endpoint de test pour le debug
app.get('/test-category-filter', async (req, res) => {
  try {
    const { category } = req.query;

    console.log('🔍 Requête reçue pour la catégorie:', JSON.stringify(category));

    if (!category) {
      return res.json({ error: 'Paramètre category requis' });
    }

    // 1. Chercher la catégorie
    console.log('1. Recherche de la catégorie...');
    const foundCategory = await prisma.designCategory.findFirst({
      where: {
        name: {
          equals: category,
          mode: 'insensitive'
        }
      }
    });

    console.log('2. Catégorie trouvée:', foundCategory ? `OUI (ID: ${foundCategory.id}, Nom: "${foundCategory.name}")` : 'NON');

    if (foundCategory) {
      // 2. Chercher les produits avec cette catégorie
      console.log('3. Recherche des produits...');
      const products = await prisma.vendorProduct.findMany({
        where: {
          design: {
            categoryId: foundCategory.id
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

      console.log('4. Produits trouvés:', products.length);

      const result = {
        success: true,
        category: foundCategory.name,
        categoryId: foundCategory.id,
        productsFound: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          designName: p.design?.name,
          categoryName: p.design?.category?.name,
          designCategoryId: p.design?.categoryId
        }))
      };

      console.log('5. Résultat retourné:', result);
      return res.json(result);

    } else {
      console.log('6. Catégorie non trouvée - retour vide');
      return res.json({
        success: true,
        category: category,
        message: 'Catégorie non trouvée',
        productsFound: 0,
        products: []
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 3010;
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log('Test: http://localhost:3010/test-category-filter?category=Test');
});