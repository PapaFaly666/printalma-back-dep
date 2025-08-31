const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToMockupsByColor() {
  console.log('🔄 === MIGRATION VERS ARCHITECTURE MOCKUPS PAR COULEUR ===\n');

  try {
    // 1. Statistiques initiales
    console.log('📊 === STATISTIQUES INITIALES ===');
    
    const [totalProducts, productsWithDesign, existingMockups, legacyImages] = await Promise.all([
      prisma.vendorProduct.count(),
      prisma.vendorProduct.count({ where: { designId: { not: null } } }),
      prisma.vendorProductMockup.count(),
      prisma.vendorProductImage.count()
    ]);

    console.log(`📦 Total produits vendeur: ${totalProducts}`);
    console.log(`🎨 Produits avec design référencé: ${productsWithDesign}`);
    console.log(`🖼️ Mockups nouvelle architecture: ${existingMockups}`);
    console.log(`📷 Images ancienne architecture: ${legacyImages}\n`);

    // 2. Migration des produits sans designId
    console.log('🔧 === MIGRATION PRODUITS SANS DESIGN ID ===');
    
    const productsWithoutDesign = await prisma.vendorProduct.findMany({
      where: { designId: null },
      include: {
        vendor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    console.log(`🔍 ${productsWithoutDesign.length} produits sans designId trouvés`);

    let designsCreated = 0;
    let designLinkingErrors = 0;

    for (const product of productsWithoutDesign) {
      try {
        // Créer un design automatique pour ce produit
        const autoDesign = await prisma.design.create({
          data: {
            vendorId: product.vendorId,
            name: `Design auto - ${product.vendorName || 'Produit'} #${product.id}`,
            description: `Design généré automatiquement lors de la migration vers l'architecture mockups par couleur`,
            price: Math.max(product.price * 0.7, 5000), // 70% du prix produit ou minimum 5000
            category: 'ABSTRACT',
            imageUrl: product.designUrl || product.originalDesignUrl || 'https://via.placeholder.com/500x500?text=Design+Auto',
            thumbnailUrl: product.designUrl || product.originalDesignUrl || 'https://via.placeholder.com/250x250?text=Thumb',
            cloudinaryPublicId: `auto_design_migration_${product.id}_${Date.now()}`,
            fileSize: 100000,
            originalFileName: `migration_design_${product.id}.jpg`,
            dimensions: { width: 500, height: 500 },
            format: 'jpg',
            tags: ['auto-generated', 'migration', 'v2-architecture'],
            
            // Copier les statuts du produit
            isDraft: product.status === 'DRAFT',
            isPublished: product.status === 'PUBLISHED',
            isPending: product.status === 'PENDING',
            isValidated: product.isValidated,
            validatedAt: product.validatedAt,
            validatedBy: product.validatedBy,
            
            // Statistiques initiales
            views: 0,
            likes: 0,
            earnings: 0,
            usageCount: 1
          }
        });

        // Lier le design au produit
        await prisma.vendorProduct.update({
          where: { id: product.id },
          data: { designId: autoDesign.id }
        });

        designsCreated++;
        console.log(`✅ Design auto créé pour produit ${product.id}: Design ID ${autoDesign.id}`);

      } catch (error) {
        designLinkingErrors++;
        console.error(`❌ Erreur création design pour produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Designs créés: ${designsCreated}, Erreurs: ${designLinkingErrors}\n`);

    // 3. Migration des images vers mockups par couleur
    console.log('🖼️ === MIGRATION IMAGES VERS MOCKUPS PAR COULEUR ===');
    
    const productsWithImages = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          { designId: { not: null } },
          { images: { some: {} } }
        ]
      },
      include: {
        images: {
          where: { imageType: 'color' },
          orderBy: { createdAt: 'asc' }
        },
        design: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`🔍 ${productsWithImages.length} produits avec images à migrer`);

    let mockupsCreated = 0;
    let mockupErrors = 0;

    for (const product of productsWithImages) {
      try {
        // Décoder les couleurs sélectionnées
        let selectedColors = [];
        try {
          selectedColors = JSON.parse(product.colors);
        } catch (error) {
          console.warn(`⚠️ Couleurs invalides pour produit ${product.id}, ignoré`);
          continue;
        }

        // Créer des mockups pour chaque couleur ayant une image
        for (const color of selectedColors) {
          // Trouver l'image correspondante
          const correspondingImage = product.images.find(img => 
            img.colorId === color.id
          );

          if (correspondingImage) {
            try {
              // Créer le mockup dans la nouvelle table
              await prisma.vendorProductMockup.upsert({
                where: {
                  unique_product_color: {
                    vendorProductId: product.id,
                    colorId: color.id
                  }
                },
                update: {
                  mockupUrl: correspondingImage.cloudinaryUrl,
                  mockupPublicId: correspondingImage.cloudinaryPublicId,
                  width: correspondingImage.width,
                  height: correspondingImage.height,
                  format: correspondingImage.format,
                  fileSize: correspondingImage.fileSize,
                  generationStatus: 'COMPLETED',
                  generatedAt: correspondingImage.uploadedAt
                },
                create: {
                  vendorProductId: product.id,
                  colorId: color.id,
                  colorName: color.name,
                  colorCode: color.colorCode,
                  mockupUrl: correspondingImage.cloudinaryUrl,
                  mockupPublicId: correspondingImage.cloudinaryPublicId,
                  width: correspondingImage.width,
                  height: correspondingImage.height,
                  format: correspondingImage.format,
                  fileSize: correspondingImage.fileSize,
                  generationStatus: 'COMPLETED',
                  generatedAt: correspondingImage.uploadedAt
                }
              });

              mockupsCreated++;
              console.log(`✅ Mockup migré: Produit ${product.id} - Couleur ${color.name}`);

            } catch (error) {
              mockupErrors++;
              console.error(`❌ Erreur création mockup ${product.id}-${color.id}:`, error.message);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Erreur migration produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Mockups créés: ${mockupsCreated}, Erreurs: ${mockupErrors}\n`);

    // 4. Générer les mockups manquants
    console.log('🎨 === GÉNÉRATION MOCKUPS MANQUANTS ===');
    
    const productsNeedingMockups = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          { designId: { not: null } },
          { 
            OR: [
              { mockups: { none: {} } },
              { 
                mockups: {
                  some: { generationStatus: 'FAILED' }
                }
              }
            ]
          }
        ]
      },
      include: {
        design: {
          select: { id: true, imageUrl: true, isValidated: true }
        }
      }
    });

    console.log(`🔍 ${productsNeedingMockups.length} produits nécessitent la génération de mockups`);

    let mockupsGenerated = 0;
    let generationErrors = 0;

    for (const product of productsNeedingMockups) {
      try {
        if (!product.design?.isValidated) {
          console.log(`⏭️ Produit ${product.id} ignoré: design non validé`);
          continue;
        }

        // Décoder les couleurs
        let selectedColors = [];
        try {
          selectedColors = JSON.parse(product.colors);
        } catch (error) {
          console.warn(`⚠️ Couleurs invalides pour produit ${product.id}, ignoré`);
          continue;
        }

        // Créer des mockups placeholder pour chaque couleur
        for (const color of selectedColors) {
          try {
            await prisma.vendorProductMockup.upsert({
              where: {
                unique_product_color: {
                  vendorProductId: product.id,
                  colorId: color.id
                }
              },
              update: {
                generationStatus: 'COMPLETED',
                generatedAt: new Date()
              },
              create: {
                vendorProductId: product.id,
                colorId: color.id,
                colorName: color.name,
                colorCode: color.colorCode,
                // Utiliser le design original comme fallback
                mockupUrl: product.design.imageUrl,
                mockupPublicId: `fallback_${product.id}_${color.id}`,
                generationStatus: 'COMPLETED',
                generatedAt: new Date()
              }
            });

            mockupsGenerated++;
            console.log(`✅ Mockup fallback créé: Produit ${product.id} - Couleur ${color.name}`);

          } catch (error) {
            generationErrors++;
            console.error(`❌ Erreur génération fallback ${product.id}-${color.id}:`, error.message);
          }
        }

      } catch (error) {
        console.error(`❌ Erreur génération produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Mockups générés: ${mockupsGenerated}, Erreurs: ${generationErrors}\n`);

    // 5. Statistiques finales
    console.log('📊 === STATISTIQUES FINALES ===');
    
    const [
      finalTotalProducts,
      finalProductsWithDesign,
      finalMockups,
      completedMockups,
      failedMockups
    ] = await Promise.all([
      prisma.vendorProduct.count(),
      prisma.vendorProduct.count({ where: { designId: { not: null } } }),
      prisma.vendorProductMockup.count(),
      prisma.vendorProductMockup.count({ where: { generationStatus: 'COMPLETED' } }),
      prisma.vendorProductMockup.count({ where: { generationStatus: 'FAILED' } })
    ]);

    console.log(`📦 Total produits vendeur: ${finalTotalProducts}`);
    console.log(`🎨 Produits avec design: ${finalProductsWithDesign} (${Math.round((finalProductsWithDesign/finalTotalProducts)*100)}%)`);
    console.log(`🖼️ Total mockups: ${finalMockups}`);
    console.log(`✅ Mockups complétés: ${completedMockups}`);
    console.log(`❌ Mockups échoués: ${failedMockups}`);

    const migrationSuccess = finalProductsWithDesign === finalTotalProducts && completedMockups > 0;

    console.log('\n🎉 === RÉSUMÉ MIGRATION ===');
    console.log(`Migration réussie: ${migrationSuccess ? '✅ OUI' : '❌ NON'}`);
    console.log(`Designs créés automatiquement: ${designsCreated}`);
    console.log(`Mockups migrés depuis images: ${mockupsCreated}`);
    console.log(`Mockups fallback générés: ${mockupsGenerated}`);
    console.log(`Erreurs totales: ${designLinkingErrors + mockupErrors + generationErrors}`);

    if (migrationSuccess) {
      console.log('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
      console.log('🎨 Architecture v2_mockups_by_color opérationnelle');
      console.log('🔧 Vous pouvez maintenant utiliser les nouveaux endpoints');
      console.log('📱 Le frontend peut utiliser la nouvelle structure de données');
    } else {
      console.log('\n⚠️ MIGRATION PARTIELLEMENT RÉUSSIE');
      console.log('🛠️ Vérifiez les erreurs ci-dessus et relancez si nécessaire');
      console.log('📝 Certains produits peuvent nécessiter une intervention manuelle');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  migrateToMockupsByColor()
    .then(() => {
      console.log('\n🚀 Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration échouée:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMockupsByColor }; 

const prisma = new PrismaClient();

async function migrateToMockupsByColor() {
  console.log('🔄 === MIGRATION VERS ARCHITECTURE MOCKUPS PAR COULEUR ===\n');

  try {
    // 1. Statistiques initiales
    console.log('📊 === STATISTIQUES INITIALES ===');
    
    const [totalProducts, productsWithDesign, existingMockups, legacyImages] = await Promise.all([
      prisma.vendorProduct.count(),
      prisma.vendorProduct.count({ where: { designId: { not: null } } }),
      prisma.vendorProductMockup.count(),
      prisma.vendorProductImage.count()
    ]);

    console.log(`📦 Total produits vendeur: ${totalProducts}`);
    console.log(`🎨 Produits avec design référencé: ${productsWithDesign}`);
    console.log(`🖼️ Mockups nouvelle architecture: ${existingMockups}`);
    console.log(`📷 Images ancienne architecture: ${legacyImages}\n`);

    // 2. Migration des produits sans designId
    console.log('🔧 === MIGRATION PRODUITS SANS DESIGN ID ===');
    
    const productsWithoutDesign = await prisma.vendorProduct.findMany({
      where: { designId: null },
      include: {
        vendor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    console.log(`🔍 ${productsWithoutDesign.length} produits sans designId trouvés`);

    let designsCreated = 0;
    let designLinkingErrors = 0;

    for (const product of productsWithoutDesign) {
      try {
        // Créer un design automatique pour ce produit
        const autoDesign = await prisma.design.create({
          data: {
            vendorId: product.vendorId,
            name: `Design auto - ${product.vendorName || 'Produit'} #${product.id}`,
            description: `Design généré automatiquement lors de la migration vers l'architecture mockups par couleur`,
            price: Math.max(product.price * 0.7, 5000), // 70% du prix produit ou minimum 5000
            category: 'ABSTRACT',
            imageUrl: product.designUrl || product.originalDesignUrl || 'https://via.placeholder.com/500x500?text=Design+Auto',
            thumbnailUrl: product.designUrl || product.originalDesignUrl || 'https://via.placeholder.com/250x250?text=Thumb',
            cloudinaryPublicId: `auto_design_migration_${product.id}_${Date.now()}`,
            fileSize: 100000,
            originalFileName: `migration_design_${product.id}.jpg`,
            dimensions: { width: 500, height: 500 },
            format: 'jpg',
            tags: ['auto-generated', 'migration', 'v2-architecture'],
            
            // Copier les statuts du produit
            isDraft: product.status === 'DRAFT',
            isPublished: product.status === 'PUBLISHED',
            isPending: product.status === 'PENDING',
            isValidated: product.isValidated,
            validatedAt: product.validatedAt,
            validatedBy: product.validatedBy,
            
            // Statistiques initiales
            views: 0,
            likes: 0,
            earnings: 0,
            usageCount: 1
          }
        });

        // Lier le design au produit
        await prisma.vendorProduct.update({
          where: { id: product.id },
          data: { designId: autoDesign.id }
        });

        designsCreated++;
        console.log(`✅ Design auto créé pour produit ${product.id}: Design ID ${autoDesign.id}`);

      } catch (error) {
        designLinkingErrors++;
        console.error(`❌ Erreur création design pour produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Designs créés: ${designsCreated}, Erreurs: ${designLinkingErrors}\n`);

    // 3. Migration des images vers mockups par couleur
    console.log('🖼️ === MIGRATION IMAGES VERS MOCKUPS PAR COULEUR ===');
    
    const productsWithImages = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          { designId: { not: null } },
          { images: { some: {} } }
        ]
      },
      include: {
        images: {
          where: { imageType: 'color' },
          orderBy: { createdAt: 'asc' }
        },
        design: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`🔍 ${productsWithImages.length} produits avec images à migrer`);

    let mockupsCreated = 0;
    let mockupErrors = 0;

    for (const product of productsWithImages) {
      try {
        // Décoder les couleurs sélectionnées
        let selectedColors = [];
        try {
          selectedColors = JSON.parse(product.colors);
        } catch (error) {
          console.warn(`⚠️ Couleurs invalides pour produit ${product.id}, ignoré`);
          continue;
        }

        // Créer des mockups pour chaque couleur ayant une image
        for (const color of selectedColors) {
          // Trouver l'image correspondante
          const correspondingImage = product.images.find(img => 
            img.colorId === color.id
          );

          if (correspondingImage) {
            try {
              // Créer le mockup dans la nouvelle table
              await prisma.vendorProductMockup.upsert({
                where: {
                  unique_product_color: {
                    vendorProductId: product.id,
                    colorId: color.id
                  }
                },
                update: {
                  mockupUrl: correspondingImage.cloudinaryUrl,
                  mockupPublicId: correspondingImage.cloudinaryPublicId,
                  width: correspondingImage.width,
                  height: correspondingImage.height,
                  format: correspondingImage.format,
                  fileSize: correspondingImage.fileSize,
                  generationStatus: 'COMPLETED',
                  generatedAt: correspondingImage.uploadedAt
                },
                create: {
                  vendorProductId: product.id,
                  colorId: color.id,
                  colorName: color.name,
                  colorCode: color.colorCode,
                  mockupUrl: correspondingImage.cloudinaryUrl,
                  mockupPublicId: correspondingImage.cloudinaryPublicId,
                  width: correspondingImage.width,
                  height: correspondingImage.height,
                  format: correspondingImage.format,
                  fileSize: correspondingImage.fileSize,
                  generationStatus: 'COMPLETED',
                  generatedAt: correspondingImage.uploadedAt
                }
              });

              mockupsCreated++;
              console.log(`✅ Mockup migré: Produit ${product.id} - Couleur ${color.name}`);

            } catch (error) {
              mockupErrors++;
              console.error(`❌ Erreur création mockup ${product.id}-${color.id}:`, error.message);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Erreur migration produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Mockups créés: ${mockupsCreated}, Erreurs: ${mockupErrors}\n`);

    // 4. Générer les mockups manquants
    console.log('🎨 === GÉNÉRATION MOCKUPS MANQUANTS ===');
    
    const productsNeedingMockups = await prisma.vendorProduct.findMany({
      where: {
        AND: [
          { designId: { not: null } },
          { 
            OR: [
              { mockups: { none: {} } },
              { 
                mockups: {
                  some: { generationStatus: 'FAILED' }
                }
              }
            ]
          }
        ]
      },
      include: {
        design: {
          select: { id: true, imageUrl: true, isValidated: true }
        }
      }
    });

    console.log(`🔍 ${productsNeedingMockups.length} produits nécessitent la génération de mockups`);

    let mockupsGenerated = 0;
    let generationErrors = 0;

    for (const product of productsNeedingMockups) {
      try {
        if (!product.design?.isValidated) {
          console.log(`⏭️ Produit ${product.id} ignoré: design non validé`);
          continue;
        }

        // Décoder les couleurs
        let selectedColors = [];
        try {
          selectedColors = JSON.parse(product.colors);
        } catch (error) {
          console.warn(`⚠️ Couleurs invalides pour produit ${product.id}, ignoré`);
          continue;
        }

        // Créer des mockups placeholder pour chaque couleur
        for (const color of selectedColors) {
          try {
            await prisma.vendorProductMockup.upsert({
              where: {
                unique_product_color: {
                  vendorProductId: product.id,
                  colorId: color.id
                }
              },
              update: {
                generationStatus: 'COMPLETED',
                generatedAt: new Date()
              },
              create: {
                vendorProductId: product.id,
                colorId: color.id,
                colorName: color.name,
                colorCode: color.colorCode,
                // Utiliser le design original comme fallback
                mockupUrl: product.design.imageUrl,
                mockupPublicId: `fallback_${product.id}_${color.id}`,
                generationStatus: 'COMPLETED',
                generatedAt: new Date()
              }
            });

            mockupsGenerated++;
            console.log(`✅ Mockup fallback créé: Produit ${product.id} - Couleur ${color.name}`);

          } catch (error) {
            generationErrors++;
            console.error(`❌ Erreur génération fallback ${product.id}-${color.id}:`, error.message);
          }
        }

      } catch (error) {
        console.error(`❌ Erreur génération produit ${product.id}:`, error.message);
      }
    }

    console.log(`📊 Mockups générés: ${mockupsGenerated}, Erreurs: ${generationErrors}\n`);

    // 5. Statistiques finales
    console.log('📊 === STATISTIQUES FINALES ===');
    
    const [
      finalTotalProducts,
      finalProductsWithDesign,
      finalMockups,
      completedMockups,
      failedMockups
    ] = await Promise.all([
      prisma.vendorProduct.count(),
      prisma.vendorProduct.count({ where: { designId: { not: null } } }),
      prisma.vendorProductMockup.count(),
      prisma.vendorProductMockup.count({ where: { generationStatus: 'COMPLETED' } }),
      prisma.vendorProductMockup.count({ where: { generationStatus: 'FAILED' } })
    ]);

    console.log(`📦 Total produits vendeur: ${finalTotalProducts}`);
    console.log(`🎨 Produits avec design: ${finalProductsWithDesign} (${Math.round((finalProductsWithDesign/finalTotalProducts)*100)}%)`);
    console.log(`🖼️ Total mockups: ${finalMockups}`);
    console.log(`✅ Mockups complétés: ${completedMockups}`);
    console.log(`❌ Mockups échoués: ${failedMockups}`);

    const migrationSuccess = finalProductsWithDesign === finalTotalProducts && completedMockups > 0;

    console.log('\n🎉 === RÉSUMÉ MIGRATION ===');
    console.log(`Migration réussie: ${migrationSuccess ? '✅ OUI' : '❌ NON'}`);
    console.log(`Designs créés automatiquement: ${designsCreated}`);
    console.log(`Mockups migrés depuis images: ${mockupsCreated}`);
    console.log(`Mockups fallback générés: ${mockupsGenerated}`);
    console.log(`Erreurs totales: ${designLinkingErrors + mockupErrors + generationErrors}`);

    if (migrationSuccess) {
      console.log('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
      console.log('🎨 Architecture v2_mockups_by_color opérationnelle');
      console.log('🔧 Vous pouvez maintenant utiliser les nouveaux endpoints');
      console.log('📱 Le frontend peut utiliser la nouvelle structure de données');
    } else {
      console.log('\n⚠️ MIGRATION PARTIELLEMENT RÉUSSIE');
      console.log('🛠️ Vérifiez les erreurs ci-dessus et relancez si nécessaire');
      console.log('📝 Certains produits peuvent nécessiter une intervention manuelle');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  migrateToMockupsByColor()
    .then(() => {
      console.log('\n🚀 Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration échouée:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMockupsByColor }; 
 
 
 
 
 
 
 
 
 
 