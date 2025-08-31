const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImageDimensions() {
  console.log('🔍 Vérification des dimensions des images dans la base de données...\n');

  try {
    // Récupérer les produits avec leurs images
    const products = await prisma.product.findMany({
      include: {
        colorVariations: {
          include: {
            images: true
          }
        }
      },
      take: 3
    });

    console.log(`📦 ${products.length} produits trouvés\n`);

    for (const product of products) {
      console.log(`\n🔍 Produit ${product.id} - ${product.name}`);
      
      if (product.colorVariations && product.colorVariations.length > 0) {
        for (const colorVariation of product.colorVariations) {
          console.log(`   🎨 ${colorVariation.name} (${colorVariation.colorCode}):`);
          
          if (colorVariation.images && colorVariation.images.length > 0) {
            for (const image of colorVariation.images) {
              console.log(`      📷 Image ${image.id}:`);
              console.log(`         - URL: ${image.url}`);
              console.log(`         - naturalWidth: ${image.naturalWidth}`);
              console.log(`         - naturalHeight: ${image.naturalHeight}`);
              console.log(`         - publicId: ${image.publicId}`);
              
              // Essayer d'extraire les dimensions depuis l'URL Cloudinary
              const urlMatch = image.url.match(/\/w_(\d+),h_(\d+)/);
              if (urlMatch) {
                console.log(`         - Dimensions extraites de l'URL: ${urlMatch[1]}x${urlMatch[2]}`);
              } else {
                console.log(`         - Aucune dimension dans l'URL`);
              }
            }
          } else {
            console.log(`      ⚠️ Aucune image pour cette couleur`);
          }
        }
      } else {
        console.log(`   ⚠️ Aucune variation de couleur`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageDimensions(); 

const prisma = new PrismaClient();

async function checkImageDimensions() {
  console.log('🔍 Vérification des dimensions des images dans la base de données...\n');

  try {
    // Récupérer les produits avec leurs images
    const products = await prisma.product.findMany({
      include: {
        colorVariations: {
          include: {
            images: true
          }
        }
      },
      take: 3
    });

    console.log(`📦 ${products.length} produits trouvés\n`);

    for (const product of products) {
      console.log(`\n🔍 Produit ${product.id} - ${product.name}`);
      
      if (product.colorVariations && product.colorVariations.length > 0) {
        for (const colorVariation of product.colorVariations) {
          console.log(`   🎨 ${colorVariation.name} (${colorVariation.colorCode}):`);
          
          if (colorVariation.images && colorVariation.images.length > 0) {
            for (const image of colorVariation.images) {
              console.log(`      📷 Image ${image.id}:`);
              console.log(`         - URL: ${image.url}`);
              console.log(`         - naturalWidth: ${image.naturalWidth}`);
              console.log(`         - naturalHeight: ${image.naturalHeight}`);
              console.log(`         - publicId: ${image.publicId}`);
              
              // Essayer d'extraire les dimensions depuis l'URL Cloudinary
              const urlMatch = image.url.match(/\/w_(\d+),h_(\d+)/);
              if (urlMatch) {
                console.log(`         - Dimensions extraites de l'URL: ${urlMatch[1]}x${urlMatch[2]}`);
              } else {
                console.log(`         - Aucune dimension dans l'URL`);
              }
            }
          } else {
            console.log(`      ⚠️ Aucune image pour cette couleur`);
          }
        }
      } else {
        console.log(`   ⚠️ Aucune variation de couleur`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImageDimensions(); 