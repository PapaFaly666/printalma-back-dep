#!/bin/bash

echo "🚀 TEST COMPLET DE PAIEMENT COMMANDE PAYDUNYA"
echo "=========================================="

# URL de base de l'API
BASE_URL="http://localhost:3004"

echo ""
echo "📋 1. Vérification de la disponibilité du serveur..."

# Vérifier si le serveur est disponible
for i in {1..30}; do
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        echo "✅ Serveur disponible sur $BASE_URL"
        break
    else
        echo "⏳ Attente du serveur... ($i/30)"
        sleep 2
    fi

    if [ $i -eq 30 ]; then
        echo "❌ Le serveur n'est pas disponible après 30 secondes"
        exit 1
    fi
done

echo ""
echo "📦 2. Création d'une commande test..."

# Créer une commande avec des données complètes
ORDER_DATA='{
  "customerInfo": {
    "name": "Client Test",
    "email": "client.test@example.com"
  },
  "phoneNumber": "775588834",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 5000
    }
  ],
  "shippingDetails": {
    "street": "Rue Test 123",
    "city": "Dakar",
    "postalCode": "10000",
    "country": "Sénégal"
  },
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}'

echo "Données de commande :"
echo "$ORDER_DATA" | jq '.'
echo ""

# Créer la commande
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d "$ORDER_DATA")

echo "Réponse de création :"
echo "$CREATE_RESPONSE" | jq '.'

# Extraire l'ID et le token de la commande
ORDER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')
PAYMENT_TOKEN=$(echo "$CREATE_RESPONSE" | jq -r '.data.payment.token // empty')
PAYMENT_URL=$(echo "$CREATE_RESPONSE" | jq -r '.data.payment.payment_url // empty')
ORDER_NUMBER=$(echo "$CREATE_RESPONSE" | jq -r '.data.orderNumber // empty')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
    echo "❌ Erreur lors de la création de la commande"
    echo "$CREATE_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Commande créée avec succès !"
echo "   - ID: $ORDER_ID"
echo "   - Numéro: $ORDER_NUMBER"
echo "   - Token: $PAYMENT_TOKEN"
echo "   - URL de paiement: $PAYMENT_URL"

echo ""
echo "💰 3. Vérification du statut initial de la commande..."

# Vérifier le statut initial
STATUS_RESPONSE=$(curl -s "$BASE_URL/orders/$ORDER_ID")
echo "Statut initial :"
echo "$STATUS_RESPONSE" | jq '.data | {orderNumber, status, paymentStatus, totalAmount, paymentAttempts}'

if [ -n "$PAYMENT_URL" ] && [ "$PAYMENT_URL" != "null" ]; then
    echo ""
    echo "🌐 4. Lien de paiement PayDunya généré :"
    echo "   $PAYMENT_URL"
    echo ""
    echo "📱 INSTRUCTIONS :"
    echo "   1. Cliquez sur le lien ci-dessus pour effectuer le paiement"
    echo "   2. Utilisez les identifiants de test PayDunya"
    echo "   3. Après le paiement, le webhook devrait mettre à jour le statut automatiquement"
    echo ""
    echo "⚡ 5. Surveillance du statut de paiement en temps réel..."

    # Surveillance du statut pendant 5 minutes
    for i in {1..60}; do
        echo -n "⏳ Vérification $i/60... "

        STATUS_RESPONSE=$(curl -s "$BASE_URL/orders/$ORDER_ID")
        CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.paymentStatus // "UNKNOWN"')
        PAYMENT_ATTEMPTS=$(echo "$STATUS_RESPONSE" | jq -r '.data.paymentAttempts // 0')

        echo "Statut: $CURRENT_STATUS (Tentatives: $PAYMENT_ATTEMPTS)"

        # Si le statut a changé, afficher les détails complets
        if [ "$CURRENT_STATUS" = "PAID" ]; then
            echo ""
            echo "🎉 PAIEMENT RÉUSSI !"
            echo "$STATUS_RESPONSE" | jq '.data | {orderNumber, paymentStatus, totalAmount, transactionId, confirmedAt, paymentAttempts}'
            echo ""
            echo "✅ Test de paiement terminé avec succès !"
            exit 0
        elif [ "$CURRENT_STATUS" = "FAILED" ]; then
            echo ""
            echo "❌ PAIEMENT ÉCHOUÉ !"
            echo "$STATUS_RESPONSE" | jq '.data | {orderNumber, paymentStatus, totalAmount, lastPaymentFailureReason, paymentAttempts}'
            echo ""
            echo "❌ Test de paiement échoué"
            exit 1
        elif [ "$CURRENT_STATUS" = "CANCELLED" ]; then
            echo ""
            echo "🚫 PAIEMENT ANNULÉ !"
            echo "$STATUS_RESPONSE" | jq '.data | {orderNumber, paymentStatus, totalAmount, paymentAttempts}'
            echo ""
            echo "🚫 Test de paiement annulé"
            exit 1
        fi

        sleep 5
    done

    echo ""
    echo "⏰ Délai d'attente dépassé (5 minutes)"
    echo "📊 Statut final :"
    echo "$STATUS_RESPONSE" | jq '.data | {order_number, payment_status, total_amount, payment_attempts}'

else
    echo ""
    echo "❌ URL de paiement non générée"
    echo "Réponse complète :"
    echo "$CREATE_RESPONSE" | jq '.'
fi

echo ""
echo "🔍 6. Test de vérification manuelle du statut PayDunya..."

if [ -n "$PAYMENT_TOKEN" ] && [ "$PAYMENT_TOKEN" != "null" ]; then
    PAYDUNYA_STATUS=$(curl -s "$BASE_URL/paydunya/status/$PAYMENT_TOKEN")
    echo "Statut PayDunya :"
    echo "$PAYDUNYA_STATUS" | jq '.'
fi

echo ""
echo "🏁 FIN DU TEST"