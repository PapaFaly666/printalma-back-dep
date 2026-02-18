import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearConfigs() {
  console.log('🗑️  Suppression des anciennes configurations...');

  const deleted = await prisma.paymentConfig.deleteMany({});

  console.log(`✅ ${deleted.count} configuration(s) supprimée(s)`);
}

clearConfigs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
