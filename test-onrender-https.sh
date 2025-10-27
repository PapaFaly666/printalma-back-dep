#!/bin/bash

echo "🧪 TEST PAYTECH AVEC CONFIGURATION ONRENDER HTTPS"
echo "================================================="

API_URL="http://localhost:3004"
ONRENDER_URL="https://printalma-website-dep.onrender.com"

echo "📋 Configuration de test :"
echo "- API Backend : $API_URL"
echo "- Frontend OnRender : $ONRENDER_URL"
echo ""

# Test 1: Vérifier la configuration actuelle
echo "1️⃣ Vérification de la configuration Paytech..."
curl -s "$API_URL/paytech/test-config" | jq '.' 2>/dev/null || echo "❌ Erreur de configuration"
echo ""

# Test 2: Créer un paiement avec URLs HTTPS OnRender
echo "2️⃣ Test de paiement avec URLs HTTPS OnRender..."
PAYLOAD=$(cat <<EOF
{
  "item_name": "T-Shirt Premium Test",
  "item_price": 5000,
  "ref_command": "TEST-ONRENDER-$(date +%s)",
  "command_name": "Test T-Shirt OnRender",
  "ipn_url": "$ONRENDER_URL/api/paytech/ipn-callback",
  "success_url": "$ONRENDER_URL/payment/success",
  "cancel_url": "$ONRENDER_URL/payment/cancel",
  "env": "test",
  "currency": "XOF"
}
EOF
)

echo "Payload envoyé :"
echo "$PAYLOAD" | jq '.'
echo ""

echo "Réponse de Paytech :"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$API_URL/paytech/payment")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Analyser la réponse
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
    echo "✅ SUCCÈS ! Le paiement avec URLs HTTPS fonctionne"
    REDIRECT_URL=$(echo "$RESPONSE" | jq -r '.data.redirect_url // ""' 2>/dev/null)
    echo "🔗 URL de redirection : $REDIRECT_URL"
    echo ""
    echo "📄 Réponse complète :"
    echo "$RESPONSE" | jq '.' 2>/dev/null
else
    echo "❌ ÉCHEC du test"
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // .message // "Erreur inconnue"' 2>/dev/null)
    echo "🔍 Erreur : $ERROR_MSG"

    # Vérifier si c'est l'erreur HTTPS
    if [[ "$ERROR_MSG" == *"https"* ]]; then
        echo ""
        echo "🔧 SOLUTION : L'erreur confirme que Paytech exige HTTPS"
        echo "✅ Utilisez la configuration ONRENDER_IPN_FIX.md"
        echo "📝 Remplacez les URLs par celles d'OnRender"
    fi
fi

echo ""
echo "🏁 Fin du test"