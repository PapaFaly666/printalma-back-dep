const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserStatus() {
  console.log('🔍 Diagnostic du Statut Utilisateur Vendeur\n');

  try {
    // 1. Lister tous les utilisateurs avec rôle VENDEUR
    console.log('📋 Tous les utilisateurs VENDEUR:');
    const vendeurs = await prisma.user.findMany({
      where: { role: 'VENDEUR' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        vendeur_type: true,
        created_at: true
      }
    });

    if (vendeurs.length === 0) {
      console.log('❌ Aucun utilisateur avec le rôle VENDEUR trouvé');
      
      // Vérifier tous les utilisateurs
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true
        }
      });
      
      console.log('\n📋 Tous les utilisateurs dans la base:');
      allUsers.forEach(user => {
        console.log(`   ID: ${user.id}, Email: ${user.email}, Rôle: ${user.role}, Statut: ${user.status}`);
      });
      
    } else {
      vendeurs.forEach(vendeur => {
        const statusIcon = vendeur.status ? '✅' : '❌';
        console.log(`   ${statusIcon} ID: ${vendeur.id}`);
        console.log(`      Nom: ${vendeur.firstName} ${vendeur.lastName}`);
        console.log(`      Email: ${vendeur.email}`);
        console.log(`      Rôle: ${vendeur.role}`);
        console.log(`      Statut: ${vendeur.status} ${vendeur.status ? '(ACTIF)' : '(INACTIF)'}`);
        console.log(`      Type: ${vendeur.vendeur_type || 'Non défini'}`);
        console.log(`      Créé le: ${vendeur.created_at}`);
        console.log('');
      });
    }

    // 2. Vérifier les rôles disponibles
    console.log('\n📋 Rôles disponibles dans le système:');
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    roles.forEach(roleGroup => {
      console.log(`   ${roleGroup.role}: ${roleGroup._count.role} utilisateur(s)`);
    });

    // 3. Vérifier les statuts
    console.log('\n📋 Statuts des utilisateurs:');
    const statuses = await prisma.user.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    statuses.forEach(statusGroup => {
      const statusLabel = statusGroup.status ? 'ACTIF' : 'INACTIF';
      console.log(`   ${statusLabel}: ${statusGroup._count.status} utilisateur(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function activateVendorUser(userId) {
  console.log(`🔧 Activation du vendeur ID: ${userId}\n`);

  try {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      console.log(`❌ Utilisateur avec ID ${userId} non trouvé`);
      return;
    }

    console.log('📋 Utilisateur trouvé:');
    console.log(`   Nom: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rôle actuel: ${user.role}`);
    console.log(`   Statut actuel: ${user.status}`);

    // Mettre à jour le rôle et le statut
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        role: 'VENDEUR',
        status: true
      }
    });

    console.log('\n✅ Utilisateur mis à jour avec succès:');
    console.log(`   Nouveau rôle: ${updatedUser.role}`);
    console.log(`   Nouveau statut: ${updatedUser.status}`);
    console.log(`   L'utilisateur peut maintenant utiliser l'API vendeur`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createVendorUser(email, firstName, lastName) {
  console.log(`🔧 Création d'un nouveau vendeur: ${email}\n`);

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`⚠️ Utilisateur avec email ${email} existe déjà`);
      console.log(`   ID: ${existingUser.id}, Rôle: ${existingUser.role}, Statut: ${existingUser.status}`);
      
      if (existingUser.role !== 'VENDEUR' || !existingUser.status) {
        console.log('🔧 Activation de l\'utilisateur existant...');
        await activateVendorUser(existingUser.id);
      } else {
        console.log('✅ L\'utilisateur est déjà un vendeur actif');
      }
      return;
    }

    // Créer un nouveau vendeur
    const newVendor = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: 'VENDEUR',
        status: true,
        vendeur_type: 'DESIGNER', // Valeur par défaut
        password: '$2b$10$defaultPasswordHash' // Hash temporaire
      }
    });

    console.log('✅ Nouveau vendeur créé avec succès:');
    console.log(`   ID: ${newVendor.id}`);
    console.log(`   Email: ${newVendor.email}`);
    console.log(`   Nom: ${newVendor.firstName} ${newVendor.lastName}`);
    console.log(`   Rôle: ${newVendor.role}`);
    console.log(`   Statut: ${newVendor.status}`);
    console.log(`   ⚠️ N'oubliez pas de définir un mot de passe sécurisé`);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour tester l'authentification avec cookies
async function testCookieAuth() {
  console.log('🍪 Test de l\'authentification par cookies\n');
  
  // Cette fonction sera utile pour débugger les problèmes d'auth avec cookies
  console.log('💡 Pour tester l\'authentification par cookies:');
  console.log('   1. Connectez-vous sur le frontend');
  console.log('   2. Ouvrez les DevTools > Application > Cookies');
  console.log('   3. Vérifiez la présence du cookie JWT');
  console.log('   4. Copiez la valeur du cookie');
  console.log('   5. Testez avec cette valeur dans les headers');
  console.log('');
  console.log('🔧 Headers à utiliser pour les tests:');
  console.log('   Cookie: jwt=<VALEUR_DU_COOKIE>');
  console.log('   ou');
  console.log('   Authorization: Bearer <TOKEN_JWT>');
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🛠️ Utilitaire de Gestion des Vendeurs\n');

  switch (command) {
    case 'debug':
      await debugUserStatus();
      break;
      
    case 'activate':
      const userId = args[1];
      if (!userId) {
        console.log('❌ Usage: node debug-user-status.js activate <USER_ID>');
        console.log('   Exemple: node debug-user-status.js activate 1');
        return;
      }
      await activateVendorUser(userId);
      break;
      
    case 'create':
      const [email, firstName, lastName] = args.slice(1);
      if (!email || !firstName || !lastName) {
        console.log('❌ Usage: node debug-user-status.js create <EMAIL> <FIRST_NAME> <LAST_NAME>');
        console.log('   Exemple: node debug-user-status.js create vendor@example.com Jean Dupont');
        return;
      }
      await createVendorUser(email, firstName, lastName);
      break;
      
    case 'test-auth':
      await testCookieAuth();
      break;
      
    default:
      console.log('📚 Commandes disponibles:');
      console.log('   debug                                    - Diagnostiquer tous les vendeurs');
      console.log('   activate <USER_ID>                      - Activer un vendeur existant');
      console.log('   create <EMAIL> <FIRST_NAME> <LAST_NAME> - Créer un nouveau vendeur');
      console.log('   test-auth                               - Guide test authentification cookies');
      console.log('');
      console.log('📋 Exemples:');
      console.log('   node debug-user-status.js debug');
      console.log('   node debug-user-status.js activate 1');
      console.log('   node debug-user-status.js create vendor@test.com Jean Vendeur');
      console.log('   node debug-user-status.js test-auth');
      
      // Exécuter le diagnostic par défaut
      await debugUserStatus();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugUserStatus,
  activateVendorUser,
  createVendorUser,
  testCookieAuth
}; 