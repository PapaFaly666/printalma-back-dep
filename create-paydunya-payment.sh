#!/bin/bash

# Script pour créer rapidement un paiement PayDunya de test
# Usage: ./create-paydunya-payment.sh [montant]

# Configuration
BASE_URL="http://localhost:3004"
MONTANT="${1:-5000}"  # Montant par défaut: 5000 XOF

echo "=========================================="
echo "  Création d'un paiement PayDunya"
echo "=========================================="
echo ""
echo "Montant: ${MONTANT} XOF"
echo ""

# Créer le paiement
response=$(curl -s -X POST "${BASE_URL}/paydunya/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"invoice\": {
      \"total_amount\": ${MONTANT},
      \"description\": \"Test Paiement Printalma - Wave et Orange Money\",
      \"customer\": {
        \"name\": \"Papa Fallou Diagne\",
        \"email\": \"pfdiagne35@gmail.com\",
        \"phone\": \"+221771234567\"
      },
      \"channels\": [\"orange-money-senegal\", \"wave-senegal\"]
    },
    \"store\": {
      \"name\": \"Printalma Store\",
      \"tagline\": \"Impression de qualité professionnelle\",
      \"phone\": \"+221338234567\",
      \"website_url\": \"https://printalma.com\"
    },
    \"actions\": {
      \"callback_url\": \"${BASE_URL}/paydunya/callback\",
      \"return_url\": \"http://localhost:3001/payment/success\",
      \"cancel_url\": \"http://localhost:3001/payment/cancel\"
    },
    \"custom_data\": {
      \"order_number\": \"CMD-TEST-$(date +%s)\",
      \"user_id\": \"user-test\",
      \"platform\": \"web\"
    }
  }")

# Extraire les informations
token=$(echo "$response" | jq -r '.data.token')
payment_url=$(echo "$response" | jq -r '.data.payment_url')
description=$(echo "$response" | jq -r '.data.invoice_description')

if [ "$token" != "null" ] && [ -n "$token" ]; then
  echo "✓ Paiement créé avec succès !"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  TOKEN       : $token"
  echo "  DESCRIPTION : $description"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔗 URL DE PAIEMENT :"
  echo ""
  echo "   $payment_url"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📱 Ouvrez cette URL dans votre navigateur pour"
  echo "   effectuer le paiement avec Wave ou Orange Money"
  echo ""

  # Vérifier le statut
  echo "Vérification du statut..."
  status_response=$(curl -s "${BASE_URL}/paydunya/status/${token}")
  status=$(echo "$status_response" | jq -r '.data.status')
  echo "Statut actuel: $status"
  echo ""
else
  echo "✗ Erreur lors de la création du paiement"
  echo ""
  echo "Réponse:"
  echo "$response" | jq '.'
fi
