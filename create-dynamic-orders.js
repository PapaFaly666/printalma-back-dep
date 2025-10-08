const { PrismaClient, OrderStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création de commandes dynamiques Admin <-> Vendeur...\n');

  try {
    // 1. Vérifier le vendeur pf.d@zig.univ.sn
    const vendor = await prisma.user.findUnique({
      where: { email: 'pf.d@zig.univ.sn' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true
      }
    });

    if (!vendor) {
      throw new Error('❌ Vendeur pf.d@zig.univ.sn non trouvé');
    }

    console.log('✅ Vendeur trouvé:', {
      id: vendor.id,
      email: vendor.email,
      name: `${vendor.firstName} ${vendor.lastName}`,
      role: vendor.role
    });

    // 2. Vérifier/Mettre à jour le mot de passe
    const passwordToSet = 'printalmatest123';
    const isPasswordCorrect = await bcrypt.compare(passwordToSet, vendor.password);

    if (!isPasswordCorrect) {
      console.log('🔑 Mise à jour du mot de passe...');
      const hashedPassword = await bcrypt.hash(passwordToSet, 10);
      await prisma.user.update({
        where: { id: vendor.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Mot de passe mis à jour: printalmatest123\n');
    } else {
      console.log('✅ Mot de passe déjà correct: printalmatest123\n');
    }

    // 3. Créer des produits mockup admin si nécessaire
    let products = await prisma.product.findMany({
      take: 3,
      include: {
        colorVariations: true
      }
    });

    if (products.length === 0) {
      console.log('📦 Création de produits mockup admin pour les tests...\n');

      // Créer 3 produits de base
      for (let i = 1; i <= 3; i++) {
        const product = await prisma.product.create({
          data: {
            name: `T-Shirt Test ${i}`,
            description: `Produit de test ${i} pour les commandes dynamiques`,
            price: 5000 + (i * 1000),
            stock: 50,
            status: 'PUBLISHED',
            isReadyProduct: true,
            isValidated: true,
            colorVariations: {
              create: [
                {
                  name: 'Blanc',
                  colorCode: '#FFFFFF'
                },
                {
                  name: 'Noir',
                  colorCode: '#000000'
                }
              ]
            }
          },
          include: {
            colorVariations: true
          }
        });
        console.log(`✅ Produit créé: ${product.name} (ID: ${product.id})`);
      }

      products = await prisma.product.findMany({
        take: 3,
        include: {
          colorVariations: true
        }
      });
    }

    console.log(`✅ ${products.length} produit(s) disponible(s) pour créer les commandes\n`);

    // 4. Récupérer un client (utilisateur normal)
    let client = await prisma.user.findFirst({
      where: {
        role: null,
        email: { not: vendor.email }
      }
    });

    // Si aucun client n'existe, en créer un
    if (!client) {
      console.log('📝 Création d\'un client de test...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      client = await prisma.user.create({
        data: {
          email: 'client.test@printalma.sn',
          password: hashedPassword,
          firstName: 'Client',
          lastName: 'Test',
          phone: '+221701234567',
          country: 'Sénégal',
          address: 'Dakar, Sénégal'
        }
      });
      console.log('✅ Client créé:', client.email, '\n');
    } else {
      console.log('✅ Client trouvé:', client.email, '\n');
    }

    // 5. Créer des commandes avec différents statuts
    const ordersToCreate = [
      {
        status: OrderStatus.PENDING,
        description: 'Commande en attente',
        productIndex: 0
      },
      {
        status: OrderStatus.CONFIRMED,
        description: 'Commande confirmée',
        productIndex: products.length > 1 ? 1 : 0
      },
      {
        status: OrderStatus.SHIPPED,
        description: 'Commande expédiée',
        productIndex: products.length > 2 ? 2 : 0
      }
    ];

    const createdOrders = [];

    for (const orderData of ordersToCreate) {
      const product = products[orderData.productIndex];
      const colorVariation = product.colorVariations[0];

      if (!colorVariation) {
        console.log(`⚠️ Pas de variation de couleur pour le produit ${product.name}, skip`);
        continue;
      }

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: client.id,
          status: orderData.status,
          totalAmount: product.price * 2, // quantité = 2
          phoneNumber: client.phone || '+221700000000',
          notes: orderData.description,
          shippingName: `${client.firstName} ${client.lastName}`,
          shippingStreet: client.address,
          shippingCity: 'Dakar',
          shippingRegion: 'Dakar',
          shippingPostalCode: '10000',
          shippingCountry: client.country || 'Sénégal',
          shippingAddressFull: `${client.address}, Dakar, Sénégal`,
          confirmedAt: orderData.status !== OrderStatus.PENDING ? new Date() : null,
          shippedAt: orderData.status === OrderStatus.SHIPPED ? new Date() : null,
          orderItems: {
            create: [
              {
                productId: product.id,
                quantity: 2,
                unitPrice: product.price,
                size: 'M',
                color: colorVariation.name,
                colorId: colorVariation.id
              }
            ]
          }
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true
            }
          },
          user: true
        }
      });

      createdOrders.push(order);

      console.log(`✅ Commande créée: ${order.orderNumber}`);
      console.log(`   Statut: ${order.status}`);
      console.log(`   Produit: ${product.name}`);
      console.log(`   Couleur: ${colorVariation.name}`);
      console.log(`   Montant: ${order.totalAmount} FCFA`);
      console.log(`   Client: ${client.email}\n`);
    }

    // 6. Récapitulatif
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉCAPITULATIF');
    console.log('='.repeat(60));
    console.log(`\n👤 VENDEUR:`);
    console.log(`   Email: ${vendor.email}`);
    console.log(`   Mot de passe: printalmatest123`);
    console.log(`   ID: ${vendor.id}`);
    console.log(`   Nom: ${vendor.firstName} ${vendor.lastName}`);

    console.log(`\n👥 CLIENT:`);
    console.log(`   Email: ${client.email}`);
    console.log(`   ID: ${client.id}`);

    console.log(`\n📦 COMMANDES CRÉÉES: ${createdOrders.length}`);
    createdOrders.forEach((order, index) => {
      console.log(`\n   ${index + 1}. ${order.orderNumber}`);
      console.log(`      Statut: ${order.status}`);
      console.log(`      Montant: ${order.totalAmount} FCFA`);
      console.log(`      Articles: ${order.orderItems.length}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCÈS - Système de commandes dynamiques initialisé!');
    console.log('='.repeat(60));
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('   1. Connecte-toi en tant que vendeur: pf.d@zig.univ.sn');
    console.log('   2. Consulte tes commandes (endpoint: GET /orders/vendor)');
    console.log('   3. L\'admin peut modifier le statut (PATCH /orders/:id/status)');
    console.log('   4. Le vendeur voit les changements en temps réel\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
