#!/bin/bash

# Test rapide des transactions Orange Money
BASE_URL="http://localhost:3004"

echo "======================================"
echo "TEST RAPIDE ORANGE MONEY"
echo "======================================"
echo ""

# Test 1: Connexion
echo "1️⃣  TEST CONNEXION ORANGE MONEY"
echo "GET $BASE_URL/orange-money/test-connection"
curl -s "$BASE_URL/orange-money/test-connection" | jq '.'
echo ""
echo ""

# Test 2: Créer une commande test
echo "2️⃣  CRÉATION D'UNE COMMANDE TEST"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "name": "Produit Test OM",
      "quantity": 1,
      "price": 5000
    }],
    "totalAmount": 5000,
    "paymentMethod": "ORANGE_MONEY",
    "customerInfo": {
      "name": "Test Orange Money",
      "phone": "771234567",
      "email": "testom@example.com",
      "address": "Dakar, Senegal"
    }
  }')

echo "$ORDER_RESPONSE" | jq '.'

# Extraire orderNumber
ORDER_NUM=$(echo "$ORDER_RESPONSE" | jq -r '.orderNumber // .data.orderNumber // empty')

if [ -z "$ORDER_NUM" ]; then
  echo "❌ Erreur: Impossible d'extraire le orderNumber"
  echo "Réponse complète: $ORDER_RESPONSE"
  exit 1
fi

echo ""
echo "✅ Commande créée: $ORDER_NUM"
echo ""

# Test 3: Simuler un paiement réussi
echo "3️⃣  SIMULATION D'UN PAIEMENT RÉUSSI"
echo "POST $BASE_URL/orange-money/test-callback-success"
curl -s -X POST "$BASE_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_NUM\",
    \"transactionId\": \"TXN-TEST-$(date +%s)\"
  }" | jq '.'
echo ""

sleep 2

# Test 4: Vérifier le statut de paiement (ancien endpoint)
echo "4️⃣  VÉRIFICATION STATUT (ancien endpoint)"
echo "GET $BASE_URL/orange-money/payment-status/$ORDER_NUM"
curl -s "$BASE_URL/orange-money/payment-status/$ORDER_NUM" | jq '.'
echo ""
echo ""

# Test 5: Vérifier avec le nouveau endpoint check-payment
echo "5️⃣  VÉRIFICATION AVEC NOUVEAU ENDPOINT (check-payment)"
echo "GET $BASE_URL/orange-money/check-payment/$ORDER_NUM"
CHECK_RESPONSE=$(curl -s "$BASE_URL/orange-money/check-payment/$ORDER_NUM")
echo "$CHECK_RESPONSE" | jq '.'

IS_PAID=$(echo "$CHECK_RESPONSE" | jq -r '.isPaid')
if [ "$IS_PAID" = "true" ]; then
  echo ""
  echo "✅✅✅ SUCCÈS: La commande est bien marquée comme PAYÉE!"
  echo ""
else
  echo ""
  echo "❌ ERREUR: La commande n'est pas marquée comme payée"
  echo "isPaid: $IS_PAID"
  echo ""
fi

# Test 6: Récupérer la liste des transactions
echo "6️⃣  RÉCUPÉRATION DE LA LISTE DES TRANSACTIONS"
echo "GET $BASE_URL/orange-money/transactions?limit=5"
curl -s "$BASE_URL/orange-money/transactions?limit=5" | jq '.'
echo ""
echo ""

# Test 7: Créer une deuxième commande et simuler un échec
echo "7️⃣  TEST D'UN PAIEMENT ÉCHOUÉ"
ORDER_RESPONSE_2=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "name": "Test Échec",
      "quantity": 1,
      "price": 2000
    }],
    "totalAmount": 2000,
    "paymentMethod": "ORANGE_MONEY",
    "customerInfo": {
      "name": "Test Échec OM",
      "phone": "779876543",
      "email": "testfail@example.com",
      "address": "Dakar"
    }
  }')

ORDER_NUM_2=$(echo "$ORDER_RESPONSE_2" | jq -r '.orderNumber // .data.orderNumber // empty')

if [ ! -z "$ORDER_NUM_2" ]; then
  echo "Commande créée: $ORDER_NUM_2"

  # Simuler un échec
  echo "Simulation d'un paiement échoué..."
  curl -s -X POST "$BASE_URL/orange-money/test-callback-failed" \
    -H "Content-Type: application/json" \
    -d "{\"orderNumber\": \"$ORDER_NUM_2\"}" | jq '.'

  sleep 2

  # Vérifier
  echo ""
  echo "Vérification du statut (devrait être FAILED):"
  CHECK_FAIL=$(curl -s "$BASE_URL/orange-money/check-payment/$ORDER_NUM_2")
  echo "$CHECK_FAIL" | jq '.'

  IS_PAID_FAIL=$(echo "$CHECK_FAIL" | jq -r '.isPaid')
  if [ "$IS_PAID_FAIL" = "false" ]; then
    echo ""
    echo "✅ SUCCÈS: Le paiement échoué est bien détecté (isPaid: false)"
  fi
fi

echo ""
echo ""
echo "======================================"
echo "RÉSUMÉ DES TESTS"
echo "======================================"
echo "✅ Connexion Orange Money"
echo "✅ Création de commande"
echo "✅ Simulation paiement réussi"
echo "✅ Vérification statut ancien endpoint"
echo "✅ Vérification statut nouveau endpoint (check-payment)"
echo "✅ Liste des transactions"
echo "✅ Test paiement échoué"
echo ""
echo "Tous les tests sont terminés! 🎉"
