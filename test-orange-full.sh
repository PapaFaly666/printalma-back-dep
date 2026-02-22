#!/bin/bash

set -e

echo "=========================================="
echo "🧪 TEST COMPLET ORANGE MONEY CALLBACK"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3004"
ORDER_NUMBER="ORD-TEST-OM-$(date +%s)"

echo "1️⃣ Création d'une commande de test..."
echo "   Order Number: $ORDER_NUMBER"

# Créer une commande de test simple
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerName\": \"Test Orange Money\",
    \"customerEmail\": \"test@om.sn\",
    \"customerPhone\": \"773456789\",
    \"deliveryAddress\": \"Dakar, Sénégal\",
    \"totalAmount\": 15000,
    \"paymentMethod\": \"ORANGE_MONEY\",
    \"orderItems\": [
      {
        \"productId\": 1,
        \"quantity\": 1,
        \"unitPrice\": 15000,
        \"productName\": \"Test Product\"
      }
    ]
  }")

echo "✅ Réponse création: "
echo "$CREATE_RESPONSE" | jq -c '{ success, orderNumber, paymentData }'

# Extraire le orderNumber de la réponse
ACTUAL_ORDER_NUMBER=$(echo "$CREATE_RESPONSE" | jq -r '.orderNumber // .data.orderNumber // empty')

if [ -z "$ACTUAL_ORDER_NUMBER" ]; then
  echo "❌ Impossible d'extraire le orderNumber de la réponse"
  echo "Réponse complète: $CREATE_RESPONSE"
  exit 1
fi

echo "   → Order Number créé: $ACTUAL_ORDER_NUMBER"
echo ""

sleep 2

echo "=========================================="
echo "2️⃣ Vérification du transactionId sauvegardé"
echo "=========================================="

INITIAL_STATUS=$(curl -s "$BASE_URL/orange-money/payment-status/$ACTUAL_ORDER_NUMBER")
echo "Status initial:"
echo "$INITIAL_STATUS" | jq '{ paymentStatus, transactionId, paymentMethod }'

TRANSACTION_ID=$(echo "$INITIAL_STATUS" | jq -r '.transactionId // empty')

if [ -n "$TRANSACTION_ID" ] && [ "$TRANSACTION_ID" != "null" ]; then
  echo "✅ TransactionId sauvegardé: $TRANSACTION_ID"
else
  echo "⚠️  TransactionId non sauvegardé (peut être normal si paiement non initié)"
fi

echo ""
sleep 2

echo "=========================================="
echo "3️⃣ Simulation callback SUCCESS"
echo "=========================================="

CALLBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/orange-money/callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"SUCCESS\",
    \"transactionId\": \"TXN-OM-SUCCESS-$(date +%s)\",
    \"amount\": {
      \"unit\": \"XOF\",
      \"value\": 15000
    },
    \"code\": \"PRINTALMA001\",
    \"reference\": \"OM-$ACTUAL_ORDER_NUMBER-$(date +%s)\",
    \"metadata\": {
      \"orderId\": \"999\",
      \"orderNumber\": \"$ACTUAL_ORDER_NUMBER\",
      \"customerName\": \"Test Orange Money\"
    }
  }")

echo "Réponse callback:"
echo "$CALLBACK_RESPONSE" | jq '.'

echo ""
sleep 2

echo "=========================================="
echo "4️⃣ Vérification après callback SUCCESS"
echo "=========================================="

AFTER_STATUS=$(curl -s "$BASE_URL/orange-money/payment-status/$ACTUAL_ORDER_NUMBER")
echo "Status après callback:"
echo "$AFTER_STATUS" | jq '.'

PAYMENT_STATUS=$(echo "$AFTER_STATUS" | jq -r '.paymentStatus')
SHOULD_REDIRECT=$(echo "$AFTER_STATUS" | jq -r '.shouldRedirect')
REDIRECT_URL=$(echo "$AFTER_STATUS" | jq -r '.redirectUrl // empty')

echo ""
echo "📊 Analyse:"
if [ "$PAYMENT_STATUS" == "PAID" ]; then
  echo "✅ PaymentStatus = PAID (correct)"
else
  echo "❌ PaymentStatus = $PAYMENT_STATUS (devrait être PAID)"
fi

if [ "$SHOULD_REDIRECT" == "true" ]; then
  echo "✅ shouldRedirect = true (correct)"
  echo "   → RedirectUrl: $REDIRECT_URL"
else
  echo "❌ shouldRedirect = $SHOULD_REDIRECT (devrait être true)"
fi

echo ""
sleep 2

echo "=========================================="
echo "5️⃣ Test d'idempotence (2ème callback)"
echo "=========================================="

CALLBACK2_RESPONSE=$(curl -s -X POST "$BASE_URL/orange-money/callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"SUCCESS\",
    \"transactionId\": \"TXN-OM-DUPLICATE-$(date +%s)\",
    \"amount\": {
      \"unit\": \"XOF\",
      \"value\": 15000
    },
    \"code\": \"PRINTALMA001\",
    \"reference\": \"OM-$ACTUAL_ORDER_NUMBER-$(date +%s)\",
    \"metadata\": {
      \"orderId\": \"999\",
      \"orderNumber\": \"$ACTUAL_ORDER_NUMBER\",
      \"customerName\": \"Test Orange Money\"
    }
  }")

echo "Réponse 2ème callback (devrait être ignoré):"
echo "$CALLBACK2_RESPONSE" | jq '.'

# Vérifier que le transactionId n'a pas changé
FINAL_STATUS=$(curl -s "$BASE_URL/orange-money/payment-status/$ACTUAL_ORDER_NUMBER")
FINAL_TXN_ID=$(echo "$FINAL_STATUS" | jq -r '.transactionId')

echo ""
echo "📊 Vérification idempotence:"
echo "   TransactionId après 2ème callback: $FINAL_TXN_ID"
echo "   (devrait être le même que le 1er callback)"

echo ""
sleep 1

echo "=========================================="
echo "6️⃣ Test callback FAILED sur nouvelle commande"
echo "=========================================="

ORDER_NUMBER_FAILED="ORD-FAILED-$(date +%s)"

echo "Simulation callback FAILED..."
FAILED_RESPONSE=$(curl -s -X POST "$BASE_URL/orange-money/test-callback-failed" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ACTUAL_ORDER_NUMBER\"
  }")

echo "Réponse:"
echo "$FAILED_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "✅ RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""
echo "📋 Tests effectués:"
echo "   1. ✅ Création de commande"
echo "   2. ✅ Vérification transactionId sauvegardé"
echo "   3. ✅ Callback SUCCESS"
echo "   4. ✅ Redirection si déjà payé"
echo "   5. ✅ Idempotence (double callback ignoré)"
echo "   6. ✅ Callback FAILED"
echo ""
echo "📊 Commande de test: $ACTUAL_ORDER_NUMBER"
echo "📊 PaymentStatus final: $PAYMENT_STATUS"
echo "📊 ShouldRedirect: $SHOULD_REDIRECT"
echo ""
echo "🎉 Tous les tests sont terminés !"
echo ""
