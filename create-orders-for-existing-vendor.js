const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOrdersForVendor() {
  console.log('🌱 Création des commandes de test pour pf.d@zig.univ.sn...');

  try {
    const vendorId = 7; // ID du vendeur pf.d@zig.univ.sn

    // 1. Vérifier que le vendeur existe
    const vendor = await prisma.user.findFirst({
      where: { id: vendorId }
    });

    if (!vendor) {
      console.log('❌ Vendeur avec ID 7 non trouvé');
      return;
    }
    console.log('✅ Vendeur trouvé:', vendor.email);

    // 2. Créer un client de test
    const client = await prisma.user.upsert({
      where: { email: 'client.test@email.com' },
      update: {},
      create: {
        firstName: 'Client',
        lastName: 'Test',
        email: 'client.test@email.com',
        password: '$2b$10$example',
        role: 'VENDEUR', // Le schéma par défaut est VENDEUR
        status: true,
        phone: '+221 77 123 45 67',
        country: 'Sénégal',
        address: '123 Rue Test, Dakar',
      },
    });
    console.log('✅ Client créé:', client.email);

    // 3. Trouver des produits du vendeur existants
    const vendorProducts = await prisma.vendorProduct.findMany({
      where: { vendorId: vendorId },
      include: { baseProduct: true },
      take: 2
    });

    if (vendorProducts.length === 0) {
      console.log('❌ Aucun produit trouvé pour ce vendeur');
      return;
    }
    console.log('✅ Produits du vendeur trouvés:', vendorProducts.length);

    // 4. Créer des commandes de test avec différents statuts
    const orders = await Promise.all([
      // Commande en traitement
      prisma.order.create({
        data: {
          orderNumber: `CMD-TEST-${Date.now()}-001`,
          userId: client.id,
          status: 'PROCESSING',
          totalAmount: 35000,
          subtotal: 31500,
          taxAmount: 0,
          shippingAmount: 3500,
          paymentMethod: 'MOBILE_MONEY',
          phoneNumber: '+221 77 123 45 67',
          notes: 'Commande de test - Livraison urgente',
          shippingName: 'Client Test',
          shippingStreet: '123 Rue Test',
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingCountry: 'Sénégal',
          shippingAddressFull: '123 Rue Test, Dakar, Sénégal',
          confirmedAt: new Date(),
        },
      }),
      // Commande en attente
      prisma.order.create({
        data: {
          orderNumber: `CMD-TEST-${Date.now()}-002`,
          userId: client.id,
          status: 'PENDING',
          totalAmount: 17500,
          subtotal: 17500,
          taxAmount: 0,
          shippingAmount: 0,
          paymentMethod: 'MOBILE_MONEY',
          phoneNumber: '+221 77 123 45 67',
          notes: 'Commande de test - En attente',
          shippingName: 'Client Test',
          shippingStreet: '123 Rue Test',
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingCountry: 'Sénégal',
          shippingAddressFull: '123 Rue Test, Dakar, Sénégal',
        },
      }),
      // Commande livrée
      prisma.order.create({
        data: {
          orderNumber: `CMD-TEST-${Date.now()}-003`,
          userId: client.id,
          status: 'DELIVERED',
          totalAmount: 52500,
          subtotal: 49000,
          taxAmount: 0,
          shippingAmount: 3500,
          paymentMethod: 'MOBILE_MONEY',
          phoneNumber: '+221 77 123 45 67',
          shippingName: 'Client Test',
          shippingStreet: '123 Rue Test',
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingCountry: 'Sénégal',
          shippingAddressFull: '123 Rue Test, Dakar, Sénégal',
          confirmedAt: new Date(Date.now() - 3*24*60*60*1000), // il y a 3 jours
          shippedAt: new Date(Date.now() - 2*24*60*60*1000), // il y a 2 jours
          deliveredAt: new Date(Date.now() - 1*24*60*60*1000), // hier
        },
      }),
    ]);
    console.log('✅ Commandes créées:', orders.map(o => o.orderNumber).join(', '));

    // 5. Créer les items de commande avec les produits du vendeur
    const orderItems = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const product = vendorProducts[i % vendorProducts.length]; // Alterner les produits

      const item = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.baseProductId,
          quantity: i + 1,
          unitPrice: product.price,
          size: 'M',
          color: 'Noir',
        },
      });
      orderItems.push(item);
    }
    console.log('✅ Items de commande créés:', orderItems.length);

    // 6. Créer des notifications pour le vendeur
    const notifications = await Promise.all(
      orders.slice(0, 2).map(async (order, index) => {
        return await prisma.notification.create({
          data: {
            userId: vendorId,
            type: 'ORDER_NEW',
            title: 'Nouvelle commande',
            message: `Vous avez reçu une nouvelle commande ${order.orderNumber}`,
            isRead: false,
            metadata: { orderId: order.id },
          },
        });
      })
    );
    console.log('✅ Notifications créées:', notifications.length);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📊 Résumé:');
    console.log(`- Vendeur: ${vendor.email} (ID: ${vendor.id})`);
    console.log(`- Client: ${client.email}`);
    console.log(`- Commandes: ${orders.length}`);
    console.log(`- Items: ${orderItems.length}`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log('\n🔑 Pour tester les endpoints:');
    console.log(`1. Connectez-vous avec ${vendor.email}`);
    console.log('2. Utilisez le token JWT pour accéder aux endpoints /vendor/orders');
    console.log('3. Le vendeur ID est:', vendor.id);

  } catch (error) {
    console.error('❌ Erreur lors de la création des commandes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createOrdersForVendor()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });