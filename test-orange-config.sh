#!/bin/bash

# Script de vérification de la configuration Orange Money
# Usage: ./test-orange-config.sh

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

echo -e "${BLUE}=========================================="
echo "🔍 VÉRIFICATION CONFIGURATION ORANGE MONEY"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Backend URL: $BACKEND_URL${NC}"
echo ""

# Fonction pour afficher les résultats
print_result() {
    local test_name=$1
    local success=$2
    local message=$3

    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ $test_name: SUCCÈS${NC}"
        if [ -n "$message" ]; then
            echo -e "   ${message}"
        fi
    else
        echo -e "${RED}❌ $test_name: ÉCHEC${NC}"
        if [ -n "$message" ]; then
            echo -e "   ${RED}$message${NC}"
        fi
    fi
    echo ""
}

# Test 1: Connexion au backend
echo -e "${YELLOW}📊 Test 1: Connexion au backend...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/orange-money/test-connection")

if [ "$HTTP_CODE" = "200" ]; then
    print_result "Connexion backend" "true" "Backend accessible"
else
    print_result "Connexion backend" "false" "Backend non accessible (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Test de connexion Orange Money
echo -e "${YELLOW}📊 Test 2: Test de connexion à l'API Orange Money...${NC}"
RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/test-connection")
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
MODE=$(echo "$RESPONSE" | jq -r '.mode // "unknown"')
SOURCE=$(echo "$RESPONSE" | jq -r '.source // "unknown"')
TOKEN_OBTAINED=$(echo "$RESPONSE" | jq -r '.tokenObtained // false')

if [ "$SUCCESS" = "true" ] && [ "$TOKEN_OBTAINED" = "true" ]; then
    print_result "Connexion Orange Money" "true" "Mode: $MODE | Source: $SOURCE | Token: obtenu"
else
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Erreur inconnue"')
    print_result "Connexion Orange Money" "false" "$ERROR_MSG"
    exit 1
fi

# Test 3: Vérification du callback URL
echo -e "${YELLOW}📊 Test 3: Vérification du callback URL enregistré...${NC}"
CALLBACK_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/verify-callback")
CALLBACK_SUCCESS=$(echo "$CALLBACK_RESPONSE" | jq -r '.success // false')

if [ "$CALLBACK_SUCCESS" = "true" ]; then
    CALLBACK_URL=$(echo "$CALLBACK_RESPONSE" | jq -r '.data[0].callbackUrl // "non configuré"')
    CALLBACK_CODE=$(echo "$CALLBACK_RESPONSE" | jq -r '.data[0].code // "non configuré"')
    print_result "Callback URL" "true" "URL: $CALLBACK_URL | Code: $CALLBACK_CODE"
else
    print_result "Callback URL" "false" "Callback non configuré. Exécutez: curl -X POST $BACKEND_URL/orange-money/register-callback"
fi

# Résumé final
echo -e "${BLUE}=========================================="
echo "📋 RÉSUMÉ DE LA CONFIGURATION"
echo -e "==========================================${NC}"
echo -e "Backend:           ${GREEN}Accessible${NC}"
echo -e "Orange Money API:  ${GREEN}Connecté${NC}"
echo -e "Mode:              ${YELLOW}$MODE${NC}"
echo -e "Source config:     ${YELLOW}$SOURCE${NC}"
echo -e "Token OAuth:       ${GREEN}Obtenu${NC}"
if [ "$CALLBACK_SUCCESS" = "true" ]; then
    echo -e "Callback URL:      ${GREEN}Configuré${NC}"
else
    echo -e "Callback URL:      ${YELLOW}Non configuré${NC}"
fi
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${GREEN}✅ Configuration validée ! Vous pouvez passer aux tests de paiement.${NC}"
echo ""
echo -e "${YELLOW}Prochaine étape:${NC}"
echo -e "  ./test-orange-payment.sh"
echo ""
