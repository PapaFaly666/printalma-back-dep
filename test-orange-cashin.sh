#!/bin/bash

# 💰 Script de test pour le système Cash In Orange Money
# Ce script teste le flow complet :
# 1. Création d'un appel de fonds
# 2. Approbation par admin (déclenche le Cash In)
# 3. Simulation du callback Orange Money
# 4. Vérification du statut final

# Configuration
BASE_URL="http://localhost:3000"
ADMIN_TOKEN="YOUR_ADMIN_JWT_TOKEN"
VENDOR_TOKEN="YOUR_VENDOR_JWT_TOKEN"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}  🧪 TEST CASH IN ORANGE MONEY                  ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# 1. Test de connexion Orange Money
echo -e "${YELLOW}[1/5] Test de connexion à l'API Orange Money...${NC}"
curl -s -X GET "${BASE_URL}/orange-money/test-connection" \
  | jq '.' || echo -e "${RED}❌ Erreur de connexion${NC}"
echo ""

# 2. Création d'un appel de fonds (vendeur)
echo -e "${YELLOW}[2/5] Création d'un appel de fonds...${NC}"
FUNDS_REQUEST=$(curl -s -X POST "${BASE_URL}/vendor/funds-requests" \
  -H "Authorization: Bearer ${VENDOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Test Cash In - Paiement vendeur",
    "paymentMethod": "ORANGE_MONEY",
    "phoneNumber": "221771234567"
  }')

echo "$FUNDS_REQUEST" | jq '.'
FUNDS_REQUEST_ID=$(echo "$FUNDS_REQUEST" | jq -r '.id')

if [ "$FUNDS_REQUEST_ID" != "null" ] && [ -n "$FUNDS_REQUEST_ID" ]; then
  echo -e "${GREEN}✅ Appel de fonds créé avec ID: ${FUNDS_REQUEST_ID}${NC}"
else
  echo -e "${RED}❌ Échec de la création de l'appel de fonds${NC}"
  exit 1
fi
echo ""

# 3. Approbation par admin (déclenche le Cash In automatiquement)
echo -e "${YELLOW}[3/5] Approbation de la demande (déclenche Cash In)...${NC}"
APPROVAL=$(curl -s -X PATCH "${BASE_URL}/admin/funds-requests/${FUNDS_REQUEST_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminNote": "Test Cash In automatique"
  }')

echo "$APPROVAL" | jq '.'

TRANSACTION_ID=$(echo "$APPROVAL" | jq -r '.transactionId')
if [ "$TRANSACTION_ID" != "null" ] && [ -n "$TRANSACTION_ID" ]; then
  echo -e "${GREEN}✅ Cash In exécuté - Transaction ID: ${TRANSACTION_ID}${NC}"
else
  echo -e "${RED}⚠️  Pas de transactionId (Cash In peut-être en attente)${NC}"
fi
echo ""

# 4. Vérifier le statut de la demande
echo -e "${YELLOW}[4/5] Vérification du statut de la demande...${NC}"
STATUS=$(curl -s -X GET "${BASE_URL}/vendor/funds-requests/${FUNDS_REQUEST_ID}" \
  -H "Authorization: Bearer ${VENDOR_TOKEN}")

echo "$STATUS" | jq '.'
CURRENT_STATUS=$(echo "$STATUS" | jq -r '.status')
echo -e "${BLUE}Statut actuel: ${CURRENT_STATUS}${NC}"
echo ""

# 5. Simuler le callback Orange Money (test)
echo -e "${YELLOW}[5/5] Simulation du callback Orange Money...${NC}"
CALLBACK=$(curl -s -X POST "${BASE_URL}/orange-money/test-cashin-callback" \
  -H "Content-Type: application/json" \
  -d "{
    \"fundsRequestId\": ${FUNDS_REQUEST_ID},
    \"status\": \"SUCCESS\"
  }")

echo "$CALLBACK" | jq '.'

if [ "$(echo "$CALLBACK" | jq -r '.success')" = "true" ]; then
  echo -e "${GREEN}✅ Callback simulé avec succès${NC}"
else
  echo -e "${RED}❌ Erreur lors de la simulation du callback${NC}"
fi
echo ""

# Vérification finale
echo -e "${YELLOW}Vérification finale du statut...${NC}"
FINAL_STATUS=$(curl -s -X GET "${BASE_URL}/vendor/funds-requests/${FUNDS_REQUEST_ID}" \
  -H "Authorization: Bearer ${VENDOR_TOKEN}")

echo "$FINAL_STATUS" | jq '.'
FINAL_STATUS_VALUE=$(echo "$FINAL_STATUS" | jq -r '.status')

echo ""
echo -e "${BLUE}=================================================${NC}"
if [ "$FINAL_STATUS_VALUE" = "PAID" ]; then
  echo -e "${GREEN}✅ TEST RÉUSSI - Statut final: PAID${NC}"
  echo -e "${GREEN}   Le Cash In a été exécuté et confirmé !${NC}"
else
  echo -e "${YELLOW}⚠️  TEST PARTIEL - Statut final: ${FINAL_STATUS_VALUE}${NC}"
  echo -e "${YELLOW}   Le Cash In peut être en attente de confirmation${NC}"
fi
echo -e "${BLUE}=================================================${NC}"

# Instructions pour test réel
echo ""
echo -e "${BLUE}📝 Pour tester avec une vraie transaction :${NC}"
echo "1. Remplacez ADMIN_TOKEN et VENDOR_TOKEN par vos vrais tokens JWT"
echo "2. Assurez-vous que la config Orange Money est correcte dans PaymentConfig"
echo "3. Vérifiez que ORANGE_RETAILER_MSISDN et ORANGE_RETAILER_PIN sont configurés"
echo "4. Lancez : ./test-orange-cashin.sh"
echo ""
echo -e "${BLUE}📚 Documentation complète : ORANGE_MONEY_CASH_IN_GUIDE.md${NC}"
