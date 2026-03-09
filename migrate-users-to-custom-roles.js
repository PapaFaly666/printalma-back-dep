const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔄 Migration des utilisateurs vers CustomRole...\n');

  // Récupérer les rôles
  const superadminRole = await prisma.customRole.findUnique({ where: { slug: 'superadmin' } });
  const vendorRole = await prisma.customRole.findUnique({ where: { slug: 'vendor' } });

  if (!superadminRole) {
    console.error('❌ Rôle superadmin introuvable!');
    return;
  }

  console.log('✅ Rôle SuperAdmin ID:', superadminRole.id);
  console.log('✅ Rôle Vendor ID:', vendorRole?.id || 'Non trouvé');

  // Migrer l'utilisateur SUPERADMIN (ID: 1)
  const user1 = await prisma.user.update({
    where: { id: 1 },
    data: { roleId: superadminRole.id },
    include: { customRole: true }
  });

  console.log('\n✅ Utilisateur 1 migré:', user1.email, '→', user1.customRole?.name);

  // Migrer l'utilisateur VENDEUR (ID: 2) si le rôle existe
  if (vendorRole) {
    const user2 = await prisma.user.update({
      where: { id: 2 },
      data: { roleId: vendorRole.id },
      include: { customRole: true }
    });
    console.log('✅ Utilisateur 2 migré:', user2.email, '→', user2.customRole?.name);
  }

  // Vérifier le résultat
  const adminUsers = await prisma.user.findMany({
    where: {
      is_deleted: false,
      roleId: superadminRole.id
    },
    include: { customRole: true }
  });

  console.log('\n📊 Résultat: ', adminUsers.length, 'utilisateur(s) avec rôle SuperAdmin');

  console.log('\n✅ Migration terminée!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
