#\!/bin/bash
echo "🧪 TEST MANUEL CONNEXION"
echo "=========================================="

# 1. Connexion
echo "1️⃣ Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3004/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"khaby@gmail.com","password":"printalmatest123"}')

VENDOR_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ -z "$VENDOR_TOKEN" ]; then
  echo "❌ Erreur de connexion"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenu: ${VENDOR_TOKEN:0:20}..."

# 2. Mise en statut DELIVERED
echo ""
echo "2️⃣ Mise en statut DELIVERED de la commande 367..."
UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3004/orders/367/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"status":"DELIVERED","notes":"Commande livrée - test pour demande de fonds"}')

echo "Réponse: $UPDATE_RESPONSE"

# 3. Test demande de fonds
echo ""
echo "3️⃣ Test demande de fonds..."
FUNDS_RESPONSE=$(curl -s -X POST http://localhost:3004/orders/367/request-funds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -d '{"amount":1000,"paymentMethod":"BANK_TRANSFER","phoneNumber":"778820042","iban":"SN00123456789012345678","description":"Test retrait pour commande livrée"}')

echo "Réponse: $FUNDS_RESPONSE"

# 4. Vérification
SUCCESS=$(echo "$FUNDS_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ SUCCÈS \! Demande de fonds créée \!"
  REQUEST_ID=$(echo "$FUNDS_RESPONSE" | jq -r '.data.fundsRequest.id')
  echo "📋 ID Demande : $REQUEST_ID"
  echo "💰 Montant : $(echo "$FUNDS_RESPONSE" | jq -r '.data.fundsRequest.amount')"
else
  echo "❌ ÉCHEC :"
  echo "$FUNDS_RESPONSE" | jq -r '.message'
fi

echo ""
echo "🎯 TEST TERMINÉ"
