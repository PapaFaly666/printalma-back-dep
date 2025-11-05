#!/bin/bash

echo "🔗 TEST DE REDIRECTION PAIEMENT PAYDUNYA"
echo "========================================"

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
echo "🎯 2. Test des endpoints de redirection"

echo ""
echo "📱 Test de la page de succès..."
SUCCESS_RESPONSE=$(curl -s "$BASE_URL/paydunya/payment/success?token=test_token&invoice_token=test_token")

if [[ "$SUCCESS_RESPONSE" == *"Paiement Réussi"* ]]; then
    echo "✅ Page de succès accessible"
else
    echo "❌ Page de succès inaccessible"
    echo "Réponse: $SUCCESS_RESPONSE"
fi

echo ""
echo "🚫 Test de la page d'annulation..."
CANCEL_RESPONSE=$(curl -s "$BASE_URL/paydunya/payment/cancel?token=test_token&reason=test")

if [[ "$CANCEL_RESPONSE" == *"Paiement Annulé"* ]]; then
    echo "✅ Page d'annulation accessible"
else
    echo "❌ Page d'annulation inaccessible"
    echo "Réponse: $CANCEL_RESPONSE"
fi

echo ""
echo "🔄 3. Test du endpoint de callback..."

# Simuler un webhook de succès
WEBHOOK_DATA='{
  "invoice_token": "test_token_123",
  "status": "completed",
  "response_code": "00",
  "total_amount": 10000,
  "custom_data": {
    "orderNumber": "ORD-123456",
    "orderId": 1
  },
  "payment_method": "paydunya"
}'

echo "Données du webhook:"
echo "$WEBHOOK_DATA" | jq '.'

echo ""
echo "📤 Envoi du webhook..."
CALLBACK_RESPONSE=$(curl -s -X POST "$BASE_URL/paydunya/callback" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_DATA")

echo "Réponse du webhook:"
echo "$CALLBACK_RESPONSE" | jq '.'

if echo "$CALLBACK_RESPONSE" | jq -r '.success' 2>/dev/null | grep -q true; then
    echo "✅ Webhook traité avec succès"
else
    echo "❌ Échec du traitement du webhook"
fi

echo ""
echo "🔍 4. Test de vérification du statut PayDunya..."

STATUS_RESPONSE=$(curl -s "$BASE_URL/paydunya/status/test_token_123")
echo "Réponse du statut:"
echo "$STATUS_RESPONSE" | jq '.'

echo ""
echo "🌐 5. Vérification des URLs de redirection configurées..."

echo "📋 Configuration attendue:"
echo "- Callback URL: $BASE_URL/paydunya/callback"
echo "- Success URL: $BASE_URL/payment/success"
echo "- Cancel URL: $BASE_URL/payment/cancel"

echo ""
echo "✅ TEST DE REDIRECTION TERMINÉ"