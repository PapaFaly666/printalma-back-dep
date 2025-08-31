const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testShopNameUnique() {
  try {
    console.log('🧪 Test de la contrainte d\'unicité du shop_name...');
    
    // Test 1: Créer un premier vendeur avec un nom de boutique
    console.log('\n1️⃣ Création du premier vendeur avec shop_name "Boutique Test"...');
    const vendor1 = await prisma.user.create({
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@test.com',
        password: 'password123',
        role: 'VENDEUR',
        vendeur_type: 'DESIGNER',
        shop_name: 'Boutique Test'
      }
    });
    console.log('✅ Premier vendeur créé:', vendor1.id);
    
    // Test 2: Essayer de créer un deuxième vendeur avec le même nom de boutique
    console.log('\n2️⃣ Tentative de création d\'un deuxième vendeur avec le même shop_name...');
    try {
      const vendor2 = await prisma.user.create({
        data: {
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie.martin@test.com',
          password: 'password123',
          role: 'VENDEUR',
          vendeur_type: 'ARTISTE',
          shop_name: 'Boutique Test' // Même nom de boutique
        }
      });
      console.log('❌ ERREUR: Le deuxième vendeur a été créé alors qu\'il ne devrait pas');
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('shop_name')) {
        console.log('✅ SUCCÈS: La contrainte d\'unicité fonctionne !');
        console.log('📝 Message d\'erreur:', error.message);
      } else {
        console.log('❌ ERREUR: Type d\'erreur inattendu:', error);
      }
    }
    
    // Test 3: Créer un vendeur avec un nom de boutique différent
    console.log('\n3️⃣ Création d\'un vendeur avec un shop_name différent...');
    const vendor3 = await prisma.user.create({
      data: {
        firstName: 'Pierre',
        lastName: 'Durand',
        email: 'pierre.durand@test.com',
        password: 'password123',
        role: 'VENDEUR',
        vendeur_type: 'INFLUENCEUR',
        shop_name: 'Boutique Autre' // Nom différent
      }
    });
    console.log('✅ Troisième vendeur créé avec succès:', vendor3.id);
    
    // Test 4: Créer un vendeur sans nom de boutique
    console.log('\n4️⃣ Création d\'un vendeur sans shop_name...');
    const vendor4 = await prisma.user.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie.leroy@test.com',
        password: 'password123',
        role: 'VENDEUR',
        vendeur_type: 'DESIGNER',
        shop_name: null // Pas de nom de boutique
      }
    });
    console.log('✅ Quatrième vendeur créé sans shop_name:', vendor4.id);
    
    // Test 5: Essayer de créer un autre vendeur sans nom de boutique
    console.log('\n5️⃣ Création d\'un autre vendeur sans shop_name...');
    const vendor5 = await prisma.user.create({
      data: {
        firstName: 'Paul',
        lastName: 'Moreau',
        email: 'paul.moreau@test.com',
        password: 'password123',
        role: 'VENDEUR',
        vendeur_type: 'ARTISTE',
        shop_name: null // Pas de nom de boutique
      }
    });
    console.log('✅ Cinquième vendeur créé sans shop_name:', vendor5.id);
    
    console.log('\n🎉 Tous les tests sont passés ! La contrainte d\'unicité fonctionne correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopNameUnique(); 