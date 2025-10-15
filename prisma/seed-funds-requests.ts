import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFundsRequests(users: any, orders: any[]) {
  console.log('💰 Seeding funds requests...');

  const { vendors, admins } = users;
  const fundsRequests = [];

  // Créer des demandes d'appel de fonds pour chaque vendeur
  for (const vendor of vendors) {
    // Récupérer les earnings du vendeur
    const earnings = await prisma.vendorEarnings.findUnique({
      where: { vendorId: vendor.id },
    });

    if (!earnings || earnings.availableAmount === 0) {
      continue; // Pas de fonds disponibles, on passe au suivant
    }

    // Nombre de demandes par vendeur (0 à 3)
    const requestCount = Math.floor(Math.random() * 4);

    for (let i = 0; i < requestCount; i++) {
      const availableBalance = earnings.availableAmount;

      // Montant demandé (entre 50% et 100% du montant disponible)
      const requestedPercentage = 0.5 + Math.random() * 0.5;
      const requestedAmount = availableBalance * requestedPercentage;

      // Commission (10%)
      const commissionRate = 0.10;
      const amount = requestedAmount * (1 - commissionRate);

      // Statut de la demande
      let status;
      const rand = Math.random();
      if (rand < 0.3) status = 'PAID';        // 30% payées
      else if (rand < 0.5) status = 'APPROVED';  // 20% approuvées
      else if (rand < 0.7) status = 'PENDING';   // 20% en attente
      else status = 'REJECTED';                  // 30% rejetées

      // Date de création aléatoire (2 derniers mois)
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));

      // Méthode de paiement
      const paymentMethods = ['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      // Admin qui a traité la demande (si traitée)
      const processedBy = (status !== 'PENDING') ? admins[Math.floor(Math.random() * admins.length)].id : null;
      const processedAt = (status !== 'PENDING') ? new Date(createdDate.getTime() + 86400000) : null; // +1 jour

      const fundsRequest = await prisma.vendorFundsRequest.create({
        data: {
          vendorId: vendor.id,
          amount,
          requestedAmount,
          description: [
            'Demande de retrait mensuel',
            'Retrait pour réinvestissement',
            'Paiement des frais de conception',
            'Retrait de gains accumulés',
            'Demande urgente de fonds',
          ][Math.floor(Math.random() * 5)],
          paymentMethod: paymentMethod as any,
          phoneNumber: paymentMethod !== 'BANK_TRANSFER' ? vendor.phone : null,
          bankIban: paymentMethod === 'BANK_TRANSFER' ? `SN${Math.floor(10000000000000000000 + Math.random() * 90000000000000000000)}` : null,
          status: status as any,
          availableBalance,
          commissionRate,
          rejectReason: status === 'REJECTED' ? [
            'Montant insuffisant pour un retrait',
            'Documents manquants',
            'Vérification en cours',
          ][Math.floor(Math.random() * 3)] : null,
          adminNote: (status === 'APPROVED' || status === 'PAID') ? 'Demande validée et traitée' : null,
          processedBy,
          processedAt,
          requestedAt: createdDate,
          validatedAt: status === 'APPROVED' || status === 'PAID' ? processedAt : null,
          createdAt: createdDate,
          updatedAt: processedAt || createdDate,
        },
      });

      // Lier des commandes à cette demande de fonds (1 à 5 commandes)
      const orderCount = Math.floor(Math.random() * 5) + 1;
      const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');

      for (let j = 0; j < Math.min(orderCount, deliveredOrders.length); j++) {
        const order = deliveredOrders[Math.floor(Math.random() * deliveredOrders.length)];

        try {
          await prisma.vendorFundsRequestOrder.create({
            data: {
              fundsRequestId: fundsRequest.id,
              orderId: order.id,
            },
          });
        } catch (error) {
          // Ignorer les erreurs de duplicata (constraint unique)
          continue;
        }
      }

      // Mettre à jour les earnings si la demande est payée
      if (status === 'PAID') {
        await prisma.vendorEarnings.update({
          where: { vendorId: vendor.id },
          data: {
            availableAmount: { decrement: requestedAmount },
          },
        });
      }

      fundsRequests.push(fundsRequest);
    }
  }

  console.log(`✅ ${fundsRequests.length} funds requests created`);

  // Afficher un résumé par statut
  const summary = {
    PENDING: fundsRequests.filter(fr => fr.status === 'PENDING').length,
    APPROVED: fundsRequests.filter(fr => fr.status === 'APPROVED').length,
    PAID: fundsRequests.filter(fr => fr.status === 'PAID').length,
    REJECTED: fundsRequests.filter(fr => fr.status === 'REJECTED').length,
  };

  console.log('📊 Summary:', summary);

  return fundsRequests;
}
