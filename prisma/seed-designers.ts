import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDesigners() {
  console.log('🎨 Seeding designers...');

  // Récupérer un utilisateur admin pour créer les designers
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'ADMIN' },
        { role: 'SUPERADMIN' }
      ]
    }
  });

  if (!admin) {
    console.error('❌ Aucun utilisateur admin trouvé. Veuillez d\'abord créer un admin.');
    return;
  }

  console.log(`✅ Utilisation de l'admin: ${admin.firstName} ${admin.lastName} (ID: ${admin.id})`);

  const designers = [
    {
      name: 'Pap Musa',
      displayName: 'Pap Musa',
      bio: 'Artiste sénégalais spécialisé dans les motifs traditionnels africains et les designs contemporains.',
      isActive: true,
      sortOrder: 1,
      isFeatured: true,
      featuredOrder: 1,
    },
    {
      name: 'Fatou Diop',
      displayName: 'Fatou Diop',
      bio: 'Designer graphique passionnée par l\'art africain moderne et les couleurs vibrantes.',
      isActive: true,
      sortOrder: 2,
      isFeatured: true,
      featuredOrder: 2,
    },
    {
      name: 'Mamadou Kane',
      displayName: 'Mamadou Kane',
      bio: 'Illustrateur et créateur de motifs inspirés de la culture wolof et des traditions sénégalaises.',
      isActive: true,
      sortOrder: 3,
      isFeatured: true,
      featuredOrder: 3,
    },
    {
      name: 'Aminata Sow',
      displayName: 'Aminata Sow',
      bio: 'Artiste polyvalente combinant calligraphie arabe et designs géométriques modernes.',
      isActive: true,
      sortOrder: 4,
      isFeatured: true,
      featuredOrder: 4,
    },
    {
      name: 'Ousmane Diallo',
      displayName: 'Ousmane Diallo',
      bio: 'Designer spécialisé dans les patterns urbains et street art avec une touche africaine.',
      isActive: true,
      sortOrder: 5,
      isFeatured: true,
      featuredOrder: 5,
    },
    {
      name: 'Aïssatou Ndiaye',
      displayName: 'Aïssatou Ndiaye',
      bio: 'Créatrice de designs minimalistes inspirés par la nature et les paysages du Sénégal.',
      isActive: true,
      sortOrder: 6,
      isFeatured: true,
      featuredOrder: 6,
    },
  ];

  for (const designerData of designers) {
    try {
      // Vérifier si le designer existe déjà
      const existing = await prisma.designer.findFirst({
        where: { name: designerData.name }
      });

      if (existing) {
        console.log(`⚠️  Designer "${designerData.name}" existe déjà, ignoré.`);
        continue;
      }

      const designer = await prisma.designer.create({
        data: {
          ...designerData,
          createdBy: admin.id,
        },
      });

      console.log(`✅ Designer créé: ${designer.name} (ID: ${designer.id})`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du designer "${designerData.name}":`, error);
    }
  }

  console.log('🎉 Seeding des designers terminé!');
}

seedDesigners()
  .catch((error) => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
