#!/bin/bash
# Script pour tester le webhook Paydunya avec fonds insuffisants
BASE_URL="http://localhost:3004"

echo "🔄 Test du webhook Paydunya - Fonds insuffisants"
echo ""

# Simuler un callback Paydunya pour fonds insuffisants
callback_data='{
  "invoice_token": "test_IQ7HsqylZn",
  "status": "failed",
  "total_amount": 5000,
  "payment_method": "orange-money-senegal",
  "custom_data": "{\"order_number\": \"ORD-1762284004127\"}",
  "response_code": "1002",
  "response_text": "Insufficient funds",
  "cancel_reason": "Fonds insuffisants dans le compte Orange Money",
  "error_code": "INSUFFICIENT_FUNDS"
}'

response=$(curl -s -X POST "${BASE_URL}/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$callback_data")

echo "Réponse du webhook:"
echo "$response" | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier le statut de la commande après le callback
echo "📋 Vérification du statut de la commande après fonds insuffisants:"
curl -s "http://localhost:3004/orders/ORD-1762284004127/payment-attempts" | jq '.'