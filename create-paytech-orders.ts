import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createPaytechOrders() {
  console.log('🚀 Création de commandes Paytech complètes...');

  try {
    // 1. Créer des utilisateurs de test
    console.log('📝 Création des utilisateurs...');

    const testUser1 = await prisma.user.upsert({
      where: { email: 'testuser1@paytech.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'User 1',
        email: 'testuser1@paytech.com',
        password: await bcrypt.hash('password123', 10),
        phone: '221770000001',
        role: 'VENDEUR',
        status: true,
        userStatus: 'ACTIVE'
      }
    });

    const testUser2 = await prisma.user.upsert({
      where: { email: 'testuser2@paytech.com' },
      update: {},
      create: {
        firstName: 'Test',
        lastName: 'User 2',
        email: 'testuser2@paytech.com',
        password: await bcrypt.hash('password123', 10),
        phone: '221770000002',
        role: 'VENDEUR',
        status: true,
        userStatus: 'ACTIVE'
      }
    });

    console.log(`✅ Utilisateurs créés: ${testUser1.id} (${testUser1.email}), ${testUser2.id} (${testUser2.email})`);

    // 2. Créer des catégories et produits
    console.log('📦 Création des catégories et produits...');

    const category = await prisma.category.upsert({
      where: { slug: 'vetements-test' },
      update: {},
      create: {
        name: 'Vêtements Test',
        slug: 'vetements-test',
        description: 'Catégorie de test pour Paytech',
        displayOrder: 1,
        isActive: true
      }
    });

    const subCategory = await prisma.subCategory.upsert({
      where: { unique_subcategory_per_category: { name: 'T-Shirts Test', categoryId: category.id } },
      update: {},
      create: {
        name: 'T-Shirts Test',
        slug: 't-shirts-test',
        categoryId: category.id,
        displayOrder: 1,
        isActive: true
      }
    });

    const product1 = await prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'T-Shirt Paytech Test 1',
        description: 'T-Shirt de test pour intégration Paytech',
        price: 5000,
        stock: 100,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        isValidated: true,
        isReadyProduct: true
      }
    });

    const product2 = await prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'T-Shirt Paytech Test 2',
        description: 'T-Shirt premium de test pour Paytech',
        price: 7500,
        stock: 50,
        status: 'PUBLISHED',
        categoryId: category.id,
        subCategoryId: subCategory.id,
        isValidated: true,
        isReadyProduct: true
      }
    });

    console.log(`✅ Produits créés: ${product1.name} (${product1.price} XOF), ${product2.name} (${product2.price} XOF)`);

    // 3. Créer des commandes complètes avec Paytech
    console.log('💳 Création des commandes Paytech...');

    // Commande 1 - En attente de paiement
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-TEST-001',
        userId: testUser1.id,
        status: 'PENDING',
        totalAmount: 5000,
        phoneNumber: testUser1.phone,
        paymentMethod: 'PAYTECH',
        paymentStatus: 'PENDING',
        transactionId: '405gzopmh98s6qc', // Token Paytech
        notes: 'Commande de test Paytech - En attente',
        shippingName: `${testUser1.firstName} ${testUser1.lastName}`,
        shippingStreet: 'Rue du Test Paytech',
        shippingCity: 'Dakar',
        shippingCountry: 'Sénégal',
        shippingAmount: 1000,
        subtotal: 5000,
        taxAmount: 500,
        orderItems: {
          create: {
            productId: product1.id,
            quantity: 1,
            unitPrice: product1.price,
            size: 'L',
            color: 'Noir'
          }
        }
      },
      include: {
        orderItems: true,
        user: true
      }
    });

    // Commande 2 - Paiement réussi (simulé)
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-TEST-002',
        userId: testUser2.id,
        status: 'CONFIRMED',
        totalAmount: 7500,
        phoneNumber: testUser2.phone,
        paymentMethod: 'PAYTECH',
        paymentStatus: 'PAID',
        transactionId: 'eey3kpmh98snn8', // Token Paytech
        confirmedAt: new Date(),
        notes: 'Commande de test Paytech - Payée',
        shippingName: `${testUser2.firstName} ${testUser2.lastName}`,
        shippingStreet: 'Avenue du Succès Paytech',
        shippingCity: 'Thiès',
        shippingCountry: 'Sénégal',
        shippingAmount: 1500,
        subtotal: 7500,
        taxAmount: 750,
        orderItems: {
          create: {
            productId: product2.id,
            quantity: 1,
            unitPrice: product2.price,
            size: 'M',
            color: 'Blanc'
          }
        }
      },
      include: {
        orderItems: true,
        user: true
      }
    });

    // Commande 3 - Échec de paiement (simulé)
    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'PAYTECH-TEST-003',
        userId: testUser1.id,
        status: 'CANCELLED',
        totalAmount: 10000,
        phoneNumber: testUser1.phone,
        paymentMethod: 'PAYTECH',
        paymentStatus: 'FAILED',
        transactionId: 'fail-test-001',
        notes: 'Commande de test Paytech - Échec',
        shippingName: `${testUser1.firstName} ${testUser1.lastName}`,
        shippingStreet: 'Boulevard de l\'Échec',
        shippingCity: 'Saint-Louis',
        shippingCountry: 'Sénégal',
        shippingAmount: 2000,
        subtotal: 10000,
        taxAmount: 1000,
        orderItems: {
          create: [
            {
              productId: product1.id,
              quantity: 2,
              unitPrice: product1.price,
              size: 'XL',
              color: 'Rouge'
            }
          ]
        }
      },
      include: {
        orderItems: true,
        user: true
      }
    });

    console.log('✅ Commandes Paytech créées avec succès !');

    // 4. Afficher le résumé
    console.log('\n📊 RÉSUMÉ DES COMMANDES PAYTECH CRÉÉES:');
    console.log('==========================================');

    const orders = [order1, order2, order3];

    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Commande: ${order.orderNumber}`);
      console.log(`   👤 Client: ${order.user.firstName} ${order.user.lastName} (${order.user.email})`);
      console.log(`   💰 Montant: ${order.totalAmount} XOF`);
      console.log(`   📞 Téléphone: ${order.phoneNumber}`);
      console.log(`   💳 Méthode: ${order.paymentMethod}`);
      console.log(`   📊 Statut paiement: ${order.paymentStatus}`);
      console.log(`   🆔 Transaction ID: ${order.transactionId}`);
      console.log(`   📦 Statut commande: ${order.status}`);
      console.log(`   📅 Créée le: ${order.createdAt}`);
      console.log(`   📋 Produits: ${order.orderItems.length} article(s)`);

      order.orderItems.forEach((item) => {
        console.log(`      • ${item.quantity}x ${item.size} ${item.color} - ${item.unitPrice} XOF`);
      });
    });

    // 5. Afficher les URLs de paiement pour les commandes en attente
    console.log('\n🔗 URLS DE PAIEMENT ACTIVES:');
    console.log('===========================');
    console.log(`💳 Commande ${order1.orderNumber} (En attente): https://paytech.sn/payment/checkout/${order1.transactionId}`);
    console.log(`💰 Montant: ${order1.totalAmount} XOF`);

    console.log('\n✅ TEST TERMINÉ - Commandes Paytech créées !');

    return { orders, users: [testUser1, testUser2], products: [product1, product2] };

  } catch (error) {
    console.error('❌ Erreur lors de la création des commandes:', error);
    throw error;
  }
}

// Exécuter la création
createPaytechOrders()
  .then((result) => {
    console.log('\n🎉 Succès total !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec:', error);
    process.exit(1);
  });