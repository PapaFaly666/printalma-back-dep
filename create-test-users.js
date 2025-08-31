const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('👥 === CRÉATION UTILISATEURS DE TEST ===\n');

    // 1. Vérifier les utilisateurs existants
    console.log('1️⃣ Vérification utilisateurs existants...');
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    console.log(`📊 ${existingUsers.length} utilisateurs trouvés:`);
    existingUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status ? 'Actif' : 'Inactif'}`);
    });

    // 2. Créer utilisateur vendeur s'il n'existe pas
    console.log('\n2️⃣ Création utilisateur vendeur...');
    const vendeurEmail = 'vendeur@test.com';
    const existingVendeur = await prisma.user.findUnique({
      where: { email: vendeurEmail }
    });

    if (existingVendeur) {
      console.log('✅ Utilisateur vendeur existe déjà');
      
      // Vérifier et mettre à jour si nécessaire
      if (!existingVendeur.status || existingVendeur.role !== 'VENDEUR') {
        await prisma.user.update({
          where: { email: vendeurEmail },
          data: {
            status: true,
            role: 'VENDEUR',
            vendeur_type: 'DESIGNER'
          }
        });
        console.log('🔄 Utilisateur vendeur mis à jour');
      }
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await prisma.user.create({
        data: {
          firstName: 'Vendeur',
          lastName: 'Test',
          email: vendeurEmail,
          password: hashedPassword,
          role: 'VENDEUR',
          status: true,
          vendeur_type: 'DESIGNER'
        }
      });
      console.log('✅ Utilisateur vendeur créé');
    }

    // 3. Créer utilisateur admin s'il n'existe pas
    console.log('\n3️⃣ Création utilisateur admin...');
    const adminEmail = 'admin@test.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Utilisateur admin existe déjà');
      
      if (!existingAdmin.status || existingAdmin.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            status: true,
            role: 'ADMIN'
          }
        });
        console.log('🔄 Utilisateur admin mis à jour');
      }
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'Test',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          status: true
        }
      });
      console.log('✅ Utilisateur admin créé');
    }

    // 4. Créer utilisateur superadmin s'il n'existe pas
    console.log('\n4️⃣ Création utilisateur superadmin...');
    const superadminEmail = 'superadmin@test.com';
    const existingSuperadmin = await prisma.user.findUnique({
      where: { email: superadminEmail }
    });

    if (existingSuperadmin) {
      console.log('✅ Utilisateur superadmin existe déjà');
      
      if (!existingSuperadmin.status || existingSuperadmin.role !== 'SUPERADMIN') {
        await prisma.user.update({
          where: { email: superadminEmail },
          data: {
            status: true,
            role: 'SUPERADMIN'
          }
        });
        console.log('🔄 Utilisateur superadmin mis à jour');
      }
    } else {
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      
      await prisma.user.create({
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          email: superadminEmail,
          password: hashedPassword,
          role: 'SUPERADMIN',
          status: true
        }
      });
      console.log('✅ Utilisateur superadmin créé');
    }

    // 5. Vérification finale
    console.log('\n5️⃣ Vérification finale...');
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        vendeur_type: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    console.log(`📊 ${finalUsers.length} utilisateurs finaux:`);
    finalUsers.forEach(user => {
      const vendeurType = user.vendeur_type ? ` (${user.vendeur_type})` : '';
      const status = user.status ? '✅ Actif' : '❌ Inactif';
      console.log(`  - ${user.email} | ${user.role}${vendeurType} | ${status}`);
    });

    console.log('\n🎯 === INFORMATIONS DE CONNEXION ===');
    console.log('Vendeur: vendeur@test.com / password123');
    console.log('Admin: admin@test.com / admin123');
    console.log('SuperAdmin: superadmin@test.com / superadmin123');

  } catch (error) {
    console.error('❌ Erreur création utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestUsers()
    .then(() => {
      console.log('\n✅ Création utilisateurs terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsers }; 