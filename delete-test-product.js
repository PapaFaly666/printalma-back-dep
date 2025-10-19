const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productId = 52;

  console.log(`🔄 Suppression du produit ID ${productId}...`);

  const deleted = await prisma.product.delete({
    where: { id: productId }
  });

  console.log('✅ Produit supprimé avec succès!');
  console.log('   ID supprimé:', deleted.id);
  console.log('   Nom:', deleted.name);
}

main()
  .then(() => {
    console.log('\n✨ Nettoyage terminé.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Erreur:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
