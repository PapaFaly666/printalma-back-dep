#!/bin/bash

# Script de test des endpoints de gestion des méthodes de paiement
# Usage: ./test-payment-methods.sh [JWT_TOKEN]

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${1:-}"

# Si pas de token fourni, demander à l'utilisateur
if [ -z "$TOKEN" ]; then
    echo -e "${BLUE}=== Authentification requise ===${NC}"
    echo "Pour obtenir un token JWT, connectez-vous en tant qu'admin via :"
    echo "POST $BASE_URL/auth/login"
    echo '{"email": "admin@example.com", "password": "yourpassword"}'
    echo ""
    read -p "Entrez votre token JWT : " TOKEN
fi

echo -e "${BLUE}=== Test des Endpoints de Méthodes de Paiement ===${NC}\n"

# Test 1 : Récupérer toutes les méthodes (Public)
echo -e "${BLUE}[TEST 1]${NC} GET /payment-methods (Public)"
curl -s -X GET "$BASE_URL/payment-methods" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 2 : Récupérer toutes les méthodes (Admin)
echo -e "${BLUE}[TEST 2]${NC} GET /admin/payment-methods (Admin)"
curl -s -X GET "$BASE_URL/admin/payment-methods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 3 : Vérifier le statut de PayDunya
echo -e "${BLUE}[TEST 3]${NC} GET /payment-config/PAYDUNYA"
curl -s -X GET "$BASE_URL/payment-config/PAYDUNYA" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 4 : Vérifier le statut d'Orange Money
echo -e "${BLUE}[TEST 4]${NC} GET /payment-config/ORANGE_MONEY"
curl -s -X GET "$BASE_URL/payment-config/ORANGE_MONEY" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 5 : Vérifier le statut du paiement à la livraison
echo -e "${BLUE}[TEST 5]${NC} GET /payment-config/cash-on-delivery"
curl -s -X GET "$BASE_URL/payment-config/cash-on-delivery" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 6 : Désactiver PayDunya (Admin)
echo -e "${BLUE}[TEST 6]${NC} PATCH /admin/payment-methods/PAYDUNYA/toggle (Désactivation)"
curl -s -X PATCH "$BASE_URL/admin/payment-methods/PAYDUNYA/toggle" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}' | jq '.'
echo -e "\n"

# Test 7 : Vérifier que PayDunya est désactivé
echo -e "${BLUE}[TEST 7]${NC} GET /payment-methods (Vérification - PayDunya devrait être absent)"
curl -s -X GET "$BASE_URL/payment-methods" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 8 : Réactiver PayDunya (Admin)
echo -e "${BLUE}[TEST 8]${NC} PATCH /admin/payment-methods/PAYDUNYA/toggle (Réactivation)"
curl -s -X PATCH "$BASE_URL/admin/payment-methods/PAYDUNYA/toggle" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}' | jq '.'
echo -e "\n"

# Test 9 : Vérifier que PayDunya est réactivé
echo -e "${BLUE}[TEST 9]${NC} GET /payment-methods (Vérification - PayDunya devrait être présent)"
curl -s -X GET "$BASE_URL/payment-methods" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Test 10 : Activer Orange Money
echo -e "${BLUE}[TEST 10]${NC} PATCH /admin/payment-methods/ORANGE_MONEY/toggle (Activation)"
curl -s -X PATCH "$BASE_URL/admin/payment-methods/ORANGE_MONEY/toggle" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}' | jq '.'
echo -e "\n"

# Test 11 : Activer le paiement à la livraison
echo -e "${BLUE}[TEST 11]${NC} PATCH /admin/payment-methods/CASH_ON_DELIVERY/toggle (Activation)"
curl -s -X PATCH "$BASE_URL/admin/payment-methods/CASH_ON_DELIVERY/toggle" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": true}' | jq '.'
echo -e "\n"

# Test 12 : Vérifier que toutes les méthodes sont actives
echo -e "${BLUE}[TEST 12]${NC} GET /payment-methods (Toutes les méthodes devraient être présentes)"
curl -s -X GET "$BASE_URL/payment-methods" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

echo -e "${GREEN}=== Tests terminés ===${NC}"
