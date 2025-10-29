const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Vérification de la structure de la base de données...\n');

    // Test 1: Vérifier si l'enum PaymentStatus existe en tentant de l'utiliser
    console.log('Test 1: Enum PaymentStatus');
    try {
      const result = await prisma.$queryRaw`
        SELECT enum_range(NULL::"PaymentStatus") AS payment_statuses;
      `;
      console.log('✅ Enum PaymentStatus existe:', result[0].payment_statuses);
    } catch (error) {
      console.log('❌ Enum PaymentStatus n\'existe pas:', error.message);
    }

    // Test 2: Vérifier les colonnes de la table Order
    console.log('\nTest 2: Colonnes de la table Order');
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'Order'
        AND column_name IN ('paymentStatus', 'paymentToken', 'paymentDate', 'paymentDetails', 'transactionId')
        ORDER BY column_name;
      `;

      console.log('Colonnes trouvées:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });

      // Vérifier si toutes les colonnes attendues sont présentes
      const expectedColumns = ['paymentStatus', 'paymentToken', 'paymentDate', 'paymentDetails', 'transactionId'];
      const foundColumns = columns.map(c => c.column_name);
      const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('\n⚠️  Colonnes manquantes:', missingColumns.join(', '));
        console.log('\n📝 Action requise: Exécuter la migration SQL');
        console.log('   psql -h ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech \\');
        console.log('     -U neondb_owner -d neondb \\');
        console.log('     -f prisma/migrations/manual_payment_status_migration.sql');
      } else {
        console.log('\n✅ Toutes les colonnes sont présentes');
      }
    } catch (error) {
      console.log('❌ Erreur lors de la vérification des colonnes:', error.message);
    }

    // Test 3: Compter les commandes avec statut de paiement
    console.log('\nTest 3: Statistiques des paiements');
    try {
      const stats = await prisma.$queryRaw`
        SELECT
          "paymentStatus",
          COUNT(*) as count
        FROM "Order"
        GROUP BY "paymentStatus"
        ORDER BY count DESC;
      `;

      if (stats.length > 0) {
        console.log('Répartition des statuts de paiement:');
        stats.forEach(stat => {
          const status = stat.paymentStatus || 'NULL (pas de paiement)';
          console.log(`  - ${status}: ${stat.count} commande(s)`);
        });
      } else {
        console.log('Aucune commande trouvée dans la base de données');
      }
    } catch (error) {
      console.log('❌ Erreur lors du comptage:', error.message);
    }

    console.log('\n✅ Vérification terminée\n');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure();
