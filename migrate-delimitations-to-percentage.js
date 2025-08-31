const { PrismaClient, CoordinateType } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateDelimitationsToPercentage() {
  console.log('🚀 Début de la migration des délimitations vers les coordonnées en pourcentages...\n');

  try {
    // 1. Récupérer toutes les images avec leurs délimitations absolues
    const images = await prisma.productImage.findMany({
      where: {
        delimitations: {
          some: {
            coordinateType: CoordinateType.ABSOLUTE
          }
        }
      },
      include: {
        delimitations: {
          where: {
            coordinateType: CoordinateType.ABSOLUTE
          }
        },
        colorVariation: {
          include: {
            product: true
          }
        }
      }
    });

    console.log(`📊 Trouvé ${images.length} images avec des délimitations absolues à migrer\n`);

    let totalDelimitations = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 2. Traiter chaque image
    for (const image of images) {
      console.log(`🖼️  Image ${image.id} (Produit: ${image.colorVariation.product.name})`);
      console.log(`   URL: ${image.url}`);
      console.log(`   Dimensions: ${image.naturalWidth || 'N/A'} x ${image.naturalHeight || 'N/A'}`);
      console.log(`   Délimitations à migrer: ${image.delimitations.length}`);

      // Vérifier si on a les dimensions naturelles
      if (!image.naturalWidth || !image.naturalHeight) {
        console.log(`   ❌ Dimensions naturelles manquantes, ignoré\n`);
        errorCount += image.delimitations.length;
        totalDelimitations += image.delimitations.length;
        errors.push({
          imageId: image.id,
          productName: image.colorVariation.product.name,
          error: 'Dimensions naturelles manquantes'
        });
        continue;
      }

      // 3. Migrer chaque délimitation de cette image
      for (const delimitation of image.delimitations) {
        totalDelimitations++;
        
        try {
          // Calculer les pourcentages
          const percentageX = Math.round((delimitation.x / image.naturalWidth) * 10000) / 100;
          const percentageY = Math.round((delimitation.y / image.naturalHeight) * 10000) / 100;
          const percentageWidth = Math.round((delimitation.width / image.naturalWidth) * 10000) / 100;
          const percentageHeight = Math.round((delimitation.height / image.naturalHeight) * 10000) / 100;

          console.log(`     📐 Délimitation ${delimitation.id}:`);
          console.log(`        Avant: (${delimitation.x}, ${delimitation.y}, ${delimitation.width}, ${delimitation.height})`);
          console.log(`        Après: (${percentageX}%, ${percentageY}%, ${percentageWidth}%, ${percentageHeight}%)`);

          // Validation des limites
          if (percentageX + percentageWidth > 100 || percentageY + percentageHeight > 100) {
            console.log(`        ⚠️  ATTENTION: La zone dépasse les limites (${percentageX + percentageWidth}%, ${percentageY + percentageHeight}%)`);
          }

          // Mettre à jour la délimitation
          await prisma.delimitation.update({
            where: { id: delimitation.id },
            data: {
              x: percentageX,
              y: percentageY,
              width: percentageWidth,
              height: percentageHeight,
              coordinateType: CoordinateType.PERCENTAGE,
              // Conserver les coordonnées absolues originales
              absoluteX: delimitation.x,
              absoluteY: delimitation.y,
              absoluteWidth: delimitation.width,
              absoluteHeight: delimitation.height,
              originalImageWidth: image.naturalWidth,
              originalImageHeight: image.naturalHeight,
            }
          });

          successCount++;
          console.log(`        ✅ Migré avec succès`);

        } catch (error) {
          console.log(`        ❌ Erreur: ${error.message}`);
          errorCount++;
          errors.push({
            delimitationId: delimitation.id,
            imageId: image.id,
            productName: image.colorVariation.product.name,
            error: error.message
          });
        }
      }
      console.log('');
    }

    // 4. Rapport final
    console.log('═'.repeat(60));
    console.log('📈 RAPPORT DE MIGRATION');
    console.log('═'.repeat(60));
    console.log(`Total des délimitations: ${totalDelimitations}`);
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Taux de réussite: ${totalDelimitations > 0 ? Math.round((successCount / totalDelimitations) * 100) : 0}%\n`);

    if (errors.length > 0) {
      console.log('🚨 DÉTAILS DES ERREURS:');
      console.log('-'.repeat(40));
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.productName || 'Produit inconnu'}`);
        console.log(`   Image ID: ${error.imageId}`);
        console.log(`   Délimitation ID: ${error.delimitationId || 'N/A'}`);
        console.log(`   Erreur: ${error.error}\n`);
      });
    }

    // 5. Statistiques finales
    const stats = await prisma.delimitation.groupBy({
      by: ['coordinateType'],
      _count: true
    });

    console.log('📊 STATISTIQUES FINALES:');
    console.log('-'.repeat(30));
    stats.forEach(stat => {
      console.log(`${stat.coordinateType}: ${stat._count} délimitations`);
    });

    console.log('\n🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('💥 Erreur critique lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction utilitaire pour vérifier les coordonnées avant migration
async function checkExistingDelimitations() {
  console.log('🔍 Vérification des délimitations existantes...\n');

  const stats = await prisma.delimitation.groupBy({
    by: ['coordinateType'],
    _count: true
  });

  console.log('📊 ÉTAT ACTUEL:');
  stats.forEach(stat => {
    console.log(`${stat.coordinateType}: ${stat._count} délimitations`);
  });

  const absoluteDelimitations = await prisma.delimitation.findMany({
    where: { coordinateType: CoordinateType.ABSOLUTE },
    include: {
      productImage: {
        include: {
          colorVariation: {
            include: {
              product: true
            }
          }
        }
      }
    },
    take: 5 // Afficher les 5 premières
  });

  if (absoluteDelimitations.length > 0) {
    console.log('\n🔍 EXEMPLES DE DÉLIMITATIONS ABSOLUES:');
    console.log('-'.repeat(50));
    absoluteDelimitations.forEach((delim, index) => {
      console.log(`${index + 1}. Produit: ${delim.productImage.colorVariation.product.name}`);
      console.log(`   Coordonnées: (${delim.x}, ${delim.y}, ${delim.width}, ${delim.height})`);
      console.log(`   Image: ${delim.productImage.naturalWidth || 'N/A'} x ${delim.productImage.naturalHeight || 'N/A'}\n`);
    });
  }

  console.log('');
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkExistingDelimitations();
  } else if (args.includes('--migrate')) {
    migrateDelimitationsToPercentage();
  } else {
    console.log('📖 USAGE:');
    console.log('  node migrate-delimitations-to-percentage.js --check    # Vérifier l\'état actuel');
    console.log('  node migrate-delimitations-to-percentage.js --migrate  # Lancer la migration');
  }
} 