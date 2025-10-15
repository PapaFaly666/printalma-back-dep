import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log('👥 Seeding users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Créer un Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@printalma.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@printalma.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: true,
      userStatus: 'ACTIVE',
      email_verified: true,
      must_change_password: false,
    },
  });

  // 2. Créer des Admins
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@printalma.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Admin',
      email: 'admin1@printalma.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: true,
      userStatus: 'ACTIVE',
      email_verified: true,
      must_change_password: false,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@printalma.com' },
    update: {},
    create: {
      firstName: 'Marie',
      lastName: 'Administrator',
      email: 'admin2@printalma.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: true,
      userStatus: 'ACTIVE',
      email_verified: true,
      must_change_password: false,
    },
  });

  console.log('✅ Super Admin and Admins created');

  // 3. Créer des types de vendeurs
  const designerType = await prisma.vendorType.upsert({
    where: { label: 'Designer' },
    update: {},
    create: {
      label: 'Designer',
      description: 'Créateurs de designs graphiques',
    },
  });

  const influencerType = await prisma.vendorType.upsert({
    where: { label: 'Influenceur' },
    update: {},
    create: {
      label: 'Influenceur',
      description: 'Influenceurs et créateurs de contenu',
    },
  });

  const artistType = await prisma.vendorType.upsert({
    where: { label: 'Artiste' },
    update: {},
    create: {
      label: 'Artiste',
      description: 'Artistes et illustrateurs',
    },
  });

  console.log('✅ Vendor types created');

  // 4. Créer des vendeurs (20 vendeurs)
  const vendors = [];
  const vendorNames = [
    { firstName: 'Ahmed', lastName: 'Diop', shop: 'Ahmed Design Studio', type: designerType.id },
    { firstName: 'Fatima', lastName: 'Sow', shop: 'Fatima Art Gallery', type: artistType.id },
    { firstName: 'Mamadou', lastName: 'Fall', shop: 'Mamadou Creations', type: designerType.id },
    { firstName: 'Aïssatou', lastName: 'Ndiaye', shop: 'Aïssatou Fashion', type: influencerType.id },
    { firstName: 'Ibrahima', lastName: 'Kane', shop: 'Ibrahima Graphics', type: designerType.id },
    { firstName: 'Mariama', lastName: 'Ba', shop: 'Mariama Style', type: influencerType.id },
    { firstName: 'Ousmane', lastName: 'Sy', shop: 'Ousmane Design Co', type: designerType.id },
    { firstName: 'Khady', lastName: 'Faye', shop: 'Khady Illustrations', type: artistType.id },
    { firstName: 'Cheikh', lastName: 'Gueye', shop: 'Cheikh Prints', type: designerType.id },
    { firstName: 'Aminata', lastName: 'Sarr', shop: 'Aminata Creations', type: artistType.id },
    { firstName: 'Moussa', lastName: 'Diouf', shop: 'Moussa Graphics', type: designerType.id },
    { firstName: 'Binta', lastName: 'Cisse', shop: 'Binta Fashion House', type: influencerType.id },
    { firstName: 'Lamine', lastName: 'Thiam', shop: 'Lamine Art Studio', type: artistType.id },
    { firstName: 'Ndeye', lastName: 'Mbaye', shop: 'Ndeye Designs', type: designerType.id },
    { firstName: 'Abdoulaye', lastName: 'Diallo', shop: 'Abdoulaye Graphics', type: designerType.id },
    { firstName: 'Awa', lastName: 'Traore', shop: 'Awa Style Lab', type: influencerType.id },
    { firstName: 'Boubacar', lastName: 'Seck', shop: 'Boubacar Creations', type: designerType.id },
    { firstName: 'Coumba', lastName: 'Niang', shop: 'Coumba Art Works', type: artistType.id },
    { firstName: 'Demba', lastName: 'Toure', shop: 'Demba Design Pro', type: designerType.id },
    { firstName: 'Dieynaba', lastName: 'Ly', shop: 'Dieynaba Fashion', type: influencerType.id },
  ];

  for (const vendorData of vendorNames) {
    const vendor = await prisma.user.upsert({
      where: { email: `${vendorData.firstName.toLowerCase()}.${vendorData.lastName.toLowerCase()}@vendor.com` },
      update: {},
      create: {
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        email: `${vendorData.firstName.toLowerCase()}.${vendorData.lastName.toLowerCase()}@vendor.com`,
        password: hashedPassword,
        role: 'VENDEUR',
        vendeur_type: vendorData.type === designerType.id ? 'DESIGNER' :
                      vendorData.type === influencerType.id ? 'INFLUENCEUR' : 'ARTISTE',
        vendorTypeId: vendorData.type,
        shop_name: vendorData.shop,
        status: true,
        userStatus: 'ACTIVE',
        email_verified: true,
        must_change_password: false,
        address: `${Math.floor(Math.random() * 100)} Rue ${vendorData.lastName}`,
        country: 'Sénégal',
        phone: `+221 77 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
      },
    });

    // Créer une commission pour chaque vendeur
    await prisma.vendorCommission.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        commissionRate: 30 + Math.random() * 20, // Entre 30% et 50%
        createdBy: superAdmin.id,
      },
    });

    // Initialiser les earnings du vendeur
    await prisma.vendorEarnings.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        totalEarnings: 0,
        availableAmount: 0,
        pendingAmount: 0,
        thisMonthEarnings: 0,
        lastMonthEarnings: 0,
        totalCommissionPaid: 0,
        averageCommissionRate: 0.40,
      },
    });

    vendors.push(vendor);
  }

  console.log(`✅ ${vendors.length} vendors created with commissions and earnings`);

  // 5. Créer des clients (utilisateurs normaux sans rôle spécifique)
  const clients = [];
  const clientNames = [
    { firstName: 'Sophie', lastName: 'Martin' },
    { firstName: 'Lucas', lastName: 'Bernard' },
    { firstName: 'Emma', lastName: 'Dubois' },
    { firstName: 'Nathan', lastName: 'Thomas' },
    { firstName: 'Léa', lastName: 'Robert' },
    { firstName: 'Hugo', lastName: 'Richard' },
    { firstName: 'Chloé', lastName: 'Petit' },
    { firstName: 'Louis', lastName: 'Durand' },
    { firstName: 'Camille', lastName: 'Leroy' },
    { firstName: 'Arthur', lastName: 'Moreau' },
  ];

  for (const clientData of clientNames) {
    const client = await prisma.user.upsert({
      where: { email: `${clientData.firstName.toLowerCase()}.${clientData.lastName.toLowerCase()}@client.com` },
      update: {},
      create: {
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: `${clientData.firstName.toLowerCase()}.${clientData.lastName.toLowerCase()}@client.com`,
        password: hashedPassword,
        status: true,
        userStatus: 'ACTIVE',
        email_verified: true,
        must_change_password: false,
        address: `${Math.floor(Math.random() * 200)} Avenue ${clientData.lastName}`,
        country: 'France',
        phone: `+33 6 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
      },
    });
    clients.push(client);
  }

  console.log(`✅ ${clients.length} clients created`);

  return {
    superAdmin,
    admins: [admin1, admin2],
    vendors,
    clients,
  };
}
