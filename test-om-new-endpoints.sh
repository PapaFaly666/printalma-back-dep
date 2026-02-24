#!/bin/bash

# Test des nouveaux endpoints Orange Money
# Ces endpoints utilisent l'API v1 de Orange Money

echo "========================================"
echo "TEST DES NOUVEAUX ENDPOINTS ORANGE MONEY"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Base URL: $BASE_URL"
echo ""

# Test 1: GET /orange-money/transactions
echo "========================================"
echo -e "${BLUE}TEST 1: Liste des transactions${NC}"
echo "========================================"
echo "Endpoint: GET /orange-money/transactions?size=5"
echo ""

RESPONSE=$(curl -s "$BASE_URL/orange-money/transactions?size=5")
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS" = "True" ]; then
    echo -e "${GREEN}✅ SUCCÈS${NC}"
    echo "Réponse:"
    echo "$RESPONSE" | python3 -m json.tool | head -80
else
    echo -e "${RED}❌ ÉCHEC${NC}"
    echo "Réponse:"
    echo "$RESPONSE" | python3 -m json.tool
fi

echo ""
echo ""

# Test 2: GET /orange-money/verify-transaction/:transactionId
echo "========================================"
echo -e "${BLUE}TEST 2: Vérification d'une transaction${NC}"
echo "========================================"

# Extraire un transactionId depuis le test précédent
TRANSACTION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data'][0]['transactionId'] if data.get('success') and data.get('data') else '')" 2>/dev/null || echo "")

if [ -z "$TRANSACTION_ID" ]; then
    echo -e "${YELLOW}⚠️ Aucune transaction trouvée dans le test précédent${NC}"
    echo "Utilisation d'un ID de test: MP260223.0012.B07597"
    TRANSACTION_ID="MP260223.0012.B07597"
fi

echo "Transaction ID: $TRANSACTION_ID"
echo "Endpoint: GET /orange-money/verify-transaction/$TRANSACTION_ID"
echo ""

RESPONSE2=$(curl -s "$BASE_URL/orange-money/verify-transaction/$TRANSACTION_ID")
SUCCESS2=$(echo "$RESPONSE2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS2" = "True" ]; then
    echo -e "${GREEN}✅ SUCCÈS${NC}"
    echo "Réponse:"
    echo "$RESPONSE2" | python3 -m json.tool
else
    echo -e "${RED}❌ ÉCHEC${NC}"
    echo "Réponse:"
    echo "$RESPONSE2" | python3 -m json.tool
fi

echo ""
echo ""

# Test 3: GET /orange-money/check-payment/:orderNumber
echo "========================================"
echo -e "${BLUE}TEST 3: Vérification + Réconciliation${NC}"
echo "========================================"

# Extraire un orderNumber depuis le test 1
ORDER_NUMBER=$(echo "$RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data'][0]['metadata'].get('orderNumber', '') if data.get('success') and data.get('data') else '')" 2>/dev/null || echo "")

if [ -z "$ORDER_NUMBER" ]; then
    echo -e "${YELLOW}⚠️ Aucun orderNumber trouvé dans les transactions${NC}"
    echo "Utilisation d'un numéro de test: ORD-1771862107035"
    ORDER_NUMBER="ORD-1771862107035"
fi

echo "Order Number: $ORDER_NUMBER"
echo "Endpoint: GET /orange-money/check-payment/$ORDER_NUMBER"
echo ""

RESPONSE3=$(curl -s "$BASE_URL/orange-money/check-payment/$ORDER_NUMBER")
SUCCESS3=$(echo "$RESPONSE3" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS3" = "True" ]; then
    RECONCILED=$(echo "$RESPONSE3" | python3 -c "import sys, json; print(json.load(sys.stdin).get('reconciled', False))" 2>/dev/null || echo "false")

    if [ "$RECONCILED" = "True" ]; then
        echo -e "${GREEN}✅ SUCCÈS - Réconciliation effectuée !${NC}"
    else
        echo -e "${GREEN}✅ SUCCÈS - Statuts déjà synchronisés${NC}"
    fi

    echo "Réponse:"
    echo "$RESPONSE3" | python3 -m json.tool
else
    echo -e "${RED}❌ ÉCHEC${NC}"
    echo "Réponse:"
    echo "$RESPONSE3" | python3 -m json.tool
fi

echo ""
echo ""

# Test 4: Filtrage des transactions par statut
echo "========================================"
echo -e "${BLUE}TEST 4: Filtrage par statut SUCCESS${NC}"
echo "========================================"
echo "Endpoint: GET /orange-money/transactions?status=SUCCESS&size=3"
echo ""

RESPONSE4=$(curl -s "$BASE_URL/orange-money/transactions?status=SUCCESS&size=3")
SUCCESS4=$(echo "$RESPONSE4" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS4" = "True" ]; then
    echo -e "${GREEN}✅ SUCCÈS${NC}"
    TOTAL=$(echo "$RESPONSE4" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "0")
    echo "Transactions SUCCESS trouvées: $TOTAL"
    echo ""
    echo "Réponse:"
    echo "$RESPONSE4" | python3 -m json.tool | head -50
else
    echo -e "${RED}❌ ÉCHEC${NC}"
    echo "Réponse:"
    echo "$RESPONSE4" | python3 -m json.tool
fi

echo ""
echo ""

# Résumé
echo "========================================"
echo "RÉSUMÉ"
echo "========================================"
echo ""

if [ "$SUCCESS" = "True" ]; then
    echo -e "${GREEN}✅ Test 1: Liste des transactions${NC}"
else
    echo -e "${RED}❌ Test 1: Liste des transactions${NC}"
fi

if [ "$SUCCESS2" = "True" ]; then
    echo -e "${GREEN}✅ Test 2: Vérification de transaction${NC}"
else
    echo -e "${RED}❌ Test 2: Vérification de transaction${NC}"
fi

if [ "$SUCCESS3" = "True" ]; then
    echo -e "${GREEN}✅ Test 3: Vérification + Réconciliation${NC}"
else
    echo -e "${RED}❌ Test 3: Vérification + Réconciliation${NC}"
fi

if [ "$SUCCESS4" = "True" ]; then
    echo -e "${GREEN}✅ Test 4: Filtrage par statut${NC}"
else
    echo -e "${RED}❌ Test 4: Filtrage par statut${NC}"
fi

echo ""
echo "========================================"
echo "Documentation:"
echo "  - ORANGE_MONEY_FINAL_V2.md (mise à jour)"
echo "  - API Orange Money v1 endpoints"
echo "========================================"
