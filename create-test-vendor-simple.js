const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestVendor() {
  console.log('👤 Création utilisateur vendeur de test...');

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingVendor = await prisma.user.findUnique({
      where: { email: 'vendeur@test.com' }
    });

    if (existingVendor) {
      console.log('✅ Utilisateur vendeur existe déjà:', existingVendor.email);
      return existingVendor;
    }

    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Créer l'utilisateur vendeur
    const vendor = await prisma.user.create({
      data: {
        email: 'vendeur@test.com',
        password: hashedPassword,
        firstName: 'Vendeur',
        lastName: 'Test',
        role: 'VENDEUR', // ✅ Correction: VENDEUR au lieu de VENDOR
        status: true, // ✅ Correction: status au lieu de isActive
        phone: '+33123456789',
        country: 'France',
        address: '123 Rue de Test, 75001 Paris',
        shop_name: 'Boutique Test',
        profile_photo_url: 'https://via.placeholder.com/150'
      }
    });

    console.log('✅ Utilisateur vendeur créé avec succès:');
    console.log(`   ID: ${vendor.id}`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Nom: ${vendor.firstName} ${vendor.lastName}`);
    console.log(`   Rôle: ${vendor.role}`);
    console.log(`   Boutique: ${vendor.shop_name}`);

    return vendor;

  } catch (error) {
    console.error('❌ Erreur création vendeur:', error);
    throw error;
  }
}

async function createTestDesign(vendorId) {
  console.log('🎨 Création design de test...');

  try {
    // Vérifier si un design existe déjà
    const existingDesign = await prisma.design.findFirst({
      where: { vendorId: vendorId }
    });

    if (existingDesign) {
      console.log('✅ Design existe déjà:', existingDesign.id);
      return existingDesign;
    }

    // Créer un design de test
    const design = await prisma.design.create({
      data: {
        vendorId: vendorId,
        name: 'Design Test',
        description: 'Design de test pour transformations',
        price: 0,
        category: 'ILLUSTRATION',
        imageUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736420184/vendor-designs/vendor_2_design_1736420184324.jpg',
        thumbnailUrl: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736420184/vendor-designs/vendor_2_design_1736420184324.jpg',
        cloudinaryPublicId: 'vendor_2_design_1736420184324',
        fileSize: 50000,
        originalFileName: 'design_test.jpg',
        dimensions: { width: 500, height: 500 },
        format: 'jpg',
        tags: ['test', 'transformation'],
        isDraft: false,
        isPublished: false,
        isPending: false,
        isValidated: true // Validé pour les tests
      }
    });

    console.log('✅ Design créé avec succès:');
    console.log(`   ID: ${design.id}`);
    console.log(`   Nom: ${design.name}`);
    console.log(`   URL: ${design.imageUrl}`);

    return design;

  } catch (error) {
    console.error('❌ Erreur création design:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Initialisation données de test pour bypass validation\n');

  try {
    // Créer le vendeur
    const vendor = await createTestVendor();
    
    // Créer un design
    const design = await createTestDesign(vendor.id);

    console.log('\n🎯 Données de test créées avec succès !');
    console.log('📋 Informations de connexion:');
    console.log(`   Email: vendeur@test.com`);
    console.log(`   Mot de passe: password123`);
    console.log(`   Vendeur ID: ${vendor.id}`);
    console.log(`   Design ID: ${design.id}`);
    
    console.log('\n✅ Vous pouvez maintenant exécuter: node test-transformations-bypass.js');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 