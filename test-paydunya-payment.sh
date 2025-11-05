#!/bin/bash
# Script simplifié pour créer un paiement PayDunya de test
# Usage: bash test-paydunya-payment.sh [montant]

MONTANT="${1:-5000}"
BASE_URL="http://localhost:3004"

echo ""
echo "🔄 Création d'un paiement PayDunya de ${MONTANT} XOF..."
echo ""

response=$(curl -s -X POST "${BASE_URL}/paydunya/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoice\": {
      \"total_amount\": ${MONTANT},
      \"description\": \"Test Paiement ${MONTANT} XOF\",
      \"customer\": {
        \"name\": \"Test User PayDunya\",
        \"email\": \"test@paydunya.com\",
        \"phone\": \"+221775588834\"
      },
      \"channels\": [\"orange-money-senegal\", \"wave-senegal\"]
    },
    \"store\": {
      \"name\": \"Printalma Store\",
      \"tagline\": \"Impression de qualité\",
      \"phone\": \"+221338234567\"
    },
    \"actions\": {
      \"callback_url\": \"${BASE_URL}/paydunya/callback\",
      \"return_url\": \"http://localhost:3001/payment/success\",
      \"cancel_url\": \"http://localhost:3001/payment/cancel\"
    },
    \"custom_data\": {
      \"order_number\": \"TEST-${MONTANT}-$(date +%s)\"
    }
  }")

token=$(echo "$response" | jq -r '.data.token')
url=$(echo "$response" | jq -r '.data.payment_url')

if [ "$token" != "null" ] && [ -n "$token" ]; then
  echo "✅ Paiement créé avec succès !"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💰 Montant : ${MONTANT} XOF"
  echo "🔑 Token   : ${token}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🌐 URL de paiement :"
  echo "   ${url}"
  echo ""
  echo "📱 Numéro de test : +221 775 588 834"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
else
  echo "❌ Erreur lors de la création du paiement"
  echo ""
  echo "$response" | jq '.'
fi
