// Script de test simple pour tester nos endpoints vendor-orders
const axios = require('axios');

async function testVendorEndpoints() {
  console.log('🧪 Test des endpoints vendor-orders...');

  try {
    // Tester que l'API démarre
    const healthCheck = await axios.get('http://localhost:3000').catch(e => ({
      data: 'Serveur non démarré',
      status: 0
    }));

    if (healthCheck.status === 0) {
      console.log('❌ Serveur non accessible. Démarrez le serveur avec: npm run start:dev');
      return;
    }

    console.log('✅ Serveur accessible');

    // Test simple des endpoints sans authentification pour voir les erreurs
    const endpoints = [
      'GET /vendor/orders',
      'GET /vendor/orders/statistics'
    ];

    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      const url = `http://localhost:3000${path}`;

      try {
        const response = await axios.get(url);
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`⚠️  ${endpoint}: 401 (Authentication required - normal)`);
        } else {
          console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.message}`);
        }
      }
    }

    // Tester avec des vendeurs existants
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const vendors = await prisma.user.findMany({
      where: { role: 'VENDEUR' },
      take: 3
    });

    console.log(`\n📊 ${vendors.length} vendeurs trouvés dans la DB:`);
    vendors.forEach(v => {
      console.log(`  - ${v.email} (ID: ${v.id})`);
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testVendorEndpoints();