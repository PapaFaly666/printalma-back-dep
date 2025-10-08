const { PrismaClient, OrderStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Création de commandes liées aux produits vendeur...\n');

  try {
    // 1. Récupérer le vendeur
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!vendor) {
      throw new Error('❌ Vendeur pf.d@zig.univ.sn non trouvé');
    }

    console.log('✅ Vendeur:', vendor.email, `(ID: ${vendor.id})\n`);

    // 2. Vérifier/Créer des produits VENDEUR (VendorProduct)
    let vendorProducts = await prisma.vendorProduct.findMany({
      where: {
        vendorId: vendor.id,
        isValidated: true,
        status: 'PUBLISHED'
      },
      include: {
        baseProduct: {
          include: {
            colorVariations: true
          }
        }
      }
    });

    console.log(`📦 Produits vendeur trouvés: ${vendorProducts.length}\n`);

    // Si aucun produit vendeur, créer des produits de base et les lier
    if (vendorProducts.length === 0) {
      console.log('📦 Création de produits vendeur...\n');

      // Récupérer ou créer des produits de base (admin)
      let baseProducts = await prisma.product.findMany({
        take: 5,
        include: { colorVariations: true }
      });

      if (baseProducts.length === 0) {
        console.log('📦 Création de produits de base admin...\n');

        for (let i = 1; i <= 5; i++) {
          await prisma.product.create({
            data: {
              name: `Produit Vendeur ${i}`,
              description: `Produit ${i} pour le vendeur`,
              price: 5000 + (i * 1000),
              stock: 50,
              status: 'PUBLISHED',
              isReadyProduct: true,
              isValidated: true,
              colorVariations: {
                create: [
                  { name: 'Blanc', colorCode: '#FFFFFF' },
                  { name: 'Noir', colorCode: '#000000' }
                ]
              }
            }
          });
        }

        baseProducts = await prisma.product.findMany({
          take: 5,
          include: { colorVariations: true }
        });
      }

      // Créer des VendorProduct pour ce vendeur
      for (const baseProduct of baseProducts) {
        await prisma.vendorProduct.create({
          data: {
            baseProductId: baseProduct.id,
            vendorId: vendor.id,
            name: `${baseProduct.name} - Par ${vendor.firstName}`,
            description: baseProduct.description,
            price: baseProduct.price + 2000, // Marge vendeur
            stock: 20,
            status: 'PUBLISHED',
            isValidated: true,
            sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
            colors: JSON.stringify(baseProduct.colorVariations.map(c => ({
              name: c.name,
              code: c.colorCode
            })))
          }
        });
      }

      vendorProducts = await prisma.vendorProduct.findMany({
        where: {
          vendorId: vendor.id,
          isValidated: true,
          status: 'PUBLISHED'
        },
        include: {
          baseProduct: {
            include: {
              colorVariations: true
            }
          }
        }
      });

      console.log(`✅ ${vendorProducts.length} produits vendeur créés\n`);
    }

    // 3. Récupérer/Créer clients
    let clients = await prisma.user.findMany({
      where: {
        role: null,
        email: { not: vendor.email }
      },
      take: 5
    });

    if (clients.length === 0) {
      console.log('👥 Création de clients...\n');

      const hashedPassword = await bcrypt.hash('password123', 10);

      const clientsToCreate = [
        { email: 'client1@test.sn', firstName: 'Moussa', lastName: 'Fall', phone: '+221771111111' },
        { email: 'client2@test.sn', firstName: 'Fatou', lastName: 'Sow', phone: '+221772222222' },
        { email: 'client3@test.sn', firstName: 'Ousmane', lastName: 'Diop', phone: '+221773333333' }
      ];

      for (const clientData of clientsToCreate) {
        await prisma.user.create({
          data: {
            ...clientData,
            password: hashedPassword,
            country: 'Sénégal',
            address: 'Dakar, Sénégal'
          }
        });
      }

      clients = await prisma.user.findMany({
        where: {
          role: null,
          email: { not: vendor.email }
        }
      });
    }

    console.log(`✅ ${clients.length} clients disponibles\n`);

    // 4. Supprimer les anciennes commandes
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    console.log('✅ Anciennes commandes supprimées\n');

    // 5. IMPORTANT: Créer des commandes où le CLIENT achète des produits,
    // et on stocke l'information du vendeur dans les notes ou via le productId
    // Le système actuel lie les commandes aux CLIENTS, pas aux VENDEURS

    console.log('📦 Création de 30 commandes (clients achetant produits vendeur)...\n');

    const statuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED
    ];

    const createdOrders = [];

    for (let i = 0; i < 30; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const vendorProduct = vendorProducts[Math.floor(Math.random() * vendorProducts.length)];
      const baseProduct = vendorProduct.baseProduct;
      const colorVariation = baseProduct.colorVariations[0];

      let status;
      const rand = Math.random();
      if (rand < 0.3) status = OrderStatus.PENDING;
      else if (rand < 0.6) status = OrderStatus.CONFIRMED;
      else if (rand < 0.75) status = OrderStatus.PROCESSING;
      else if (rand < 0.85) status = OrderStatus.SHIPPED;
      else if (rand < 0.95) status = OrderStatus.DELIVERED;
      else status = OrderStatus.CANCELLED;

      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalAmount = vendorProduct.price * quantity;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`,
          userId: client.id, // CLIENT qui passe commande
          status,
          totalAmount,
          phoneNumber: client.phone || '+221700000000',
          notes: `Produit vendeur: ${vendor.firstName} ${vendor.lastName} (ID: ${vendor.id}) - VendorProduct: ${vendorProduct.id}`,
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
            create: [{
              productId: baseProduct.id,
              quantity,
              unitPrice: vendorProduct.price,
              size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
              color: colorVariation.name,
              colorId: colorVariation.id
            }]
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
        console.log(`✅ ${i + 1}/30 commandes créées...`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT - SYSTÈME ACTUEL');
    console.log('='.repeat(60));
    console.log('\n🔍 ANALYSE:');
    console.log('   Le système actuel lie les commandes aux CLIENTS (userId)');
    console.log('   Endpoint /orders/my-orders retourne les commandes du USER connecté');
    console.log('   \n   PROBLÈME: Le vendeur n\'a PAS de commandes car:');
    console.log('   - userId dans Order = ID du CLIENT qui achète');
    console.log('   - Le vendeur est identifié via le produit vendu');
    console.log('   - Pas de champ "vendorId" dans le modèle Order\n');

    console.log('📊 STATISTIQUES:');
    const stats = {
      PENDING: createdOrders.filter(o => o.status === OrderStatus.PENDING).length,
      CONFIRMED: createdOrders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      PROCESSING: createdOrders.filter(o => o.status === OrderStatus.PROCESSING).length,
      SHIPPED: createdOrders.filter(o => o.status === OrderStatus.SHIPPED).length,
      DELIVERED: createdOrders.filter(o => o.status === OrderStatus.DELIVERED).length,
      CANCELLED: createdOrders.filter(o => o.status === OrderStatus.CANCELLED).length
    };

    console.log(`   🟡 PENDING: ${stats.PENDING}`);
    console.log(`   🔵 CONFIRMED: ${stats.CONFIRMED}`);
    console.log(`   🟣 PROCESSING: ${stats.PROCESSING}`);
    console.log(`   🟠 SHIPPED: ${stats.SHIPPED}`);
    console.log(`   🟢 DELIVERED: ${stats.DELIVERED}`);
    console.log(`   🔴 CANCELLED: ${stats.CANCELLED}`);

    console.log('\n' + '='.repeat(60));
    console.log('💡 SOLUTIONS POSSIBLES');
    console.log('='.repeat(60));
    console.log('\n1. MODIFIER LE SCHÉMA (Recommandé):');
    console.log('   - Ajouter "vendorId Int?" dans le modèle Order');
    console.log('   - Créer relation Order -> User (vendeur)');
    console.log('   - Créer endpoint GET /orders/vendor pour le vendeur');
    console.log('\n2. UTILISER LES PRODUITS (Actuel):');
    console.log('   - Joindre Order.orderItems.product.vendorProducts');
    console.log('   - Filtrer par vendorId dans VendorProduct');
    console.log('   - Plus complexe, requêtes plus lentes\n');

    console.log('='.repeat(60));
    console.log('❓ QUELLE SOLUTION PRÉFÉREZ-VOUS?');
    console.log('='.repeat(60));
    console.log('   A) Modifier le schéma Prisma (propre, performant)');
    console.log('   B) Créer endpoint spécial vendeur avec jointures\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
