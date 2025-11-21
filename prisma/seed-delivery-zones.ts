import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌍 Seeding delivery zones...');

  // ========================================
  // CITIES - Dakar Ville (Livraison Gratuite)
  // ========================================
  console.log('📍 Seeding cities (Dakar Ville - Free delivery)...');

  const dakarVilleFree = [
    { name: 'Plateau', category: 'Centre', price: 0, isFree: true },
    { name: 'Médina', category: 'Centre', price: 0, isFree: true },
    { name: 'Point E', category: 'Centre', price: 0, isFree: true },
    { name: 'Fann', category: 'Centre', price: 0, isFree: true },
    { name: 'Colobane', category: 'Centre', price: 0, isFree: true },
  ];

  for (const city of dakarVilleFree) {
    await prisma.deliveryCity.upsert({
      where: { id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        category: city.category,
        zoneType: 'dakar-ville',
        status: 'active',
        price: new Prisma.Decimal(city.price),
        isFree: city.isFree,
      },
    });
  }

  // ========================================
  // CITIES - Dakar Ville (Payantes)
  // ========================================
  console.log('📍 Seeding cities (Dakar Ville - Paid delivery)...');

  const dakarVillePaid = [
    { name: 'HLM', category: 'Résidentiel', price: 1500 },
    { name: 'Ouakam', category: 'Résidentiel', price: 1500 },
    { name: 'Ngor', category: 'Résidentiel', price: 2000 },
    { name: 'Yoff', category: 'Résidentiel', price: 1500 },
    { name: 'Sacré-Coeur', category: 'Résidentiel', price: 1000 },
    { name: 'Mermoz', category: 'Résidentiel', price: 1000 },
    { name: 'Almadies', category: 'Résidentiel', price: 2500 },
    { name: 'Grand Dakar', category: 'Résidentiel', price: 1000 },
    { name: 'Gueule Tapée', category: 'Populaire', price: 1000 },
    { name: 'Fass', category: 'Populaire', price: 1000 },
    { name: 'Dieuppeul', category: 'Résidentiel', price: 1500 },
    { name: 'Liberté 6', category: 'Résidentiel', price: 1000 },
  ];

  for (const city of dakarVillePaid) {
    await prisma.deliveryCity.upsert({
      where: { id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        category: city.category,
        zoneType: 'dakar-ville',
        status: 'active',
        price: new Prisma.Decimal(city.price),
        isFree: false,
        deliveryTimeMin: 24,
        deliveryTimeMax: 48,
        deliveryTimeUnit: 'heures',
      },
    });
  }

  // ========================================
  // CITIES - Banlieue de Dakar
  // ========================================
  console.log('📍 Seeding cities (Banlieue)...');

  const banlieue = [
    { name: 'Pikine', price: 2000 },
    { name: 'Guédiawaye', price: 1800 },
    { name: 'Thiaroye-sur-Mer', price: 2200 },
    { name: 'Keur Massar', price: 2000 },
    { name: 'Rufisque', price: 2200 },
    { name: 'Malika', price: 2500 },
    { name: 'Parcelles Assainies', price: 1500 },
    { name: 'Yeumbeul', price: 2000 },
    { name: 'Mbao', price: 2000 },
    { name: 'Bargny', price: 2500 },
  ];

  for (const city of banlieue) {
    await prisma.deliveryCity.upsert({
      where: { id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `city-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        category: 'Banlieue',
        zoneType: 'banlieue',
        status: 'active',
        price: new Prisma.Decimal(city.price),
        isFree: false,
        deliveryTimeMin: 48,
        deliveryTimeMax: 72,
        deliveryTimeUnit: 'heures',
      },
    });
  }

  // ========================================
  // REGIONS - 13 Régions du Sénégal
  // ========================================
  console.log('📍 Seeding regions...');

  const regions = [
    {
      name: 'Diourbel',
      price: 3000,
      deliveryTimeMin: 2,
      deliveryTimeMax: 4,
      mainCities: 'Diourbel, Bambey, Mbacké',
    },
    {
      name: 'Fatick',
      price: 3200,
      deliveryTimeMin: 2,
      deliveryTimeMax: 4,
      mainCities: 'Fatick, Foundiougne, Gossas',
    },
    {
      name: 'Kaffrine',
      price: 3500,
      deliveryTimeMin: 3,
      deliveryTimeMax: 5,
      mainCities: 'Kaffrine, Koungheul, Birkelane',
    },
    {
      name: 'Kaolack',
      price: 2800,
      deliveryTimeMin: 2,
      deliveryTimeMax: 4,
      mainCities: 'Kaolack, Guinguinéo, Nioro du Rip',
    },
    {
      name: 'Kédougou',
      price: 5000,
      deliveryTimeMin: 5,
      deliveryTimeMax: 7,
      mainCities: 'Kédougou, Saraya, Salémata',
    },
    {
      name: 'Kolda',
      price: 4500,
      deliveryTimeMin: 4,
      deliveryTimeMax: 6,
      mainCities: 'Kolda, Vélingara, Médina Yoro Foulah',
    },
    {
      name: 'Louga',
      price: 2500,
      deliveryTimeMin: 2,
      deliveryTimeMax: 3,
      mainCities: 'Louga, Linguère, Kébémer',
    },
    {
      name: 'Matam',
      price: 4000,
      deliveryTimeMin: 3,
      deliveryTimeMax: 5,
      mainCities: 'Matam, Kanel, Ranérou',
    },
    {
      name: 'Saint-Louis',
      price: 2200,
      deliveryTimeMin: 1,
      deliveryTimeMax: 3,
      mainCities: 'Saint-Louis, Dagana, Podor',
    },
    {
      name: 'Sédhiou',
      price: 4200,
      deliveryTimeMin: 4,
      deliveryTimeMax: 6,
      mainCities: 'Sédhiou, Goudomp, Bounkiling',
    },
    {
      name: 'Tambacounda',
      price: 4800,
      deliveryTimeMin: 4,
      deliveryTimeMax: 6,
      mainCities: 'Tambacounda, Bakel, Goudiry',
    },
    {
      name: 'Thiès',
      price: 2000,
      deliveryTimeMin: 1,
      deliveryTimeMax: 2,
      mainCities: 'Thiès, Mbour, Tivaouane',
    },
    {
      name: 'Ziguinchor',
      price: 5000,
      deliveryTimeMin: 5,
      deliveryTimeMax: 7,
      mainCities: 'Ziguinchor, Oussouye, Bignona',
    },
  ];

  for (const region of regions) {
    await prisma.deliveryRegion.upsert({
      where: { name: region.name },
      update: {},
      create: {
        id: `region-${region.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: region.name,
        status: 'active',
        price: new Prisma.Decimal(region.price),
        deliveryTimeMin: region.deliveryTimeMin,
        deliveryTimeMax: region.deliveryTimeMax,
        deliveryTimeUnit: 'jours',
        mainCities: region.mainCities,
      },
    });
  }

  // ========================================
  // INTERNATIONAL ZONES
  // ========================================
  console.log('🌍 Seeding international zones...');

  const internationalZones = [
    {
      name: 'Afrique de l\'Ouest',
      countries: ['Mali', 'Mauritanie', 'Guinée', 'Côte d\'Ivoire', 'Burkina Faso', 'Niger'],
      price: 15000,
      deliveryTimeMin: 5,
      deliveryTimeMax: 10,
    },
    {
      name: 'Afrique Centrale',
      countries: ['Cameroun', 'Gabon', 'Congo', 'RDC', 'Tchad'],
      price: 20000,
      deliveryTimeMin: 7,
      deliveryTimeMax: 14,
    },
    {
      name: 'Afrique du Nord',
      countries: ['Maroc', 'Algérie', 'Tunisie', 'Libye', 'Égypte'],
      price: 18000,
      deliveryTimeMin: 7,
      deliveryTimeMax: 12,
    },
    {
      name: 'Afrique de l\'Est',
      countries: ['Kenya', 'Tanzanie', 'Éthiopie', 'Ouganda', 'Rwanda'],
      price: 25000,
      deliveryTimeMin: 10,
      deliveryTimeMax: 15,
    },
    {
      name: 'Europe',
      countries: ['France', 'Belgique', 'Espagne', 'Italie', 'Allemagne', 'Royaume-Uni'],
      price: 30000,
      deliveryTimeMin: 7,
      deliveryTimeMax: 14,
    },
    {
      name: 'Amérique du Nord',
      countries: ['États-Unis', 'Canada'],
      price: 35000,
      deliveryTimeMin: 10,
      deliveryTimeMax: 20,
    },
  ];

  for (const zone of internationalZones) {
    const created = await prisma.deliveryInternationalZone.upsert({
      where: { id: `zone-${zone.name.toLowerCase().replace(/['\s]+/g, '-')}` },
      update: {},
      create: {
        id: `zone-${zone.name.toLowerCase().replace(/['\s]+/g, '-')}`,
        name: zone.name,
        status: 'active',
        price: new Prisma.Decimal(zone.price),
        deliveryTimeMin: zone.deliveryTimeMin,
        deliveryTimeMax: zone.deliveryTimeMax,
      },
    });

    // Delete existing countries and recreate
    await prisma.deliveryInternationalCountry.deleteMany({
      where: { zoneId: created.id },
    });

    for (const country of zone.countries) {
      await prisma.deliveryInternationalCountry.create({
        data: {
          zoneId: created.id,
          country,
        },
      });
    }
  }

  console.log('✅ Delivery zones seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding delivery zones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
