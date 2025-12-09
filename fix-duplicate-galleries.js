const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateGalleries() {
  try {
    console.log('🔍 Recherche des galeries en doublon...');

    // Étape 1: Trouver les vendeurs avec plusieurs galeries
    const duplicateGalleries = await prisma.$queryRaw`
      SELECT
        vendor_id,
        COUNT(*) as gallery_count,
        STRING_AGG(CAST(id AS TEXT), ', ') as gallery_ids
      FROM vendor_galleries
      WHERE deleted_at IS NULL
      GROUP BY vendor_id
      HAVING COUNT(*) > 1
    `;

    console.log(`\n📊 ${duplicateGalleries.length} vendeur(s) avec des galeries en doublon trouvés`);

    if (duplicateGalleries.length === 0) {
      console.log('✅ Aucun doublon trouvé, tout est en ordre !');
      return;
    }

    // Étape 2: Pour chaque vendeur avec doublons, garder la galerie la plus récente
    for (const duplicate of duplicateGalleries) {
      const vendorId = duplicate.vendor_id;
      const galleryIds = duplicate.gallery_ids.split(', ').map(id => parseInt(id));

      console.log(`\n🔄 Traitement du vendeur ${vendorId} (${duplicate.gallery_count} galeries)`);

      // Récupérer toutes les galeries de ce vendeur triées par date de création
      const galleries = await prisma.vendorGallery.findMany({
        where: {
          vendorId: vendorId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Garder la première galerie (la plus récente)
      const galleryToKeep = galleries[0];
      const galleriesToDelete = galleries.slice(1);

      console.log(`   📌 Galerie à conserver: ID ${galleryToKeep.id} (${galleryToKeep.title})`);

      // Supprimer les images des galeries à supprimer
      for (const gallery of galleriesToDelete) {
        console.log(`   🗑️  Suppression de la galerie ID ${gallery.id} (${gallery.title})`);

        // Supprimer les images associées
        await prisma.galleryImage.deleteMany({
          where: {
            galleryId: gallery.id,
          },
        });

        // Soft delete de la galerie
        await prisma.vendorGallery.update({
          where: {
            id: gallery.id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        console.log(`      ✅ Galerie ${gallery.id} supprimée`);
      }
    }

    // Étape 3: Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalCheck = await prisma.$queryRaw`
      SELECT
        vendor_id,
        COUNT(*) as gallery_count
      FROM vendor_galleries
      WHERE deleted_at IS NULL
      GROUP BY vendor_id
      HAVING COUNT(*) > 1
    `;

    if (finalCheck.length === 0) {
      console.log('✅ Succès ! Plus aucun doublon dans la base de données');
    } else {
      console.log(`❌ Il reste encore ${finalCheck.length} vendeur(s) avec des doublons`);
    }

    // Étape 4: Afficher les galeries restantes
    const remainingGalleries = await prisma.vendorGallery.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        vendorId: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: [
        {
          vendorId: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    console.log('\n📋 Liste des galeries restantes:');
    console.log('=====================================');
    for (const gallery of remainingGalleries) {
      console.log(
        `Vendeur ${gallery.vendorId}: Gallery ID ${gallery.id} - "${gallery.title}" (${gallery._count.images} images)`
      );
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixDuplicateGalleries();