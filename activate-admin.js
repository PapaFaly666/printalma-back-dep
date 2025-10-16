const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateAdmin() {
  try {
    console.log('🔍 Recherche du compte admin à activer...');

    // Trouver le compte superadmin@printalma.com
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@printalma.com' }
    });

    if (!user) {
      console.log('❌ Utilisateur superadmin@printalma.com non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:', { id: user.id, email: user.email, status: user.status, role: user.role });

    // Activer le compte et le passer en SUPERADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: true,
        role: 'SUPERADMIN',
        must_change_password: false,
        is_deleted: false,
        updated_at: new Date()
      }
    });

    console.log('✅ Compte activé avec succès!');
    console.log('   - ID:', updatedUser.id);
    console.log('   - Email:', updatedUser.email);
    console.log('   - Role:', updatedUser.role);
    console.log('   - Statut:', updatedUser.status);

    console.log('\n🎉 Le compte admin est maintenant prêt à être utilisé!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAdmin();