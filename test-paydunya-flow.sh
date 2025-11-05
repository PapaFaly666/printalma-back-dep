#!/bin/bash

# Script de test complet PayDunya
# Usage: ./test-paydunya-flow.sh

BASE_URL="http://localhost:3004"

echo "=========================================="
echo "🧪 TEST COMPLET PAYDUNYA"
echo "=========================================="
echo ""

# Vérifier que le serveur est accessible
echo "🔍 Vérification de la disponibilité du serveur..."
if ! curl -s "$BASE_URL/paydunya/test-config" > /dev/null; then
  echo "❌ Erreur: Le serveur n'est pas accessible à $BASE_URL"
  echo "   Assurez-vous que le serveur est démarré (npm run start:dev)"
  exit 1
fi
echo "✅ Serveur accessible"
echo ""

# Créer une commande avec paiement PayDunya
echo "🛒 Création d'une commande avec paiement PayDunya..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phoneNumber": "+221776543210",
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "PayDunya",
      "street": "123 Rue Test",
      "city": "Dakar",
      "region": "Dakar",
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
    "notes": "Test PayDunya automatique",
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }')

# Vérifier si la commande a été créée avec succès
if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Commande créée avec succès"

  # Extraire les informations
  ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | grep -o '"orderNumber":"[^"]*"' | head -1 | cut -d'"' -f4)
  PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
  PAYMENT_URL=$(echo "$ORDER_RESPONSE" | grep -o '"payment_url":"[^"]*"' | head -1 | cut -d'"' -f4)

  echo ""
  echo "📦 Détails de la commande:"
  echo "   - ID: $ORDER_ID"
  echo "   - Numéro: $ORDER_NUMBER"
  echo "   - Token PayDunya: $PAYMENT_TOKEN"
  echo "   - Montant: 10,000 FCFA"
  echo ""
  echo "🌐 URL de paiement:"
  echo "   $PAYMENT_URL"
  echo ""

  # Demander si on veut simuler le webhook
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Voulez-vous simuler un webhook de succès? (o/n)"
  read -r SIMULATE

  if [ "$SIMULATE" = "o" ] || [ "$SIMULATE" = "O" ]; then
    echo ""
    echo "🔄 Simulation du webhook de succès..."

    WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/webhook" \
      -H "Content-Type: application/json" \
      -d "{
        \"invoice_token\": \"$PAYMENT_TOKEN\",
        \"status\": \"completed\",
        \"custom_data\": \"{\\\"orderNumber\\\":\\\"$ORDER_NUMBER\\\",\\\"orderId\\\":$ORDER_ID}\",
        \"total_amount\": 10000,
        \"payment_method\": \"orange_money\",
        \"customer_name\": \"Test PayDunya\",
        \"customer_email\": \"test@example.com\"
      }")

    if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
      echo "✅ Webhook traité avec succès"
      echo ""
      echo "📊 Vérification du statut dans la base de données..."

      # Créer un script Node.js temporaire pour vérifier le statut
      cat > /tmp/check_order.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const orderId = process.argv[2];
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      transactionId: true,
      paymentAttempts: true
    }
  });
  console.log(JSON.stringify(order, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
EOF

      node /tmp/check_order.js "$ORDER_ID"
      rm /tmp/check_order.js

      echo ""
      echo "✅ Test terminé avec succès!"
    else
      echo "❌ Erreur lors du traitement du webhook"
      echo "$WEBHOOK_RESPONSE"
    fi
  else
    echo ""
    echo "ℹ️  Pour effectuer un paiement réel:"
    echo "   1. Ouvrez l'URL ci-dessus dans votre navigateur"
    echo "   2. Utilisez les informations de test PayDunya:"
    echo "      - Orange Money: 221777000000 / Code: 123456"
    echo "      - Visa: 4000000000000002 / CVV: 123"
    echo "   3. Le webhook sera automatiquement envoyé après le paiement"
  fi
else
  echo "❌ Erreur lors de la création de la commande"
  echo "$ORDER_RESPONSE"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Test terminé"
echo "=========================================="
