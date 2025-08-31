const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function testDesignImplementation() {
  console.log('🚀 Test de l\'implémentation du module Design');
  console.log('==========================================\n');

  try {
    // Test 1: Vérifier la connexion à la base de données
    console.log('📊 Test 1: Connexion à la base de données...');
    await prisma.$connect();
    console.log('✅ Connexion réussie\n');

    // Test 2: Vérifier l'existence d'un utilisateur vendeur
    console.log('👤 Test 2: Vérification des utilisateurs vendeurs...');
    const vendors = await prisma.user.findMany({
      where: { role: 'VENDEUR' },
      take: 5
    });
    console.log(`✅ ${vendors.length} vendeur(s) trouvé(s)`);
    if (vendors.length > 0) {
      console.log(`   Premier vendeur: ${vendors[0].firstName} ${vendors[0].lastName} (ID: ${vendors[0].id})`);
    }
    console.log('');

    // Test 3: Vérifier la structure des tables
    console.log('🗄️  Test 3: Vérification de la structure des tables...');
    
    // Vérifier si la table Design existe
    try {
      const designCount = await prisma.design.count();
      console.log(`✅ Table Design accessible - ${designCount} design(s) existant(s)`);
    } catch (error) {
      console.log('❌ Table Design non accessible:', error.message);
      console.log('💡 Vous devez exécuter la migration de base de données.');
      console.log('   Commande: npx prisma db push --accept-data-loss');
      return;
    }
    console.log('');

    // Test 4: Test de création d'un design (simulation)
    console.log('🎨 Test 4: Simulation de création de design...');
    if (vendors.length > 0) {
      const testDesignData = {
        vendorId: vendors[0].id,
        name: 'Test Logo Design',
        description: 'Un logo de test pour validation',
        price: 2500,
        category: 'LOGO',
        imageUrl: 'https://example.com/test-logo.jpg',
        cloudinaryPublicId: 'test/logo_' + Date.now(),
        fileSize: 1024000,
        originalFileName: 'test-logo.png',
        dimensions: { width: 1000, height: 1000 },
        format: 'png',
        tags: ['test', 'logo', 'moderne']
      };

      try {
        const newDesign = await prisma.design.create({
          data: testDesignData
        });
        console.log(`✅ Design créé avec succès (ID: ${newDesign.id})`);
        console.log(`   Nom: ${newDesign.name}`);
        console.log(`   Prix: ${newDesign.price} FCFA`);
        console.log(`   Catégorie: ${newDesign.category}`);
      } catch (error) {
        console.log('❌ Erreur lors de la création:', error.message);
      }
    } else {
      console.log('⚠️  Aucun vendeur disponible pour le test');
    }
    console.log('');

    // Test 5: Test de récupération des designs
    console.log('📋 Test 5: Récupération des designs...');
    try {
      const designs = await prisma.design.findMany({
        take: 5,
        include: {
          vendor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      console.log(`✅ ${designs.length} design(s) récupéré(s)`);
      designs.forEach((design, index) => {
        console.log(`   ${index + 1}. ${design.name} - ${design.price} FCFA (${design.vendor.firstName} ${design.vendor.lastName})`);
      });
    } catch (error) {
      console.log('❌ Erreur lors de la récupération:', error.message);
    }
    console.log('');

    // Test 6: Test des statistiques
    console.log('📈 Test 6: Calcul des statistiques...');
    if (vendors.length > 0) {
      try {
        const vendorId = vendors[0].id;
        const [total, published, draft, earnings] = await Promise.all([
          prisma.design.count({ where: { vendorId } }),
          prisma.design.count({ where: { vendorId, isPublished: true } }),
          prisma.design.count({ where: { vendorId, isDraft: true } }),
          prisma.design.aggregate({
            where: { vendorId },
            _sum: { earnings: true, views: true, likes: true }
          })
        ]);

        console.log(`✅ Statistiques du vendeur ${vendors[0].firstName}:`);
        console.log(`   Total designs: ${total}`);
        console.log(`   Publiés: ${published}`);
        console.log(`   Brouillons: ${draft}`);
        console.log(`   Gains totaux: ${earnings._sum.earnings || 0} FCFA`);
        console.log(`   Vues totales: ${earnings._sum.views || 0}`);
        console.log(`   Likes totaux: ${earnings._sum.likes || 0}`);
      } catch (error) {
        console.log('❌ Erreur lors du calcul des statistiques:', error.message);
      }
    }
    console.log('');

    // Test 7: Validation des contraintes
    console.log('🔒 Test 7: Validation des contraintes...');
    if (vendors.length > 0) {
      try {
        // Test du prix minimum
        await prisma.design.create({
          data: {
            vendorId: vendors[0].id,
            name: 'Test contrainte prix',
            price: 50, // Moins que le minimum (100)
            category: 'LOGO',
            imageUrl: 'https://example.com/test.jpg',
            cloudinaryPublicId: 'test/invalid_price'
          }
        });
        console.log('❌ Contrainte de prix minimum non respectée');
      } catch (error) {
        console.log('✅ Contrainte de prix minimum validée');
      }

      try {
        // Test du nom vide
        await prisma.design.create({
          data: {
            vendorId: vendors[0].id,
            name: '', // Nom vide
            price: 1000,
            category: 'LOGO',
            imageUrl: 'https://example.com/test.jpg',
            cloudinaryPublicId: 'test/invalid_name'
          }
        });
        console.log('❌ Contrainte de nom non vide non respectée');
      } catch (error) {
        console.log('✅ Contrainte de nom non vide validée');
      }
    }
    console.log('');

    console.log('🎉 Tests terminés avec succès !');
    console.log('\n📖 Prochaines étapes:');
    console.log('1. Tester les endpoints API avec Postman ou curl');
    console.log('2. Intégrer le frontend avec les nouveaux endpoints');
    console.log('3. Configurer les uploads Cloudinary');
    console.log('4. Ajouter des tests unitaires et d\'intégration');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction utilitaire pour afficher les endpoints disponibles
function displayAPIEndpoints() {
  console.log('\n🔗 Endpoints API disponibles:');
  console.log('=====================================');
  console.log('POST   /api/designs                 - Créer un design');
  console.log('GET    /api/designs                 - Liste des designs');
  console.log('GET    /api/designs/:id             - Détails d\'un design');
  console.log('PUT    /api/designs/:id             - Modifier un design');
  console.log('PATCH  /api/designs/:id/publish     - Publier/dépublier');
  console.log('DELETE /api/designs/:id             - Supprimer un design');
  console.log('GET    /api/designs/stats/overview  - Statistiques');
  console.log('\n📝 Headers requis:');
  console.log('Authorization: Bearer <jwt_token>');
  console.log('Content-Type: multipart/form-data (pour POST)');
  console.log('Content-Type: application/json (pour PUT/PATCH)');
}

// Exécuter les tests
if (require.main === module) {
  testDesignImplementation()
    .then(() => {
      displayAPIEndpoints();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testDesignImplementation }; 