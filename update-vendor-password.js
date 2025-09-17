const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateVendorPassword() {
  try {
    console.log('🔑 Mise à jour du mot de passe pour pf.d@zig.univ.sn...');

    // Hash du mot de passe "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.update({
      where: { email: 'pf.d@zig.univ.sn' },
      data: { password: hashedPassword }
    });

    console.log('✅ Mot de passe mis à jour avec succès !');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nouveau mot de passe: password123`);
    console.log(`   ID: ${user.id}`);

    console.log('\n🧪 Maintenant tu peux tester avec:');
    console.log(`curl -X 'POST' \\
  'http://localhost:3004/auth/login' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "pf.d@zig.univ.sn",
    "password": "password123"
  }'`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateVendorPassword();