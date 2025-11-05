#!/bin/bash

# Script pour tester le webhook PayDunya
# Usage: ./test-paydunya-webhook.sh [ORDER_ID]

BASE_URL="http://localhost:3004"
ORDER_ID=${1:-87}  # Par défaut, commande 87

echo "════════════════════════════════════════════════════════════"
echo "🧪 TEST DU WEBHOOK PAYDUNYA"
echo "════════════════════════════════════════════════════════════"
echo ""

# Récupérer les informations de la commande depuis la DB
echo "📦 Récupération des informations de la commande..."

ORDER_INFO=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getOrder() {
  const order = await prisma.order.findUnique({
    where: { id: $ORDER_ID },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      transactionId: true,
      email: true,
      phoneNumber: true,
      shippingName: true
    }
  });

  if (!order) {
    console.log('ERROR:NOT_FOUND');
    process.exit(1);
  }

  console.log(JSON.stringify(order));
  await prisma.\$disconnect();
}

getOrder();
" 2>/dev/null)

if [ "$ORDER_INFO" = "ERROR:NOT_FOUND" ]; then
  echo "❌ Commande $ORDER_ID non trouvée"
  exit 1
fi

# Extraire les informations
ORDER_NUMBER=$(echo "$ORDER_INFO" | grep -o '"orderNumber":"[^"]*"' | cut -d'"' -f4)
TOTAL_AMOUNT=$(echo "$ORDER_INFO" | grep -o '"totalAmount":[0-9]*' | cut -d':' -f2)
CURRENT_STATUS=$(echo "$ORDER_INFO" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
CURRENT_PAYMENT_STATUS=$(echo "$ORDER_INFO" | grep -o '"paymentStatus":"[^"]*"' | cut -d'"' -f4)
CUSTOMER_EMAIL=$(echo "$ORDER_INFO" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
CUSTOMER_PHONE=$(echo "$ORDER_INFO" | grep -o '"phoneNumber":"[^"]*"' | cut -d'"' -f4)
CUSTOMER_NAME=$(echo "$ORDER_INFO" | grep -o '"shippingName":"[^"]*"' | cut -d'"' -f4)

echo "✅ Commande trouvée"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 INFORMATIONS ACTUELLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ID:                  $ORDER_ID"
echo "  Numéro:              $ORDER_NUMBER"
echo "  Montant:             $TOTAL_AMOUNT FCFA"
echo "  Statut commande:     $CURRENT_STATUS"
echo "  Statut paiement:     $CURRENT_PAYMENT_STATUS"
echo "  Client:              $CUSTOMER_NAME"
echo "  Email:               $CUSTOMER_EMAIL"
echo "  Téléphone:           $CUSTOMER_PHONE"
echo ""

# Demander quel type de webhook simuler
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 CHOISIR LE TYPE DE WEBHOOK À SIMULER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. ✅ Paiement réussi (completed)"
echo "  2. ❌ Paiement échoué (failed)"
echo "  3. 🚫 Paiement annulé (cancelled)"
echo "  4. 💰 Fonds insuffisants (failed + insufficient funds)"
echo ""
echo -n "Votre choix (1-4): "
read CHOICE

# Générer un token unique
TOKEN="test_$(date +%s)_$RANDOM"

case $CHOICE in
  1)
    # Paiement réussi
    STATUS="completed"
    PAYMENT_METHOD="orange_money"
    CANCEL_REASON=""
    ERROR_CODE=""
    echo ""
    echo "✅ Simulation d'un paiement réussi..."
    ;;
  2)
    # Paiement échoué
    STATUS="failed"
    PAYMENT_METHOD="visa"
    CANCEL_REASON="Technical error during payment"
    ERROR_CODE="TECH_ERR_001"
    echo ""
    echo "❌ Simulation d'un paiement échoué..."
    ;;
  3)
    # Paiement annulé
    STATUS="cancelled"
    PAYMENT_METHOD="wave"
    CANCEL_REASON="User cancelled the payment"
    ERROR_CODE="USER_CANCEL"
    echo ""
    echo "🚫 Simulation d'un paiement annulé..."
    ;;
  4)
    # Fonds insuffisants
    STATUS="failed"
    PAYMENT_METHOD="orange_money"
    CANCEL_REASON="INSUFFICIENT_FUNDS"
    ERROR_CODE="INSUFF_FUNDS"
    echo ""
    echo "💰 Simulation de fonds insuffisants..."
    ;;
  *)
    echo "❌ Choix invalide"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 ENVOI DU WEBHOOK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Construire le payload du webhook
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "invoice_token": "$TOKEN",
  "status": "$STATUS",
  "custom_data": "{\"orderNumber\":\"$ORDER_NUMBER\",\"orderId\":$ORDER_ID}",
  "total_amount": $TOTAL_AMOUNT,
  "payment_method": "$PAYMENT_METHOD",
  "customer_name": "$CUSTOMER_NAME",
  "customer_email": "$CUSTOMER_EMAIL",
  "customer_phone": "$CUSTOMER_PHONE"
  $([ -n "$CANCEL_REASON" ] && echo ",\"cancel_reason\": \"$CANCEL_REASON\"")
  $([ -n "$ERROR_CODE" ] && echo ",\"error_code\": \"$ERROR_CODE\"")
}
EOF
)

echo "📤 Payload du webhook:"
echo "$WEBHOOK_PAYLOAD" | python3 -m json.tool
echo ""

# Envoyer le webhook
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

echo "📥 Réponse du webhook:"
echo "$WEBHOOK_RESPONSE" | python3 -m json.tool
echo ""

# Vérifier le résultat
if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Webhook traité avec succès"
else
  echo "❌ Erreur lors du traitement du webhook"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VÉRIFICATION DU STATUT APRÈS WEBHOOK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 2

# Vérifier le nouveau statut
NEW_ORDER_INFO=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const order = await prisma.order.findUnique({
    where: { id: $ORDER_ID },
    select: {
      status: true,
      paymentStatus: true,
      transactionId: true,
      paymentAttempts: true,
      lastPaymentAttemptAt: true,
      hasInsufficientFunds: true,
      lastPaymentFailureReason: true
    }
  });
  console.log(JSON.stringify(order, null, 2));
  await prisma.\$disconnect();
}

checkOrder();
" 2>/dev/null)

echo "📊 Statut mis à jour:"
echo "$NEW_ORDER_INFO"
echo ""

# Afficher le changement
NEW_STATUS=$(echo "$NEW_ORDER_INFO" | grep '"status"' | cut -d'"' -f4)
NEW_PAYMENT_STATUS=$(echo "$NEW_ORDER_INFO" | grep '"paymentStatus"' | cut -d'"' -f4)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 COMPARAISON AVANT/APRÈS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Statut commande:     $CURRENT_STATUS → $NEW_STATUS"
echo "  Statut paiement:     $CURRENT_PAYMENT_STATUS → $NEW_PAYMENT_STATUS"
echo ""

if [ "$CURRENT_STATUS" != "$NEW_STATUS" ] || [ "$CURRENT_PAYMENT_STATUS" != "$NEW_PAYMENT_STATUS" ]; then
  echo "✅ Le statut a été mis à jour avec succès !"
else
  echo "⚠️  Le statut n'a pas changé"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ TEST TERMINÉ"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "💡 Pour voir l'historique complet:"
echo "   node check-order-status.js $ORDER_ID"
echo ""
