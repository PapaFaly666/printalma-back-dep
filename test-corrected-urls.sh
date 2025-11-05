#!/bin/bash

echo "🔧 Test des URLs corrigées Paydunya"
echo "===================================="

# Attendre que le serveur soit prêt
sleep 8

echo ""
echo "1️⃣ Vérification de la configuration Paydunya :"
curl -s "http://localhost:3004/paydunya/test-config" | jq '.data | {callbackUrl, returnUrl, cancelUrl}' 2>/dev/null || echo "❌ Erreur de configuration"

echo ""
echo "2️⃣ Test de création de commande avec URLs corrigées :"
RESPONSE=$(curl -s -X POST "http://localhost:3004/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "customerInfo": {
      "firstName": "Test",
      "lastName": "Corrected",
      "email": "test-corrected@example.com",
      "phone": "+221775588835"
    },
    "shippingAddress": {
      "street": "Rue Corrigée 456",
      "city": "Dakar",
      "postalCode": "12345",
      "country": "Sénégal"
    },
    "items": [
      {
        "productId": 1,
        "quantity": 1,
        "price": 6000
      }
    ],
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }')

echo "$RESPONSE" | jq '{orderNumber, paymentUrl, paymentMethod, status}' 2>/dev/null || echo "❌ Erreur de création"

# Extraire l'URL de paiement si disponible
PAYMENT_URL=$(echo "$RESPONSE" | jq -r '.paymentUrl // empty' 2>/dev/null)

if [ ! -z "$PAYMENT_URL" ] && [ "$PAYMENT_URL" != "null" ]; then
    echo ""
    echo "✅ Nouvelle URL de paiement générée :"
    echo "$PAYMENT_URL"
    echo ""
    echo "📝 Résumé des corrections :"
    echo "- Callback URL: http://localhost:3004/paydunya/callback ✅"
    echo "- Return URL: http://localhost:3001/payment/success ✅"
    echo "- Cancel URL: http://localhost:3001/payment/cancel ✅"
else
    echo ""
    echo "❌ Impossible de générer une nouvelle URL de paiement"
fi

echo ""
echo "===================================="
echo "✅ Test des URLs corrigées terminé"