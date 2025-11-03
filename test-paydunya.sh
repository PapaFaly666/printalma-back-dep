#!/bin/bash

# Script de test PayDunya
# Ce script teste tous les endpoints PayDunya en mode sandbox

echo "=========================================="
echo "  Tests PayDunya - Mode Sandbox"
echo "=========================================="
echo ""

# Configuration
BASE_URL="http://localhost:3004"
API_URL="${BASE_URL}/paydunya"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ SUCCÈS${NC}"
    else
        echo -e "${RED}✗ ÉCHEC${NC}"
    fi
    echo ""
}

# Test 1: Vérification de la configuration
echo -e "${YELLOW}Test 1: Vérification de la configuration${NC}"
echo "GET ${API_URL}/test-config"
echo ""
response=$(curl -s -w "\n%{http_code}" "${API_URL}/test-config")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "$body" | jq '.'
echo "HTTP Status: $http_code"

if [ "$http_code" -eq 200 ]; then
    print_result 0
else
    print_result 1
fi

# Test 2: Initialisation d'un paiement
echo -e "${YELLOW}Test 2: Initialisation d'un paiement${NC}"
echo "POST ${API_URL}/payment"
echo ""

payment_data='{
  "invoice": {
    "total_amount": 1000,
    "description": "Test Order #TEST-'$(date +%s)'",
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+221701234567"
    },
    "channels": ["orange-money-senegal", "wave-senegal"]
  },
  "store": {
    "name": "Printalma Store",
    "tagline": "Impression de qualité",
    "phone": "+221338234567"
  },
  "actions": {
    "callback_url": "'${BASE_URL}'/paydunya/callback",
    "return_url": "https://printalma.com/payment/success",
    "cancel_url": "https://printalma.com/payment/cancel"
  },
  "custom_data": {
    "order_number": "TEST-'$(date +%s)'",
    "user_id": "test-user-123"
  }
}'

echo "Payload:"
echo "$payment_data" | jq '.'
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/payment" \
  -H "Content-Type: application/json" \
  -d "$payment_data")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "Response:"
echo "$body" | jq '.'
echo "HTTP Status: $http_code"

# Extraire le token pour les tests suivants
invoice_token=$(echo "$body" | jq -r '.data.token // empty')

if [ "$http_code" -eq 200 ] && [ -n "$invoice_token" ]; then
    print_result 0
    echo "Invoice Token: $invoice_token"
    echo ""
else
    print_result 1
    echo -e "${RED}Erreur: Impossible d'obtenir le token de la facture${NC}"
    echo ""
fi

# Test 3: Vérification du statut de paiement (si token disponible)
if [ -n "$invoice_token" ]; then
    echo -e "${YELLOW}Test 3: Vérification du statut de paiement${NC}"
    echo "GET ${API_URL}/status/${invoice_token}"
    echo ""

    sleep 2  # Attendre un peu avant de vérifier le statut

    response=$(curl -s -w "\n%{http_code}" "${API_URL}/status/${invoice_token}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "Response:"
    echo "$body" | jq '.'
    echo "HTTP Status: $http_code"

    if [ "$http_code" -eq 200 ]; then
        print_result 0
    else
        print_result 1
    fi
else
    echo -e "${YELLOW}Test 3: Vérification du statut de paiement${NC}"
    echo -e "${RED}Ignoré - Pas de token disponible${NC}"
    echo ""
fi

# Test 4: Simulation de callback IPN (succès)
echo -e "${YELLOW}Test 4: Simulation de callback IPN (succès)${NC}"
echo "POST ${API_URL}/callback"
echo ""

if [ -n "$invoice_token" ]; then
    callback_data='{
      "invoice_token": "'$invoice_token'",
      "status": "completed",
      "total_amount": 1000,
      "customer_name": "Test User",
      "customer_email": "test@example.com",
      "customer_phone": "+221701234567",
      "payment_method": "orange-money-senegal",
      "custom_data": "{\"order_number\":\"TEST-'$(date +%s)'\",\"user_id\":\"test-user-123\"}"
    }'

    echo "Payload:"
    echo "$callback_data" | jq '.'
    echo ""

    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/callback" \
      -H "Content-Type: application/json" \
      -d "$callback_data")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "Response:"
    echo "$body" | jq '.'
    echo "HTTP Status: $http_code"

    if [ "$http_code" -eq 200 ]; then
        print_result 0
    else
        print_result 1
    fi
else
    echo -e "${RED}Ignoré - Pas de token disponible${NC}"
    echo ""
fi

# Test 5: Simulation de callback IPN (échec - fonds insuffisants)
echo -e "${YELLOW}Test 5: Simulation de callback IPN (échec - fonds insuffisants)${NC}"
echo "POST ${API_URL}/callback"
echo ""

test_token="test-failed-$(date +%s)"
callback_data_failed='{
  "invoice_token": "'$test_token'",
  "status": "failed",
  "total_amount": 1000,
  "customer_name": "Test User",
  "customer_email": "test@example.com",
  "customer_phone": "+221701234567",
  "payment_method": "orange-money-senegal",
  "cancel_reason": "Insufficient funds in account",
  "error_code": "INSUFFICIENT_FUNDS",
  "custom_data": "{\"order_number\":\"TEST-FAILED-'$(date +%s)'\"}"
}'

echo "Payload:"
echo "$callback_data_failed" | jq '.'
echo ""

response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/callback" \
  -H "Content-Type: application/json" \
  -d "$callback_data_failed")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "Response:"
echo "$body" | jq '.'
echo "HTTP Status: $http_code"

if [ "$http_code" -eq 200 ]; then
    print_result 0
else
    print_result 1
fi

# Résumé
echo "=========================================="
echo "  Résumé des tests"
echo "=========================================="
echo ""
echo "Tous les tests ont été exécutés."
echo ""
echo "Prochaines étapes:"
echo "1. Vérifier les logs de l'application"
echo "2. Tester avec un vrai paiement en sandbox"
echo "3. Vérifier la base de données pour les PaymentAttempt"
echo "4. Configurer les clés de production"
echo ""
echo "Documentation complète: PAYDUNYA_MIGRATION_GUIDE.md"
echo ""
