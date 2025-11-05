#!/bin/bash

# Script de test PayDunya simplifié
BASE_URL="http://localhost:3004"

echo "=========================================="
echo "🧪 TEST PAYDUNYA - CRÉATION COMMANDE"
echo "=========================================="
echo ""

# Créer la commande avec paiement PayDunya
echo "🛒 Création de la commande avec PayDunya..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/order/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+221776543210",
    "shippingDetails": {
      "firstName": "Pape",
      "lastName": "Fallou",
      "street": "123 Rue Test",
      "city": "Dakar",
      "region": "Dakar",
      "postalCode": "12000",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "unitPrice": 5000,
        "color": "Blanc",
        "size": "M"
      }
    ],
    "totalAmount": 10000,
    "notes": "Commande test PayDunya réelle",
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }')

echo "$ORDER_RESPONSE" | jq '.'
echo ""

# Extraire l'URL de paiement
PAYMENT_URL=$(echo "$ORDER_RESPONSE" | jq -r '.payment.payment_url // .payment.redirect_url // empty')
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.payment.token // empty')
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.orderNumber // empty')
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id // empty')

if [ -z "$PAYMENT_URL" ]; then
  echo "❌ ERREUR: Impossible d'obtenir l'URL de paiement!"
  exit 1
fi

echo "✅ Commande créée avec succès!"
echo ""
echo "📦 Détails de la commande:"
echo "  - Numéro: $ORDER_NUMBER"
echo "  - ID: $ORDER_ID"
echo "  - Montant: 10,000 FCFA"
echo ""
echo "💳 Informations de paiement PayDunya:"
echo "  - Token: $PAYMENT_TOKEN"
echo ""
echo "🌐 URL DE PAIEMENT COMPLÈTE:"
echo "=========================================="
echo "$PAYMENT_URL"
echo "=========================================="
echo ""
echo "📋 INSTRUCTIONS POUR TESTER:"
echo "1. Copiez l'URL ci-dessus dans votre navigateur"
echo "2. Vous serez redirigé vers PayDunya (mode TEST/Sandbox)"
echo ""
echo "🔑 INFORMATIONS DE TEST PAYDUNYA:"
echo "   📱 Orange Money Test:"
echo "      Numéro: 221777000000"
echo "      Code: 123456"
echo ""
echo "   💳 Visa Test (succès):"
echo "      Carte: 4000000000000002"
echo "      CVV: 123, Date: 12/25"
echo ""
echo "3. Après paiement, vous serez redirigé et le webhook sera envoyé"
echo ""

# Sauvegarder pour référence
echo "$PAYMENT_TOKEN" > /tmp/paydunya_token.txt
echo "$ORDER_NUMBER" > /tmp/paydunya_order.txt
echo "$ORDER_ID" > /tmp/paydunya_order_id.txt

echo "💾 Données sauvegardées dans /tmp/paydunya_*.txt"
echo ""
echo "=========================================="
