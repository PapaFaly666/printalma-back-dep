const { PrismaClient, OrderStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Suppression de toutes les commandes existantes...\n');

  try {
    // 1. Supprimer toutes les commandes existantes
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ ${deletedOrderItems.count} articles de commande supprimés`);

    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`✅ ${deletedOrders.count} commandes supprimées\n`);

    // 2. Vérifier le vendeur
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!vendor) {
      throw new Error('❌ Vendeur pf.d@zig.univ.sn non trouvé');
    }

    console.log('✅ Vendeur:', vendor.email, `(ID: ${vendor.id})\n`);

    // 3. Vérifier/Créer des produits
    let products = await prisma.product.findMany({
      take: 10,
      include: { colorVariations: true }
    });

    if (products.length < 5) {
      console.log('📦 Création de produits supplémentaires...\n');

      const productsToCreate = [
        { name: 'T-Shirt Classic Blanc', price: 5500, description: 'T-shirt 100% coton' },
        { name: 'Polo Sport Noir', price: 7500, description: 'Polo élégant' },
        { name: 'Sweat à Capuche Gris', price: 12000, description: 'Sweat confortable' },
        { name: 'Chemise Business Bleu', price: 9500, description: 'Chemise professionnelle' },
        { name: 'Veste Casual Beige', price: 15000, description: 'Veste légère' },
        { name: 'Pantalon Chino Marron', price: 11000, description: 'Pantalon casual' },
        { name: 'Short Sport Vert', price: 6500, description: 'Short respirant' },
        { name: 'Débardeur Fitness Rouge', price: 4500, description: 'Débardeur sport' }
      ];

      for (const prod of productsToCreate) {
        await prisma.product.create({
          data: {
            name: prod.name,
            description: prod.description,
            price: prod.price,
            stock: 100,
            status: 'PUBLISHED',
            isReadyProduct: true,
            isValidated: true,
            colorVariations: {
              create: [
                { name: 'Blanc', colorCode: '#FFFFFF' },
                { name: 'Noir', colorCode: '#000000' },
                { name: 'Gris', colorCode: '#808080' }
              ]
            }
          }
        });
      }

      products = await prisma.product.findMany({
        include: { colorVariations: true }
      });
    }

    console.log(`✅ ${products.length} produits disponibles\n`);

    // 4. Vérifier/Créer clients
    const existingClients = await prisma.user.findMany({
      where: {
        role: null,
        email: { not: vendor.email }
      },
      take: 5
    });

    let clients = existingClients;

    if (clients.length < 3) {
      console.log('👥 Création de clients supplémentaires...\n');

      const clientsToCreate = [
        { email: 'moussa.fall@gmail.com', firstName: 'Moussa', lastName: 'Fall', phone: '+221771234567' },
        { email: 'fatou.sow@gmail.com', firstName: 'Fatou', lastName: 'Sow', phone: '+221772345678' },
        { email: 'ousmane.diop@gmail.com', firstName: 'Ousmane', lastName: 'Diop', phone: '+221773456789' },
        { email: 'aissatou.kane@gmail.com', firstName: 'Aissatou', lastName: 'Kane', phone: '+221774567890' },
        { email: 'ibrahima.ndiaye@gmail.com', firstName: 'Ibrahima', lastName: 'Ndiaye', phone: '+221775678901' }
      ];

      const hashedPassword = await bcrypt.hash('password123', 10);

      for (const clientData of clientsToCreate) {
        const existing = await prisma.user.findUnique({
          where: { email: clientData.email }
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              ...clientData,
              password: hashedPassword,
              country: 'Sénégal',
              address: 'Dakar, Sénégal'
            }
          });
        }
      }

      clients = await prisma.user.findMany({
        where: {
          role: null,
          email: { not: vendor.email }
        }
      });
    }

    console.log(`✅ ${clients.length} clients disponibles\n`);

    // 5. Créer BEAUCOUP de commandes (50 commandes)
    console.log('📦 Création de 50 commandes...\n');

    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED
    ];

    const createdOrders = [];

    for (let i = 0; i < 50; i++) {
      // Sélectionner un client aléatoire
      const client = clients[Math.floor(Math.random() * clients.length)];

      // Sélectionner 1-3 produits aléatoires
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const colorVariation = product.colorVariations[Math.floor(Math.random() * product.colorVariations.length)];
        selectedProducts.push({ product, colorVariation });
      }

      // Sélectionner un statut aléatoire (avec plus de chances pour PENDING et CONFIRMED)
      let status;
      const rand = Math.random();
      if (rand < 0.3) status = OrderStatus.PENDING;
      else if (rand < 0.6) status = OrderStatus.CONFIRMED;
      else if (rand < 0.75) status = OrderStatus.PROCESSING;
      else if (rand < 0.85) status = OrderStatus.SHIPPED;
      else if (rand < 0.95) status = OrderStatus.DELIVERED;
      else status = OrderStatus.CANCELLED;

      // Calculer le total
      const totalAmount = selectedProducts.reduce((sum, item) => sum + item.product.price * 2, 0);

      // Créer la date (commandes des 30 derniers jours)
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`,
          userId: client.id,
          status,
          totalAmount,
          phoneNumber: client.phone || '+221700000000',
          notes: `Commande ${i + 1} - ${status}`,
          shippingName: `${client.firstName} ${client.lastName}`,
          shippingStreet: client.address,
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingPostalCode: '10000',
          shippingCountry: 'Sénégal',
          shippingAddressFull: `${client.address}, Dakar, Sénégal`,
          createdAt,
          confirmedAt: status !== OrderStatus.PENDING ? new Date(createdAt.getTime() + 60000) : null,
          shippedAt: [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(status)
            ? new Date(createdAt.getTime() + 120000)
            : null,
          deliveredAt: status === OrderStatus.DELIVERED
            ? new Date(createdAt.getTime() + 180000)
            : null,
          orderItems: {
            create: selectedProducts.map(({ product, colorVariation }) => ({
              productId: product.id,
              quantity: 2,
              unitPrice: product.price,
              size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
              color: colorVariation.name,
              colorId: colorVariation.id
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          user: true
        }
      });

      createdOrders.push(order);

      if ((i + 1) % 10 === 0) {
        console.log(`✅ ${i + 1}/50 commandes créées...`);
      }
    }

    // 6. Statistiques finales
    console.log('\n' + '='.repeat(60));
    console.log('📊 STATISTIQUES FINALES');
    console.log('='.repeat(60));

    const stats = {
      PENDING: createdOrders.filter(o => o.status === OrderStatus.PENDING).length,
      CONFIRMED: createdOrders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      PROCESSING: createdOrders.filter(o => o.status === OrderStatus.PROCESSING).length,
      SHIPPED: createdOrders.filter(o => o.status === OrderStatus.SHIPPED).length,
      DELIVERED: createdOrders.filter(o => o.status === OrderStatus.DELIVERED).length,
      CANCELLED: createdOrders.filter(o => o.status === OrderStatus.CANCELLED).length
    };

    console.log(`\n📦 TOTAL COMMANDES: ${createdOrders.length}`);
    console.log(`\n📊 RÉPARTITION PAR STATUT:`);
    console.log(`   🟡 PENDING (En attente): ${stats.PENDING}`);
    console.log(`   🔵 CONFIRMED (Confirmée): ${stats.CONFIRMED}`);
    console.log(`   🟣 PROCESSING (En traitement): ${stats.PROCESSING}`);
    console.log(`   🟠 SHIPPED (Expédiée): ${stats.SHIPPED}`);
    console.log(`   🟢 DELIVERED (Livrée): ${stats.DELIVERED}`);
    console.log(`   🔴 CANCELLED (Annulée): ${stats.CANCELLED}`);

    const totalRevenue = createdOrders
      .filter(o => [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    console.log(`\n💰 CHIFFRE D'AFFAIRES TOTAL: ${totalRevenue.toLocaleString('fr-FR')} FCFA`);

    console.log(`\n👥 CLIENTS: ${clients.length}`);
    console.log(`📦 PRODUITS: ${products.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCÈS - 50 commandes créées!');
    console.log('='.repeat(60));

    console.log('\n📋 INFORMATIONS DE CONNEXION:');
    console.log(`   Vendeur: pf.d@zig.univ.sn`);
    console.log(`   Mot de passe: printalmatest123`);
    console.log(`   Endpoint: GET /orders/my-orders`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
