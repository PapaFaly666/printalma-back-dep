import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de seed pour le contenu de la page d'accueil
 *
 * Ce script crée les 17 items initiaux nécessaires pour le système:
 * - 6 items de type DESIGN (Designers Exclusifs)
 * - 5 items de type INFLUENCER (Influenceurs Partenaires)
 * - 6 items de type MERCHANDISING (Merchandising Musical)
 *
 * IMPORTANT: Ce script ne doit être exécuté qu'une seule fois lors de l'installation initiale.
 * Si la table contient déjà des données, le script échouera.
 */
async function seedHomeContent() {
  try {
    console.log('🌱 Début du seed du contenu de la page d\'accueil...');

    // Vérifier si le contenu existe déjà
    const existingCount = await prisma.homeContent.count();

    if (existingCount > 0) {
      console.log(`⚠️  La table contient déjà ${existingCount} items. Seed annulé.`);
      console.log('💡 Si vous voulez réinitialiser le contenu, supprimez d\'abord les données existantes:');
      console.log('   DELETE FROM "home_content";');
      return;
    }

    // Designs Exclusifs (6 items) - URLs Cloudinary par défaut
    const designs = [
      { name: 'Pap Musa', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/pap_musa', order: 0 },
      { name: 'Ceeneer', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/ceeneer', order: 1 },
      { name: 'K & C', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/k_ethiakh', order: 2 },
      { name: 'Breadwinner', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/breadwinner', order: 3 },
      { name: 'Meissa Biguey', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/meissa_biguey', order: 4 },
      { name: 'DAD', imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1/home_content/designs/dad', order: 5 },
    ];

    // Influenceurs Partenaires (5 items)
    const influencers = [
      {
        name: 'Ebu Jomlong',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        order: 0,
      },
      {
        name: 'Dip Poundou Guiss',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
        order: 1,
      },
      {
        name: 'Massamba Amadeus',
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        order: 2,
      },
      {
        name: 'Amina Abed',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        order: 3,
      },
      {
        name: 'Mut Cash',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
        order: 4,
      },
    ];

    // Merchandising Musical (6 items)
    const merchandising = [
      {
        name: 'Bathie Drizzy',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=7',
        order: 0,
      },
      {
        name: 'Latzo Dozé',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=8',
        order: 1,
      },
      {
        name: 'Jaaw Ketchup',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=9',
        order: 2,
      },
      {
        name: 'Dudu FDV',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=10',
        order: 3,
      },
      {
        name: 'Adja Everywhere',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=11',
        order: 4,
      },
      {
        name: 'Pape Sidy Fall',
        imageUrl: 'https://tse2.mm.bing.net/th?id=OIP.5l9F7l4l6l8l0l2l4l6l8l&w=200&h=200&c=12',
        order: 5,
      },
    ];

    // Créer tous les items
    await prisma.homeContent.createMany({
      data: [
        ...designs.map((d) => ({ ...d, type: 'DESIGN' as const })),
        ...influencers.map((i) => ({ ...i, type: 'INFLUENCER' as const })),
        ...merchandising.map((m) => ({ ...m, type: 'MERCHANDISING' as const })),
      ],
    });

    console.log('✅ Home content seeded successfully!');
    console.log(`   - ${designs.length} designs`);
    console.log(`   - ${influencers.length} influenceurs`);
    console.log(`   - ${merchandising.length} merchandising`);
    console.log(`   Total: ${designs.length + influencers.length + merchandising.length} items`);
  } catch (error) {
    console.error('❌ Erreur lors du seed du contenu:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seedHomeContent()
  .then(() => {
    console.log('🎉 Seed terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed échoué:', error);
    process.exit(1);
  });
