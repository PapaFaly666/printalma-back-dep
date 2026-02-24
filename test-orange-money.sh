#!/bin/bash

# Script de test des nouveaux endpoints Orange Money
# Base URL (à adapter selon votre environnement)
BASE_URL="http://localhost:3004"

echo "=========================================="
echo "TEST DES NOUVEAUX ENDPOINTS ORANGE MONEY"
echo "=========================================="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Tester la connexion
echo -e "${YELLOW}TEST 1: Test de connexion${NC}"
echo "GET $BASE_URL/orange-money/test-connection"
curl -s -X GET "$BASE_URL/orange-money/test-connection" | jq '.'
echo ""
echo ""

# Test 2: Récupérer toutes les transactions
echo -e "${YELLOW}TEST 2: Récupérer toutes les transactions${NC}"
echo "GET $BASE_URL/orange-money/transactions"
curl -s -X GET "$BASE_URL/orange-money/transactions" | jq '.'
echo ""
echo ""

# Test 3: Récupérer les transactions avec filtre SUCCESS
echo -e "${YELLOW}TEST 3: Récupérer les transactions SUCCESS${NC}"
echo "GET $BASE_URL/orange-money/transactions?status=SUCCESS&limit=10"
curl -s -X GET "$BASE_URL/orange-money/transactions?status=SUCCESS&limit=10" | jq '.'
echo ""
echo ""

# Test 4: Vérifier le statut d'une transaction
echo -e "${YELLOW}TEST 4: Vérifier le statut d'une transaction${NC}"
echo "Note: Remplacez TRANSACTION_ID par un vrai ID"
TRANSACTION_ID="OM-TEST-123-1234567890"
echo "GET $BASE_URL/orange-money/verify-transaction/$TRANSACTION_ID"
curl -s -X GET "$BASE_URL/orange-money/verify-transaction/$TRANSACTION_ID" | jq '.'
echo ""
echo ""

# Test 5: Vérifier si une commande est payée
echo -e "${YELLOW}TEST 5: Vérifier si une commande est payée${NC}"
echo "Note: Remplacez ORDER_NUMBER par un vrai numéro de commande"
ORDER_NUMBER="ORD-TEST-001"
echo "GET $BASE_URL/orange-money/check-payment/$ORDER_NUMBER"
curl -s -X GET "$BASE_URL/orange-money/check-payment/$ORDER_NUMBER" | jq '.'
echo ""
echo ""

# Test 6: Créer une commande de test et vérifier le paiement
echo -e "${YELLOW}TEST 6: Scénario complet - Créer commande + Simuler paiement + Vérifier${NC}"

echo "6.1 - Création d'une commande de test..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "name": "Test Product",
        "quantity": 1,
        "price": 10000
      }
    ],
    "totalAmount": 10000,
    "paymentMethod": "ORANGE_MONEY",
    "customerInfo": {
      "name": "Jean Test",
      "phone": "771234567",
      "email": "test@example.com",
      "address": "Dakar"
    }
  }')

echo "$CREATE_RESPONSE" | jq '.'

# Extraire le orderNumber
ORDER_NUM=$(echo "$CREATE_RESPONSE" | jq -r '.orderNumber // .data.orderNumber // empty')

if [ -z "$ORDER_NUM" ]; then
  echo -e "${RED}Erreur: Impossible de créer la commande${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}Commande créée: $ORDER_NUM${NC}"
echo ""

# Attendre un peu
sleep 2

echo "6.2 - Simulation d'un paiement réussi..."
curl -s -X POST "$BASE_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_NUM\",
    \"transactionId\": \"TXN-TEST-$(date +%s)\"
  }" | jq '.'

echo ""

# Attendre un peu
sleep 2

echo "6.3 - Vérification du paiement avec le nouvel endpoint..."
echo "GET $BASE_URL/orange-money/check-payment/$ORDER_NUM"
PAYMENT_CHECK=$(curl -s -X GET "$BASE_URL/orange-money/check-payment/$ORDER_NUM")
echo "$PAYMENT_CHECK" | jq '.'

# Vérifier si isPaid est true
IS_PAID=$(echo "$PAYMENT_CHECK" | jq -r '.isPaid')
if [ "$IS_PAID" = "true" ]; then
  echo -e "${GREEN}✅ SUCCÈS: La commande est bien marquée comme payée!${NC}"
else
  echo -e "${RED}❌ ERREUR: La commande n'est pas marquée comme payée${NC}"
fi

echo ""
echo ""

echo "=========================================="
echo "FIN DES TESTS"
echo "=========================================="
