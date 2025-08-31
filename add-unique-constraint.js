const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addUniqueConstraint() {
  try {
    console.log('🔧 Ajout de la contrainte d\'unicité sur shop_name...');
    
    // Vérifier si la contrainte existe déjà
    const result = await prisma.$executeRaw`
      DO $$
      BEGIN
          -- Vérifier si la contrainte existe déjà
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'User_shop_name_key' 
              AND table_name = 'User'
          ) THEN
              -- Ajouter la contrainte d'unicité
              ALTER TABLE "User" ADD CONSTRAINT "User_shop_name_key" UNIQUE ("shop_name");
              RAISE NOTICE 'Contrainte d''unicité ajoutée sur shop_name';
          ELSE
              RAISE NOTICE 'La contrainte d''unicité existe déjà sur shop_name';
          END IF;
      END $$;
    `;
    
    console.log('✅ Contrainte d\'unicité ajoutée avec succès !');
    
    // Vérifier que la contrainte est bien en place
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, table_name, column_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'User' AND constraint_type = 'UNIQUE'
    `;
    
    console.log('📋 Contraintes uniques sur la table User:', constraints);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la contrainte:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUniqueConstraint(); 