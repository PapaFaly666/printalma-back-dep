#!/bin/bash

# Test direct de l'API PayTech sans passer par le backend
# Ce script teste différentes variantes pour identifier le problème

source .env

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Direct API PayTech${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Vérifier les credentials
if [ -z "$PAYTECH_API_KEY" ] || [ -z "$PAYTECH_API_SECRET" ]; then
    echo -e "${RED}❌ Credentials PayTech manquants dans .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Credentials trouvés${NC}"
echo -e "  API_KEY length: ${#PAYTECH_API_KEY}"
echo -e "  API_SECRET length: ${#PAYTECH_API_SECRET}"
echo -e "  Environment: $PAYTECH_ENVIRONMENT\n"

# Test 1: Requête minimale en mode TEST
echo -e "${YELLOW}[Test 1]${NC} Requête minimale en mode TEST..."
REF_COMMAND="TEST-MINIMAL-$(date +%s)"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://paytech.sn/api/payment/request-payment" \
  -H "API_KEY: $PAYTECH_API_KEY" \
  -H "API_SECRET: $PAYTECH_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Product",
    "item_price": 1000,
    "ref_command": "'${REF_COMMAND}'",
    "command_name": "Test Command",
    "currency": "XOF",
    "env": "test"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Code HTTP: $HTTP_CODE"
echo "Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 2: Requête complète avec toutes les URLs en mode TEST
echo -e "${YELLOW}[Test 2]${NC} Requête complète avec URLs en mode TEST..."
REF_COMMAND="TEST-FULL-$(date +%s)"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://paytech.sn/api/payment/request-payment" \
  -H "API_KEY: $PAYTECH_API_KEY" \
  -H "API_SECRET: $PAYTECH_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Product Complete",
    "item_price": 5000,
    "ref_command": "'${REF_COMMAND}'",
    "command_name": "Test Command Complete",
    "currency": "XOF",
    "env": "test",
    "ipn_url": "https://webhook.site/unique-id",
    "success_url": "http://localhost:5174/payment/success",
    "cancel_url": "http://localhost:5174/payment/cancel"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Code HTTP: $HTTP_CODE"
echo "Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 3: Requête en mode PROD (sans custom_field d'abord)
echo -e "${YELLOW}[Test 3]${NC} Requête minimale en mode PROD..."
REF_COMMAND="PROD-TEST-$(date +%s)"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://paytech.sn/api/payment/request-payment" \
  -H "API_KEY: $PAYTECH_API_KEY" \
  -H "API_SECRET: $PAYTECH_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Produit",
    "item_price": 2000,
    "ref_command": "'${REF_COMMAND}'",
    "command_name": "Commande Test",
    "currency": "XOF",
    "env": "prod"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Code HTTP: $HTTP_CODE"
echo "Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 4: Sans spécifier env (devrait être prod par défaut)
echo -e "${YELLOW}[Test 4]${NC} Requête sans spécifier env..."
REF_COMMAND="DEFAULT-$(date +%s)"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "https://paytech.sn/api/payment/request-payment" \
  -H "API_KEY: $PAYTECH_API_KEY" \
  -H "API_SECRET: $PAYTECH_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Produit Test",
    "item_price": 1500,
    "ref_command": "'${REF_COMMAND}'",
    "command_name": "Commande Test Default",
    "currency": "XOF"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Code HTTP: $HTTP_CODE"
echo "Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Si tous les tests échouent avec 422, le problème peut être:"
echo -e "  1. Les credentials ne sont pas valides"
echo -e "  2. Le compte PayTech n'est pas activé"
echo -e "  3. Les credentials sont pour test mais marqués comme prod (ou vice versa)"
echo ""
echo -e "Si un test réussit, notez lequel et ajustez le backend en conséquence."
echo ""
