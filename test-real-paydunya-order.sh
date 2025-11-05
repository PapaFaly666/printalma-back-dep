#!/bin/bash

# ============================================
# TEST COMPLET PAYDUNYA - CRÉATION COMMANDE RÉELLE
# ============================================
# Ce script crée une commande et initie un paiement PayDunya

BASE_URL="http://localhost:3004"
echo "=========================================="
echo "🧪 TEST COMPLET PAYDUNYA"
echo "=========================================="
echo ""

# ============================================
# ÉTAPE 1: Vérifier la configuration PayDunya
# ============================================
echo "📋 ÉTAPE 1: Vérification de la configuration PayDunya"
echo "--------------------------------------------------"
curl -s -X GET "$BASE_URL/paydunya/test-config" | jq '.'
echo ""
echo "Appuyez sur Entrée pour continuer..."
read

# ============================================
# ÉTAPE 2: Créer une commande test
# ============================================
echo ""
echo "🛒 ÉTAPE 2: Création d'une commande test"
echo "--------------------------------------------------"

# Générer un numéro de commande unique
ORDER_NUMBER="ORD-TEST-$(date +%s)"

# Créer la commande avec paiement PayDunya
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/order/guest" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"phoneNumber\": \"+221776543210\",
    \"shippingDetails\": {
      \"firstName\": \"Pape\",
      \"lastName\": \"Fallou\",
      \"street\": \"123 Rue Test\",
      \"city\": \"Dakar\",
      \"region\": \"Dakar\",
      \"postalCode\": \"12000\",
      \"country\": \"Sénégal\"
    },
    \"orderItems\": [
      {
        \"productId\": 1,
        \"quantity\": 2,
        \"unitPrice\": 5000,
        \"color\": \"Blanc\",
        \"size\": \"M\"
      }
    ],
    \"totalAmount\": 10000,
    \"notes\": \"Commande test PayDunya - $ORDER_NUMBER\",
    \"paymentMethod\": \"PAYDUNYA\",
    \"initiatePayment\": true
  }")

echo "✅ Réponse de création de commande:"
echo "$ORDER_RESPONSE" | jq '.'
echo ""

# Extraire les informations importantes
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.payment.token // empty')
PAYMENT_URL=$(echo "$ORDER_RESPONSE" | jq -r '.payment.payment_url // .payment.redirect_url // empty')
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id // empty')
CREATED_ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.orderNumber // empty')

if [ -z "$PAYMENT_TOKEN" ] || [ -z "$PAYMENT_URL" ]; then
  echo "❌ ERREUR: La commande a été créée mais le paiement n'a pas été initialisé!"
  echo "Détails:"
  echo "  - Token: $PAYMENT_TOKEN"
  echo "  - URL: $PAYMENT_URL"
  echo "  - Order ID: $ORDER_ID"
  echo "  - Order Number: $CREATED_ORDER_NUMBER"
  exit 1
fi

echo "📦 Commande créée avec succès:"
echo "  - ID: $ORDER_ID"
echo "  - Numéro: $CREATED_ORDER_NUMBER"
echo "  - Montant: 10,000 FCFA"
echo ""
echo "💳 Informations de paiement PayDunya:"
echo "  - Token: $PAYMENT_TOKEN"
echo "  - URL de paiement: $PAYMENT_URL"
echo ""

# ============================================
# ÉTAPE 3: Afficher l'URL de paiement
# ============================================
echo ""
echo "🌐 ÉTAPE 3: URL de paiement générée"
echo "--------------------------------------------------"
echo ""
echo "🔗 URL COMPLÈTE DE PAIEMENT:"
echo "$PAYMENT_URL"
echo ""
echo "📋 Instructions:"
echo "1. Copiez l'URL ci-dessus dans votre navigateur"
echo "2. Vous serez redirigé vers la page de paiement PayDunya (mode TEST)"
echo "3. Utilisez les informations de test PayDunya pour effectuer le paiement:"
echo ""
echo "   🔑 CARTES DE TEST PAYDUNYA (Mode Sandbox):"
echo "   ============================================"
echo "   📱 Orange Money Test:"
echo "      - Numéro: 221777000000"
echo "      - Code: 123456"
echo ""
echo "   💳 Visa Test (succès):"
echo "      - Carte: 4000000000000002"
echo "      - Date: 12/25"
echo "      - CVV: 123"
echo ""
echo "   💳 Visa Test (échec):"
echo "      - Carte: 4000000000000010"
echo "      - Date: 12/25"
echo "      - CVV: 123"
echo ""
echo "   💰 Wave Test:"
echo "      - Numéro: 221700000000"
echo ""
echo "4. Après le paiement, vous serez redirigé vers:"
echo "   - Succès: http://localhost:3004/payment/success"
echo "   - Échec: http://localhost:3004/payment/cancel"
echo ""
echo "5. Le webhook sera envoyé à: http://localhost:3004/paydunya/webhook"
echo ""

# Sauvegarder les informations dans un fichier
echo "$PAYMENT_TOKEN" > /tmp/paydunya_test_token.txt
echo "$CREATED_ORDER_NUMBER" > /tmp/paydunya_test_order.txt
echo "$ORDER_ID" > /tmp/paydunya_test_order_id.txt

echo "💾 Informations sauvegardées dans:"
echo "  - /tmp/paydunya_test_token.txt"
echo "  - /tmp/paydunya_test_order.txt"
echo "  - /tmp/paydunya_test_order_id.txt"
echo ""

# ============================================
# ÉTAPE 4: Proposer de vérifier le statut
# ============================================
echo ""
echo "⏳ ÉTAPE 4: Vérification du statut de paiement"
echo "--------------------------------------------------"
echo "Effectuez le paiement dans votre navigateur, puis revenez ici."
echo ""
echo "Appuyez sur Entrée pour vérifier le statut de la commande..."
read

# Vérifier le statut de la commande
echo ""
echo "🔍 Vérification du statut de la commande $CREATED_ORDER_NUMBER..."
ORDER_STATUS=$(curl -s -X GET "$BASE_URL/order/$ORDER_ID")
echo ""
echo "📊 Statut de la commande:"
echo "$ORDER_STATUS" | jq '{
  id: .id,
  orderNumber: .orderNumber,
  status: .status,
  paymentStatus: .paymentStatus,
  paymentMethod: .paymentMethod,
  totalAmount: .totalAmount,
  transactionId: .transactionId
}'
echo ""

# Vérifier le statut du paiement auprès de PayDunya
echo "🔍 Vérification du statut auprès de PayDunya..."
PAYDUNYA_STATUS=$(curl -s -X GET "$BASE_URL/paydunya/status/$PAYMENT_TOKEN")
echo ""
echo "💳 Statut PayDunya:"
echo "$PAYDUNYA_STATUS" | jq '.'
echo ""

# ============================================
# ÉTAPE 5: Proposer de simuler un webhook
# ============================================
echo ""
echo "🔄 ÉTAPE 5: Simulation de webhook (optionnel)"
echo "--------------------------------------------------"
echo "Si le webhook n'a pas été reçu automatiquement, voulez-vous le simuler?"
echo "Tapez 'oui' pour simuler un webhook de succès, ou appuyez sur Entrée pour terminer:"
read SIMULATE_WEBHOOK

if [ "$SIMULATE_WEBHOOK" = "oui" ]; then
  echo ""
  echo "📡 Simulation d'un webhook de succès..."
  WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/webhook" \
    -H "Content-Type: application/json" \
    -d "{
      \"invoice_token\": \"$PAYMENT_TOKEN\",
      \"status\": \"completed\",
      \"custom_data\": {
        \"orderNumber\": \"$CREATED_ORDER_NUMBER\",
        \"orderId\": $ORDER_ID
      },
      \"total_amount\": 10000,
      \"payment_method\": \"orange_money\"
    }")

  echo "✅ Réponse du webhook:"
  echo "$WEBHOOK_RESPONSE" | jq '.'
  echo ""

  # Vérifier à nouveau le statut de la commande
  echo "🔍 Vérification finale du statut de la commande..."
  ORDER_STATUS_FINAL=$(curl -s -X GET "$BASE_URL/order/$ORDER_ID")
  echo ""
  echo "📊 Statut final de la commande:"
  echo "$ORDER_STATUS_FINAL" | jq '{
    id: .id,
    orderNumber: .orderNumber,
    status: .status,
    paymentStatus: .paymentStatus,
    paymentMethod: .paymentMethod,
    totalAmount: .totalAmount,
    transactionId: .transactionId
  }'
  echo ""
fi

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo ""
echo "=========================================="
echo "✅ TEST TERMINÉ"
echo "=========================================="
echo ""
echo "📝 Résumé du test:"
echo "  - Commande créée: $CREATED_ORDER_NUMBER (ID: $ORDER_ID)"
echo "  - Token PayDunya: $PAYMENT_TOKEN"
echo "  - Montant: 10,000 FCFA"
echo "  - URL de paiement: $PAYMENT_URL"
echo ""
echo "🔗 URLs utiles:"
echo "  - Voir la commande: $BASE_URL/order/$ORDER_ID"
echo "  - Statut PayDunya: $BASE_URL/paydunya/status/$PAYMENT_TOKEN"
echo "  - Webhook URL: $BASE_URL/paydunya/webhook"
echo ""
echo "📚 Documentation PayDunya:"
echo "  - https://developers.paydunya.com/doc/FR/introduction"
echo "  - Dashboard Test: https://app.paydunya.com/dashboard"
echo ""
