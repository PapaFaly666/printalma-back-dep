#!/bin/bash
# Script simplifié pour tester le callback Paydunya directement
BASE_URL="http://localhost:3004"

echo "🔄 Test simple du callback Paydunya - Paiement réussi"
echo ""

# Utiliser une structure plus simple correspondant exactement au DTO
callback_data='{
  "invoice_token": "test_qHboA8Xn2v",
  "status": "completed",
  "custom_data": "{\"order_number\": \"ORD-1762284004127\"}",
  "total_amount": 5000,
  "payment_method": "orange-money-senegal"
}'

echo "Données envoyées:"
echo "$callback_data" | jq '.'

echo ""
echo "Réponse du webhook:"
response=$(curl -s -X POST "${BASE_URL}/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$callback_data")

echo "$response" | jq '.'