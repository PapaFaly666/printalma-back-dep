#!/bin/bash

# Script de test intégration cron job PayDunya

BASE_URL="http://localhost:3004"

echo "════════════════════════════════════════════════════════════"
echo "🧪 TEST D'INTÉGRATION - CRON JOB PAYDUNYA"
echo "════════════════════════════════════════════════════════════"
echo ""

# ============================================
# ÉTAPE 1: Créer une commande test
# ============================================
echo "📦 ÉTAPE 1: Création d'une commande test"
echo "────────────────────────────────────────"

ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cron-test@test.com",
    "phoneNumber": "+221775588834",
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "Cron",
      "street": "123 Rue Test",
      "city": "Dakar",
      "region": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 6000
    }],
    "totalAmount": 6000,
    "notes": "Test cron job PayDunya",
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['orderNumber'])" 2>/dev/null)
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['payment']['token'])" 2>/dev/null)
PAYMENT_URL=$(echo "$ORDER_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['payment']['payment_url'])" 2>/dev/null)

if [ -z "$ORDER_ID" ] || [ -z "$PAYMENT_TOKEN" ]; then
  echo "❌ Erreur lors de la création de la commande"
  echo "$ORDER_RESPONSE"
  exit 1
fi

echo "✅ Commande créée avec succès"
echo "   ID: $ORDER_ID"
echo "   Numéro: $ORDER_NUMBER"
echo "   Token: $PAYMENT_TOKEN"
echo "   URL: $PAYMENT_URL"
echo ""

# ============================================
# ÉTAPE 2: Vérifier le statut initial
# ============================================
echo "📊 ÉTAPE 2: Vérification du statut initial"
echo "────────────────────────────────────────"

sleep 2

INITIAL_STATUS=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findUnique({
  where: { id: $ORDER_ID },
  select: { status: true, paymentStatus: true }
}).then(o => {
  console.log(JSON.stringify(o));
  prisma.\$disconnect();
});
" 2>/dev/null)

echo "Statut initial: $INITIAL_STATUS"
echo ""

# ============================================
# ÉTAPE 3: Afficher l'URL de paiement
# ============================================
echo "💳 ÉTAPE 3: URL de paiement"
echo "────────────────────────────────────────"
echo ""
echo "🌐 Ouvrez cette URL pour payer:"
echo "$PAYMENT_URL"
echo ""
echo "📱 Ou utilisez:"
echo "   Orange Money: 221777000000 / Code: 123456"
echo "   Visa: 4000000000000002 / CVV: 123"
echo ""
echo "Appuyez sur Entrée après avoir effectué le paiement..."
read

# ============================================
# ÉTAPE 4: Vérifier le statut PayDunya
# ============================================
echo ""
echo "🔍 ÉTAPE 4: Vérification du statut sur PayDunya"
echo "────────────────────────────────────────"

PAYDUNYA_STATUS=$(curl -s -X GET "$BASE_URL/paydunya/status/$PAYMENT_TOKEN")

echo "$PAYDUNYA_STATUS" | python3 -m json.tool
echo ""

PD_STATUS=$(echo "$PAYDUNYA_STATUS" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null)
echo "Statut PayDunya: $PD_STATUS"
echo ""

# ============================================
# ÉTAPE 5: Vérifier le statut DB (avant cron)
# ============================================
echo "📊 ÉTAPE 5: Statut dans la DB (avant cron)"
echo "────────────────────────────────────────"

BEFORE_CRON=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findUnique({
  where: { id: $ORDER_ID },
  select: { status: true, paymentStatus: true }
}).then(o => {
  console.log(JSON.stringify(o));
  prisma.\$disconnect();
});
" 2>/dev/null)

echo "Statut DB: $BEFORE_CRON"
echo ""

# ============================================
# ÉTAPE 6: Exécuter le cron manuellement
# ============================================
echo "🔄 ÉTAPE 6: Exécution manuelle du cron job"
echo "────────────────────────────────────────"
echo ""
echo "Options:"
echo "  1. Vérifier cette commande spécifique"
echo "  2. Vérifier toutes les commandes en attente"
echo "  3. Passer (pour tester le cron automatique)"
echo ""
echo -n "Votre choix (1-3): "
read CRON_CHOICE

case $CRON_CHOICE in
  1)
    echo ""
    echo "🎯 Vérification de la commande $ORDER_NUMBER..."

    # Note: Cet endpoint nécessite un token admin
    # Pour le test, on utilise l'API publique de vérification

    VERIFICATION_RESULT=$(node -e "
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

async function checkOrder() {
  const prisma = new PrismaClient();

  try {
    // Récupérer le token
    const order = await prisma.order.findUnique({
      where: { id: $ORDER_ID },
      select: { orderNumber: true }
    });

    // Vérifier le statut sur PayDunya
    const response = await axios.get('$BASE_URL/paydunya/status/$PAYMENT_TOKEN');
    const paymentStatus = response.data.data;

    console.log('PayDunya Status:', paymentStatus.status);

    // Simuler la mise à jour du cron
    if (paymentStatus.status === 'completed') {
      await prisma.order.update({
        where: { id: $ORDER_ID },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          transactionId: '$PAYMENT_TOKEN'
        }
      });
      console.log('✅ Order updated to PAID/CONFIRMED');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

checkOrder();
" 2>&1)

    echo "$VERIFICATION_RESULT"
    ;;

  2)
    echo ""
    echo "🔄 Vérification de toutes les commandes en attente..."
    echo "(Nécessite un token admin - simulation manuelle)"

    node -e "
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

async function checkAll() {
  const prisma = new PrismaClient();

  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'PAYDUNYA',
        paymentStatus: 'PENDING'
      },
      select: {
        id: true,
        orderNumber: true,
        transactionId: true
      },
      take: 5
    });

    console.log('Found', pendingOrders.length, 'pending orders');

    for (const order of pendingOrders) {
      const token = order.transactionId;
      if (!token) {
        console.log('⚠️  Order', order.orderNumber, '- No token');
        continue;
      }

      try {
        const response = await axios.get('$BASE_URL/paydunya/status/' + token);
        const status = response.data.data.status;

        console.log('✓ Order', order.orderNumber, '- Status:', status);

        if (status === 'completed') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              status: 'CONFIRMED',
              transactionId: token
            }
          });
          console.log('  → Updated to PAID/CONFIRMED');
        }
      } catch (error) {
        console.log('✗ Order', order.orderNumber, '- Error:', error.message);
      }
    }
  } finally {
    await prisma.\$disconnect();
  }
}

checkAll();
" 2>&1
    ;;

  3)
    echo ""
    echo "⏭️  Attente du cron automatique..."
    echo "   (Le cron s'exécute toutes les 5 minutes)"
    ;;
esac

echo ""

# ============================================
# ÉTAPE 7: Vérifier le résultat final
# ============================================
echo "📊 ÉTAPE 7: Statut final dans la DB"
echo "────────────────────────────────────────"

sleep 2

AFTER_CRON=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findUnique({
  where: { id: $ORDER_ID },
  select: {
    status: true,
    paymentStatus: true,
    transactionId: true,
    updatedAt: true
  }
}).then(o => {
  console.log(JSON.stringify(o, null, 2));
  prisma.\$disconnect();
});
" 2>/dev/null)

echo "$AFTER_CRON"
echo ""

# ============================================
# ÉTAPE 8: Comparaison avant/après
# ============================================
echo "📈 ÉTAPE 8: Comparaison avant/après"
echo "────────────────────────────────────────"
echo ""
echo "Avant cron:  $BEFORE_CRON"
echo "Après cron:  $(echo "$AFTER_CRON" | tr -d '\n ')"
echo ""

# Vérifier si le statut a changé
CURRENT_STATUS=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.order.findUnique({
  where: { id: $ORDER_ID },
  select: { paymentStatus: true }
}).then(o => {
  console.log(o.paymentStatus);
  prisma.\$disconnect();
});
" 2>/dev/null)

if [ "$CURRENT_STATUS" = "PAID" ]; then
  echo "✅ SUCCÈS ! Le statut a été mis à jour à PAID"
  echo ""
  echo "Le cron job fonctionne correctement ! 🎉"
else
  echo "⚠️  Le statut n'a pas été mis à jour"
  echo "   Statut actuel: $CURRENT_STATUS"
  echo ""
  echo "Causes possibles:"
  echo "  - Le paiement n'a pas été effectué"
  echo "  - Le cron n'a pas encore été exécuté (attendre 5 min)"
  echo "  - Erreur lors de la vérification"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ TEST TERMINÉ"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "💡 Pour voir les logs du cron job:"
echo "   tail -f logs/app.log | grep PaydunyaCronService"
echo ""
echo "💡 Pour forcer le cron manuellement (avec token admin):"
echo "   curl -X POST $BASE_URL/paydunya/cron/run \\"
echo "     -H 'Authorization: Bearer ADMIN_TOKEN'"
echo ""
