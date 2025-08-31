/**
 * 📊 Script de Population des Données de Meilleures Ventes
 * 
 * Ce script remplit les champs isBestSeller, salesCount et totalRevenue
 * dans la table VendorProduct avec des données simulées.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateBestSellerData() {
  console.log('🏆 Remplissage des données de meilleures ventes...\n');

  try {
    // 1. Vérifier s'il y a des produits vendeurs
    console.log('1️⃣ Vérification des produits vendeurs existants...');
    
    const totalProducts = await prisma.vendorProduct.count({
      where: { isDelete: false }
    });

    if (totalProducts === 0) {
      console.log('⚠️ Aucun produit vendeur trouvé. Création de produits de test...');
      await createMockVendorProducts();
    }

    // 2. Simuler des commandes pour générer des statistiques de vente
    console.log('\n2️⃣ Simulation de commandes pour générer des statistiques...');
    
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: { isDelete: false },
      include: {
        baseProduct: true,
        vendor: true
      }
    });

    console.log(`📦 ${vendorProducts.length} produits trouvés`);

    // 3. Générer des statistiques de vente aléatoires
    console.log('\n3️⃣ Génération des statistiques de vente...');
    
    for (const product of vendorProducts) {
      // Générer des statistiques aléatoires réalistes
      const salesCount = Math.floor(Math.random() * 50) + 1; // 1-50 ventes
      const totalRevenue = salesCount * product.price * (0.8 + Math.random() * 0.4); // 80-120% du prix
      
      await prisma.vendorProduct.update({
        where: { id: product.id },
        data: {
          salesCount,
          totalRevenue: Math.round(totalRevenue),
          isBestSeller: false // Sera mis à jour après
        }
      });

      console.log(`   ✅ Produit ${product.id}: ${salesCount} ventes, ${Math.round(totalRevenue)} FCFA`);
    }

    // 4. Marquer les meilleures ventes (top 10% ou minimum 3)
    console.log('\n4️⃣ Marquage des meilleures ventes...');
    
    const productsWithRevenue = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        totalRevenue: { gt: 0 }
      },
      orderBy: {
        totalRevenue: 'desc'
      }
    });

    console.log(`📊 Produits avec revenus trouvés: ${productsWithRevenue.length}`);
    productsWithRevenue.forEach((product, index) => {
      console.log(`   ${index + 1}. ID ${product.id}: ${product.salesCount} ventes, ${product.totalRevenue} FCFA, Status: ${product.status}`);
    });

    if (productsWithRevenue.length > 0) {
      // Calculer le seuil pour les meilleures ventes (top 10% ou minimum 3)
      const topSellerCount = Math.max(3, Math.ceil(productsWithRevenue.length * 0.1));
      const topSellers = productsWithRevenue.slice(0, topSellerCount);

      console.log(`🏆 Marquage de ${topSellers.length} produits comme meilleures ventes (top ${topSellerCount}):`);
      
      // D'abord, réinitialiser tous les isBestSeller à false
      const resetResult = await prisma.vendorProduct.updateMany({
        where: { isDelete: false },
        data: { isBestSeller: false }
      });
      console.log(`   🔄 ${resetResult.count} produits réinitialisés`);

      // Ensuite, marquer les meilleures ventes
      let markedCount = 0;
      for (const product of productsWithRevenue) {
        const isBestSeller = topSellers.some(top => top.id === product.id);
        
        const updateResult = await prisma.vendorProduct.update({
          where: { id: product.id },
          data: { 
            isBestSeller,
            status: isBestSeller ? 'PUBLISHED' : product.status // Mettre à jour le statut pour les meilleures ventes
          }
        });

        if (isBestSeller) {
          markedCount++;
          console.log(`   🏆 ID ${product.id}: ${product.salesCount} ventes, ${product.totalRevenue} FCFA - MARQUÉ (Status: PUBLISHED)`);
        }
      }
      
      console.log(`✅ ${markedCount} produits marqués comme meilleures ventes`);
    }

    // 5. Statistiques finales
    console.log('\n5️⃣ Statistiques finales...');
    
    const bestSellers = await prisma.vendorProduct.count({
      where: {
        isDelete: false,
        isBestSeller: true
      }
    });

    const totalRevenue = await prisma.vendorProduct.aggregate({
      where: { isDelete: false },
      _sum: { totalRevenue: true }
    });

    const totalSales = await prisma.vendorProduct.aggregate({
      where: { isDelete: false },
      _sum: { salesCount: true }
    });

    console.log(`   📊 Produits totaux: ${totalProducts}`);
    console.log(`   🏆 Meilleures ventes: ${bestSellers}`);
    console.log(`   💰 Ventes totales: ${totalSales._sum.salesCount || 0}`);
    console.log(`   💵 Revenus totaux: ${totalRevenue._sum.totalRevenue || 0} FCFA`);

    // 6. Afficher les top 5 meilleures ventes
    console.log('\n🏆 Top 5 des meilleures ventes:');
    const top5BestSellers = await prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        isBestSeller: true
      },
      include: {
        baseProduct: true,
        vendor: true
      },
      orderBy: {
        totalRevenue: 'desc'
      },
      take: 5
    });

    top5BestSellers.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name || `Produit ${product.id}`}`);
      console.log(`      - Ventes: ${product.salesCount} unités`);
      console.log(`      - Revenus: ${product.totalRevenue} FCFA`);
      console.log(`      - Prix unitaire: ${product.price} FCFA`);
      console.log(`      - Vendeur: ${product.vendor?.firstName || 'N/A'} ${product.vendor?.lastName || 'N/A'}`);
      console.log('');
    });

    console.log('\n✅ Population des données de meilleures ventes terminée avec succès !');
    console.log('\n🎯 Maintenant vous pouvez tester:');
    console.log('   curl -X GET "http://localhost:3004/public/best-sellers"');

  } catch (error) {
    console.error('❌ Erreur lors de la population des données:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createMockVendorProducts() {
  console.log('🔧 Création de produits de test...');
  
  // Créer quelques produits de test avec des données simulées
  const mockProducts = [
    {
      name: 'T-shirt Design Unique',
      price: 2500,
      status: 'PUBLISHED',
      isValidated: true,
      isDelete: false,
      salesCount: 45,
      totalRevenue: 112500,
      isBestSeller: true
    },
    {
      name: 'Mug Personnalisé',
      price: 1500,
      status: 'PUBLISHED',
      isValidated: true,
      isDelete: false,
      salesCount: 32,
      totalRevenue: 48000,
      isBestSeller: true
    },
    {
      name: 'Casquette Brodée',
      price: 1800,
      status: 'PUBLISHED',
      isValidated: true,
      isDelete: false,
      salesCount: 28,
      totalRevenue: 50400,
      isBestSeller: true
    }
  ];

  for (const productData of mockProducts) {
    await prisma.vendorProduct.create({
      data: {
        ...productData,
        vendorId: 1, // Assurez-vous que l'utilisateur 1 existe
        baseProductId: 1, // Assurez-vous que le produit de base 1 existe
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`   ✅ Produit de test créé: ${productData.name}`);
  }
}

// Exécuter le script
populateBestSellerData().catch(console.error); 