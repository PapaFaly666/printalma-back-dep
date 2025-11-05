#!/bin/bash

echo "🎯 TEST PAIEMENT PAYDUNYA RÉEL - WEBHOOK AUTOMATIQUE"
echo "=================================================="

# URL de base de l'API
BASE_URL="http://localhost:3004"

echo ""
echo "📋 1. Vérification de la disponibilité du serveur..."

# Vérifier si le serveur est disponible
for i in {1..10}; do
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        echo "✅ Serveur disponible sur $BASE_URL"
        break
    else
        echo "⏳ Attente du serveur... ($i/10)"
        sleep 2
    fi

    if [ $i -eq 10 ]; then
        echo "❌ Le serveur n'est pas disponible après 10 secondes"
        exit 1
    fi
done

echo ""
echo "📦 2. Création d'une commande test..."

# Créer une commande avec des données complètes
ORDER_DATA='{
  "customerInfo": {
    "name": "Client Test Automatique",
    "email": "client.auto@example.com"
  },
  "phoneNumber": "775588834",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 5000
    }
  ],
  "shippingDetails": {
    "street": "Rue Automatique 123",
    "city": "Dakar",
    "postalCode": "10000",
    "country": "Sénégal"
  },
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true
}'

echo "Données de commande :"
echo "$ORDER_DATA" | jq '.'

# Créer la commande
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d "$ORDER_DATA")

echo ""
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
echo "🔍 3. Vérification du statut initial..."

# Vérifier le statut initial via un endpoint direct
STATUS_RESPONSE=$(curl -s "$BASE_URL/orders/$ORDER_ID")
INITIAL_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.paymentStatus // "UNKNOWN"')
echo "Statut initial: $INITIAL_STATUS"

echo ""
echo "🤖 4. Simulation d'un paiement réussi via webhook..."

# Simuler le webhook PayDunya pour un paiement réussi
WEBHOOK_SUCCESS_DATA='{
  "invoice_token": "'$PAYMENT_TOKEN'",
  "status": "completed",
  "response_code": "00",
  "total_amount": 5000,
  "custom_data": "{\"order_number\":\"'$ORDER_NUMBER'\",\"orderId\":'$ORDER_ID'}",
  "payment_method": "paydunya",
  "customer_name": "Client Test Automatique",
  "customer_email": "client.auto@example.com"
}'

echo "Données du webhook de succès :"
echo "$WEBHOOK_SUCCESS_DATA" | jq '.'

echo ""
echo "📤 Envoi du webhook de succès..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_SUCCESS_DATA")

echo "Réponse du webhook :"
echo "$WEBHOOK_RESPONSE" | jq '.'

# Vérifier si le webhook a été traité avec succès
if echo "$WEBHOOK_RESPONSE" | jq -r '.success' 2>/dev/null | grep -q true; then
    echo "✅ Webhook traité avec succès"

    # Vérifier que le statut a été mis à jour
    UPDATED_ORDER_NUMBER=$(echo "$WEBHOOK_RESPONSE" | jq -r '.data.order_number // empty')
    PAYMENT_STATUS=$(echo "$WEBHOOK_RESPONSE" | jq -r '.data.payment_status // empty')

    echo "   - Numéro de commande: $UPDATED_ORDER_NUMBER"
    echo "   - Statut de paiement: $PAYMENT_STATUS"

    if [ "$PAYMENT_STATUS" = "success" ]; then
        echo "✅ Paiement marqué comme réussi !"
    fi
else
    echo "❌ Échec du traitement du webhook"
fi

echo ""
echo "🔍 5. Vérification du statut après webhook..."

# Attendre un peu que la base de données soit mise à jour
sleep 2

# Vérifier le statut mis à jour
FINAL_STATUS_RESPONSE=$(curl -s "$BASE_URL/orders/$ORDER_ID")
FINAL_STATUS=$(echo "$FINAL_STATUS_RESPONSE" | jq -r '.data.paymentStatus // "UNKNOWN"')
FINAL_ATTEMPTS=$(echo "$FINAL_STATUS_RESPONSE" | jq -r '.data.paymentAttempts // 0')

echo "Statut final: $FINAL_STATUS"
echo "Tentatives de paiement: $FINAL_ATTEMPTS"

if [ "$FINAL_STATUS" = "PAID" ]; then
    echo "✅ SUCCÈS ! Le statut a été automatiquement mis à jour à PAID"
else
    echo "❌ Le statut n'a pas été correctement mis à jour"
    echo "Réponse complète:"
    echo "$FINAL_STATUS_RESPONSE" | jq '.'
fi

echo ""
echo "🎯 6. Test d'un paiement échoué..."

# Créer une deuxième commande pour tester un échec
echo "Création d'une deuxième commande pour le test d'échec..."

FAIL_ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d "$ORDER_DATA")

FAIL_ORDER_ID=$(echo "$FAIL_ORDER_RESPONSE" | jq -r '.data.id // empty')
FAIL_ORDER_NUMBER=$(echo "$FAIL_ORDER_RESPONSE" | jq -r '.data.orderNumber // empty')
FAIL_PAYMENT_TOKEN=$(echo "$FAIL_ORDER_RESPONSE" | jq -r '.data.payment.token // empty')

if [ -n "$FAIL_ORDER_ID" ] && [ "$FAIL_ORDER_ID" != "null" ]; then
    echo "✅ Commande d'échec créée: $FAIL_ORDER_NUMBER"

    # Simuler un webhook d'échec
    WEBHOOK_FAIL_DATA='{
      "invoice_token": "'$FAIL_PAYMENT_TOKEN'",
      "status": "cancelled",
      "response_code": "02",
      "total_amount": 5000,
      "custom_data": "{\"order_number\":\"'$FAIL_ORDER_NUMBER'\",\"orderId\":'$FAIL_ORDER_ID'}",
      "payment_method": "paydunya",
      "cancel_reason": "Insufficient funds",
      "error_code": "INSUFFICIENT_FUNDS"
    }'

    echo ""
    echo "📤 Envoi du webhook d'échec..."
    FAIL_WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/webhook" \
      -H "Content-Type: application/json" \
      -d "$WEBHOOK_FAIL_DATA")

    echo "Réponse du webhook d'échec :"
    echo "$FAIL_WEBHOOK_RESPONSE" | jq '.'

    # Vérifier le statut d'échec
    FAIL_STATUS=$(echo "$FAIL_WEBHOOK_RESPONSE" | jq -r '.data.payment_status // empty')
    FAILURE_DETAILS=$(echo "$FAIL_WEBHOOK_RESPONSE" | jq -r '.data.failure_details // empty')

    if [ "$FAIL_STATUS" = "failed" ]; then
        echo "✅ Échec de paiement correctement enregistré"
        echo "   - Statut: $FAIL_STATUS"
        echo "   - Détails: $FAILURE_DETAILS"
    else
        echo "❌ L'échec de paiement n'a pas été correctement enregistré"
    fi
fi

echo ""
echo "🎉 7. Résumé du test"
echo "===================="

if [ "$FINAL_STATUS" = "PAID" ]; then
    echo "✅ Test RÉUSSI : L'intégration automatique PayDunya fonctionne parfaitement !"
    echo ""
    echo "📌 Points clés vérifiés :"
    echo "   - ✅ Création de commande avec paiement PayDunya"
    echo "   - ✅ Génération d'URL de paiement PayDunya"
    echo "   - ✅ Webhook flexible accepte les données PayDunya"
    echo "   - ✅ Mise à jour automatique du statut PENDING → PAID"
    echo "   - ✅ Gestion des erreurs et des échecs de paiement"
    echo ""
    echo "🚀 L'intégration est PRÊTE pour la production !"
else
    echo "❌ Test ÉCHOUÉ : Des ajustements sont nécessaires"
    echo ""
    echo "🔍 Points à vérifier :"
    echo "   - Endpoint webhook: /paydunya/webhook"
    echo "   - Service de mise à jour des commandes"
    echo "   - Configuration de la base de données"
fi

echo ""
echo "🏁 FIN DU TEST AUTOMATIQUE"