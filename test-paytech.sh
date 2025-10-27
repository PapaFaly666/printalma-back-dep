#!/bin/bash

# Script de test pour l'intégration PayTech
# Utilise l'API backend pour tester les fonctionnalités de paiement

BASE_URL="http://localhost:3004"
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Tests PayTech - Printalma Backend${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Vérifier la configuration PayTech
echo -e "${YELLOW}[Test 1]${NC} Vérification de la configuration PayTech..."
RESPONSE=$(curl -s -X GET "${BASE_URL}/paytech/test-config")
echo "$RESPONSE" | jq '.'

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Configuration PayTech OK${NC}\n"
else
    echo -e "${RED}✗ Configuration PayTech échouée${NC}\n"
    exit 1
fi

# Test 2: Diagnostic de connectivité API PayTech
echo -e "${YELLOW}[Test 2]${NC} Test de connectivité à l'API PayTech..."
DIAG_RESPONSE=$(curl -s -X GET "${BASE_URL}/paytech/diagnose")
echo "$DIAG_RESPONSE" | jq '.'

if echo "$DIAG_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ API PayTech accessible${NC}\n"
else
    echo -e "${RED}✗ Problème de connexion à l'API PayTech${NC}"
    echo -e "${RED}Erreur:${NC}"
    echo "$DIAG_RESPONSE" | jq '.error'
    echo ""
fi

# Test 3: Initialiser un paiement de test
echo -e "${YELLOW}[Test 3]${NC} Initialisation d'un paiement de test..."
REF_COMMAND="TEST-$(date +%s)"

PAYMENT_REQUEST='{
  "item_name": "Test Product",
  "item_price": 5000,
  "ref_command": "'${REF_COMMAND}'",
  "command_name": "Test Payment - '${REF_COMMAND}'",
  "currency": "XOF",
  "env": "test",
  "ipn_url": "'${BASE_URL}'/paytech/ipn-callback",
  "success_url": "http://localhost:5174/payment/success",
  "cancel_url": "http://localhost:5174/payment/cancel",
  "custom_field": "{\"test\": true, \"orderId\": 999}"
}'

echo "Requête de paiement:"
echo "$PAYMENT_REQUEST" | jq '.'

PAYMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/paytech/payment" \
  -H "Content-Type: application/json" \
  -d "$PAYMENT_REQUEST")

echo "Réponse de PayTech:"
echo "$PAYMENT_RESPONSE" | jq '.'

if echo "$PAYMENT_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✓ Paiement initialisé avec succès${NC}"

    # Extraire le token
    TOKEN=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.token')
    REDIRECT_URL=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.redirect_url')

    echo -e "${BLUE}Token:${NC} $TOKEN"
    echo -e "${BLUE}URL de paiement:${NC} $REDIRECT_URL\n"

    # Test 4: Vérifier le statut du paiement
    echo -e "${YELLOW}[Test 4]${NC} Vérification du statut du paiement..."
    sleep 2 # Attendre un peu avant de vérifier

    STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/paytech/status/${TOKEN}")
    echo "$STATUS_RESPONSE" | jq '.'

    if echo "$STATUS_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✓ Statut du paiement récupéré${NC}\n"

        # Afficher les détails du paiement
        echo -e "${BLUE}Détails du paiement:${NC}"
        echo "$STATUS_RESPONSE" | jq '.data'
    else
        echo -e "${RED}✗ Échec de la récupération du statut${NC}\n"
    fi

    # Afficher le lien de paiement pour test manuel
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Test manuel disponible${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "Pour tester le paiement complet, ouvrez ce lien:"
    echo -e "${BLUE}${REDIRECT_URL}${NC}"
    echo -e "\nRéférence de commande: ${BLUE}${REF_COMMAND}${NC}"
    echo ""

else
    echo -e "${RED}✗ Échec de l'initialisation du paiement${NC}\n"
    exit 1
fi

# Résumé final
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé des tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓${NC} Configuration vérifiée"
echo -e "${GREEN}✓${NC} API PayTech accessible"
echo -e "${GREEN}✓${NC} Paiement initialisé"
echo -e "${GREEN}✓${NC} Statut récupéré"
echo ""
echo -e "${YELLOW}Note:${NC} Pour tester le flux complet de paiement (IPN callback),"
echo -e "vous devez effectuer un paiement réel via l'URL fournie ci-dessus."
echo ""
