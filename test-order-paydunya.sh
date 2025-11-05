#!/bin/bash
# Script de test pour créer une commande avec paiement Paydunya
# Usage: bash test-order-paydunya.sh

BASE_URL="http://localhost:3004"

echo ""
echo "🔄 Création d'une commande avec paiement Paydunya..."
echo ""

# Créer une commande avec Paydunya
response=$(curl -s -X POST "${BASE_URL}/orders/guest" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingDetails\": {
      \"street\": \"123 Rue du Commerce\",
      \"city\": \"Dakar\",
      \"postalCode\": \"10000\",
      \"country\": \"Sénégal\"
    },
    \"phoneNumber\": \"+221775588834\",
    \"email\": \"test@paydunya.com\",
    \"notes\": \"Test commande avec Paydunya\",
    \"orderItems\": [
      {
        \"productId\": 1,
        \"vendorProductId\": 1,
        \"quantity\": 2,
        \"unitPrice\": 2500,
        \"size\": \"L\",
        \"color\": \"Noir\"
      }
    ],
    \"paymentMethod\": \"PAYDUNYA\",
    \"initiatePayment\": true,
    \"totalAmount\": 5000
  }")

echo "Réponse de l'API:"
echo "$response" | jq '.'

# Extraire le token de paiement si présent
payment_token=$(echo "$response" | jq -r '.data.paymentToken // .data.token // .data?.payment?.token // "null"')
payment_url=$(echo "$response" | jq -r '.data.paymentUrl // .data.payment_url // .data?.payment?.url // "null"')
order_id=$(echo "$response" | jq -r '.data.id // .data.orderId // "null"')
order_number=$(echo "$response" | jq -r '.data.orderNumber // .data.number // "null"')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$payment_token" != "null" ] && [ -n "$payment_token" ]; then
  echo "✅ Commande créée avec succès !"
  echo "💰 Montant : 5000 XOF"
  echo "🔑 Token   : ${payment_token}"
  echo "📦 Commande ID : ${order_id}"
  echo "📋 Commande N° : ${order_number}"

  if [ "$payment_url" != "null" ] && [ -n "$payment_url" ]; then
    echo ""
    echo "🌐 URL de paiement :"
    echo "   ${payment_url}"
  fi

  echo ""
  echo "📱 Numéro de test : +221 775 588 834"
  echo "🧪 Mode : TEST (sandbox)"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📋 Étapes suivantes :"
  echo "   1. Visitez l'URL de paiement ci-dessus"
  echo "   2. Utilisez le numéro de test pour simuler le paiement"
  echo "   3. Vérifiez le statut du paiement avec :"
  echo "      curl -s \"${BASE_URL}/paydunya/status/${payment_token}\" | jq '.'"
  echo ""
  echo "   4. Vérifiez le statut de la commande avec :"
  echo "      curl -s \"${BASE_URL}/orders/${order_number}/payment-attempts\" | jq '.'"
  echo ""
else
  echo "❌ Erreur lors de la création de la commande"
  echo ""
  echo "Réponse complète :"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
fi