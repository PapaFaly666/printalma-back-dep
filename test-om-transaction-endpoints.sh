#!/bin/bash

# Test Orange Money Transaction Endpoints
# Ce script vérifie si les endpoints de transaction sont disponibles dans votre contrat Orange Money

echo "========================================"
echo "TEST DES ENDPOINTS DE TRANSACTION ORANGE MONEY"
echo "========================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Charger les variables d'environnement
source .env 2>/dev/null || true

# Configuration
ORANGE_MODE="${ORANGE_MODE:-production}"
if [ "$ORANGE_MODE" = "production" ]; then
    BASE_URL="https://api.orange-sonatel.com"
else
    BASE_URL="https://api.sandbox.orange-sonatel.com"
fi

echo "Mode: ${ORANGE_MODE}"
echo "Base URL: ${BASE_URL}"
echo ""

# Étape 1: Obtenir un token OAuth2
echo "========================================"
echo "ÉTAPE 1: Authentification OAuth2"
echo "========================================"

TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${ORANGE_CLIENT_ID}" \
  -d "client_secret=${ORANGE_CLIENT_SECRET}")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ ERREUR: Impossible d'obtenir le token OAuth2${NC}"
    echo "Réponse: $TOKEN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Token OAuth2 obtenu avec succès${NC}"
    echo "Token: ${ACCESS_TOKEN:0:20}..."
fi

echo ""

# Étape 2: Tester GET /api/eWallet/v4/transactions
echo "========================================"
echo "ÉTAPE 2: Test GET /api/eWallet/v4/transactions"
echo "========================================"
echo "Endpoint: ${BASE_URL}/api/eWallet/v4/transactions"
echo ""

TRANSACTIONS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${BASE_URL}/api/eWallet/v4/transactions" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$TRANSACTIONS_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$TRANSACTIONS_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "404" ]; then
    echo -e "${RED}❌ ENDPOINT N'EXISTE PAS${NC}"
    echo "Cet endpoint n'est pas disponible dans votre contrat Orange Money"
    TRANSACTIONS_AVAILABLE=false
elif [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️ ACCÈS REFUSÉ${NC}"
    echo "L'endpoint existe mais vous n'avez pas les permissions"
    echo "Contactez Orange Money pour activer cet accès"
    TRANSACTIONS_AVAILABLE=maybe
elif [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ ENDPOINT DISPONIBLE${NC}"
    echo "Réponse:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    TRANSACTIONS_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️ STATUT INCONNU: $HTTP_STATUS${NC}"
    echo "Réponse:"
    echo "$BODY"
    TRANSACTIONS_AVAILABLE=unknown
fi

echo ""

# Étape 3: Tester GET /api/eWallet/v4/transactions/{id}/status
echo "========================================"
echo "ÉTAPE 3: Test GET /api/eWallet/v4/transactions/{id}/status"
echo "========================================"
echo "Endpoint: ${BASE_URL}/api/eWallet/v4/transactions/TEST_TXN_ID/status"
echo ""

STATUS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "${BASE_URL}/api/eWallet/v4/transactions/TEST_TXN_ID/status" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_STATUS=$(echo "$STATUS_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$STATUS_RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "404" ]; then
    # Vérifier si c'est un 404 car la transaction n'existe pas ou car l'endpoint n'existe pas
    if echo "$BODY" | grep -qi "not found\|endpoint\|route"; then
        echo -e "${RED}❌ ENDPOINT N'EXISTE PAS${NC}"
        echo "Cet endpoint n'est pas disponible dans votre contrat Orange Money"
        STATUS_AVAILABLE=false
    else
        echo -e "${YELLOW}⚠️ ENDPOINT EXISTE (transaction de test introuvable)${NC}"
        echo "L'endpoint existe mais la transaction TEST_TXN_ID n'existe pas"
        echo "C'est normal - l'endpoint est disponible !"
        STATUS_AVAILABLE=true
    fi
elif [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️ ACCÈS REFUSÉ${NC}"
    echo "L'endpoint existe mais vous n'avez pas les permissions"
    echo "Contactez Orange Money pour activer cet accès"
    STATUS_AVAILABLE=maybe
elif [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ ENDPOINT DISPONIBLE${NC}"
    echo "Réponse:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    STATUS_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️ STATUT INCONNU: $HTTP_STATUS${NC}"
    echo "Réponse:"
    echo "$BODY"
    STATUS_AVAILABLE=unknown
fi

echo ""

# Résumé Final
echo "========================================"
echo "RÉSUMÉ"
echo "========================================"
echo ""

if [ "$TRANSACTIONS_AVAILABLE" = "true" ] && [ "$STATUS_AVAILABLE" = "true" ]; then
    echo -e "${GREEN}✅ LES ENDPOINTS DE TRANSACTION SONT DISPONIBLES${NC}"
    echo ""
    echo "Vous pouvez implémenter:"
    echo "  - GET /orange-money/transactions (liste des transactions)"
    echo "  - GET /orange-money/verify-transaction/:id (vérifier une transaction)"
    echo "  - GET /orange-money/check-payment/:orderNumber (réconciliation automatique)"
    echo ""
    echo "Prochaine étape: Demandez à Claude d'implémenter ces endpoints."
    echo ""
elif [ "$TRANSACTIONS_AVAILABLE" = "false" ] || [ "$STATUS_AVAILABLE" = "false" ]; then
    echo -e "${RED}❌ LES ENDPOINTS DE TRANSACTION NE SONT PAS DISPONIBLES${NC}"
    echo ""
    echo "Ces endpoints n'existent pas dans votre contrat Orange Money."
    echo ""
    echo "Solutions:"
    echo "  1. Utiliser uniquement les webhooks (configuration actuelle)"
    echo "  2. Contacter Orange Money pour activer ces endpoints:"
    echo "     Email: partenaires.orangemoney@orange-sonatel.com"
    echo ""
    echo "✅ La configuration actuelle (webhooks + polling BDD) fonctionne parfaitement."
    echo ""
elif [ "$TRANSACTIONS_AVAILABLE" = "maybe" ] || [ "$STATUS_AVAILABLE" = "maybe" ]; then
    echo -e "${YELLOW}⚠️ ENDPOINTS EXISTENT MAIS ACCÈS REFUSÉ${NC}"
    echo ""
    echo "Les endpoints existent mais vous n'avez pas les permissions."
    echo ""
    echo "Prochaine étape:"
    echo "  Contactez Orange Money pour activer l'accès:"
    echo "  Email: partenaires.orangemoney@orange-sonatel.com"
    echo ""
else
    echo -e "${YELLOW}⚠️ RÉSULTATS NON CONCLUANTS${NC}"
    echo ""
    echo "Impossible de déterminer si les endpoints sont disponibles."
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Vérifiez la documentation sur developer.orange-sonatel.com"
    echo "  2. Contactez Orange Money: partenaires.orangemoney@orange-sonatel.com"
    echo "  3. Utilisez la configuration actuelle (webhooks uniquement)"
    echo ""
fi

echo "========================================"
echo "Documentation créée:"
echo "  - ORANGE_MONEY_API_INVESTIGATION.md"
echo "  - ORANGE_MONEY_FINAL.md"
echo "  - ORANGE_MONEY_DEEPLINK_CALLBACK_GUIDE.md"
echo "========================================"
