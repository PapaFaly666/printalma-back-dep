#!/bin/bash
# Script pour tester manuellement la mise à jour du statut de paiement
BASE_URL="http://localhost:3004"

echo "🔄 Test forcé de mise à jour du statut de paiement"
echo ""

# Créer une nouvelle commande pour le test
echo "📦 Création d'une nouvelle commande..."
order_response=$(curl -s -X POST "${BASE_URL}/orders/guest" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingDetails\": {
      \"street\": \"456 Rue Test\",
      \"city\": \"Dakar\",
      \"postalCode\": \"10000\",
      \"country\": \"Sénégal\"
    },
    \"phoneNumber\": \"+221775588834\",
    \"email\": \"test-status@paydunya.com\",
    \"notes\": \"Test mise à jour statut\",
    \"orderItems\": [
      {
        \"productId\": 1,
        \"vendorProductId\": 1,
        \"quantity\": 1,
        \"unitPrice\": 3000,
        \"size\": \"M\",
        \"color\": \"Blanc\"
      }
    ],
    \"paymentMethod\": \"PAYDUNYA\",
    \"initiatePayment\": true,
    \"totalAmount\": 3000
  }")

order_number=$(echo "$order_response" | jq -r '.data.orderNumber')
order_id=$(echo "$order_response" | jq -r '.data.id')
payment_token=$(echo "$order_response" | jq -r '.data.payment.token')

echo "✅ Commande créée:"
echo "   Numéro: $order_number"
echo "   ID: $order_id"
echo "   Token: $payment_token"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier le statut initial
echo "📋 Statut initial de la commande:"
curl -s "http://localhost:3004/orders/$order_number/payment-attempts" | jq '.data | {order_number, payment_status, total_attempts, has_insufficient_funds}'

echo ""
echo "💰 Simulation d'un paiement réussi..."

# Simuler manuellement une mise à jour réussie via le service
# On va utiliser un token différent pour éviter les conflits
success_callback='{
  "invoice_token": "'$payment_token'",
  "status": "completed",
  "custom_data": "{\"order_number\": \"'$order_number'\"}",
  "total_amount": 3000,
  "payment_method": "wave-senegal"
}'

echo "Tentative de callback réussi..."
success_response=$(curl -s -X POST "${BASE_URL}/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$success_callback")

echo "Réponse: $success_response"

echo ""
echo "💰 Simulation d'un paiement avec fonds insuffisants..."

# Utiliser un autre token
insufficient_token="test_insufficient_$(date +%s)"

insufficient_callback='{
  "invoice_token": "'$insufficient_token'",
  "status": "failed",
  "custom_data": "{\"order_number\": \"'$order_number'\"}",
  "total_amount": 3000,
  "payment_method": "orange-money-senegal",
  "cancel_reason": "Fonds insuffisants dans le compte",
  "error_code": "INSUFFICIENT_FUNDS"
}'

echo "Tentative de callback fonds insuffisants..."
insufficient_response=$(curl -s -X POST "${BASE_URL}/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$insufficient_callback")

echo "Réponse: $insufficient_response"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Statut final de la commande:"
curl -s "http://localhost:3004/orders/$order_number/payment-attempts" | jq '.data | {order_number, payment_status, total_attempts, has_insufficient_funds, last_payment_attempt, last_failure_reason, attempts: (.attempts | length)}'