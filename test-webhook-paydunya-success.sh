#!/bin/bash
# Script pour tester le webhook Paydunya avec un paiement réussi
BASE_URL="http://localhost:3004"

echo "🔄 Test du webhook Paydunya - Paiement réussi"
echo ""

# Simuler un callback Paydunya pour paiement réussi
callback_data='{
  "invoice_token": "test_qHboA8Xn2v",
  "status": "completed",
  "total_amount": 5000,
  "payment_method": "orange-money-senegal",
  "custom_data": "{\"order_number\": \"ORD-1762284004127\"}",
  "response_code": "00",
  "response_text": "Payment completed successfully"
}'

response=$(curl -s -X POST "${BASE_URL}/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$callback_data")

echo "Réponse du webhook:"
echo "$response" | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier le statut de la commande après le callback
echo "📋 Vérification du statut de la commande après paiement réussi:"
curl -s "http://localhost:3004/orders/ORD-1762284004127/payment-attempts" | jq '.'