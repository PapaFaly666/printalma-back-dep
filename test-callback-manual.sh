#!/bin/bash

# Script de test manuel du callback Orange Money
# Usage: ./test-callback-manual.sh [ORDER_NUMBER] [STATUS]
#
# ORDER_NUMBER : Numéro de commande existant dans la DB
# STATUS       : SUCCESS ou FAILED (défaut: SUCCESS)

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paramètres
ORDER_NUMBER="${1:-}"
STATUS="${2:-SUCCESS}"

if [ -z "$ORDER_NUMBER" ]; then
  echo -e "${RED}❌ Erreur: Numéro de commande requis${NC}"
  echo ""
  echo "Usage: $0 ORDER_NUMBER [STATUS]"
  echo ""
  echo "Exemples:"
  echo "  $0 CMD-67B7234E0F2D0"
  echo "  $0 CMD-67B7234E0F2D0 SUCCESS"
  echo "  $0 CMD-67B7234E0F2D0 FAILED"
  echo ""
  exit 1
fi

# URL du backend
BACKEND_URL="https://printalma-back-dep.onrender.com"

echo -e "${YELLOW}🧪 Test du callback Orange Money${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Commande      : ${GREEN}$ORDER_NUMBER${NC}"
echo -e "Statut        : ${GREEN}$STATUS${NC}"
echo -e "Backend URL   : $BACKEND_URL"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Générer un transaction ID unique
TRANSACTION_ID="TXN-TEST-$(date +%s)"
REFERENCE="OM-$ORDER_NUMBER-$(date +%s)"

# Construire le payload selon le statut
if [ "$STATUS" == "SUCCESS" ]; then
  PAYLOAD=$(cat <<EOF
{
  "status": "SUCCESS",
  "transactionId": "$TRANSACTION_ID",
  "amount": {
    "unit": "XOF",
    "value": 10000
  },
  "code": "599241",
  "reference": "$REFERENCE",
  "metadata": {
    "orderId": "1",
    "orderNumber": "$ORDER_NUMBER",
    "customerName": "Test Client"
  }
}
EOF
)
else
  PAYLOAD=$(cat <<EOF
{
  "status": "$STATUS",
  "transactionId": "$TRANSACTION_ID",
  "reference": "$REFERENCE",
  "metadata": {
    "orderId": "1",
    "orderNumber": "$ORDER_NUMBER"
  }
}
EOF
)
fi

echo -e "${YELLOW}📦 Payload envoyé:${NC}"
echo "$PAYLOAD" | jq '.'
echo ""

# Envoyer le callback
echo -e "${YELLOW}📡 Envoi du callback...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/orange-money/callback" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extraire le code HTTP et le body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}📨 Réponse du serveur:${NC}"
echo "  HTTP Status: $HTTP_CODE"
echo "  Body: $BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Callback envoyé avec succès !${NC}"
  echo ""
  echo -e "${YELLOW}🔍 Vérification du statut de la commande...${NC}"

  # Attendre 2 secondes pour que le backend traite
  sleep 2

  # Vérifier le statut
  STATUS_RESPONSE=$(curl -s "$BACKEND_URL/orange-money/payment-status/$ORDER_NUMBER")
  echo "$STATUS_RESPONSE" | jq '.'

  # Extraire le paymentStatus
  PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.paymentStatus')
  TRANSACTION_ID_SAVED=$(echo "$STATUS_RESPONSE" | jq -r '.transactionId')

  echo ""
  if [ "$PAYMENT_STATUS" == "PAID" ] || [ "$PAYMENT_STATUS" == "FAILED" ]; then
    echo -e "${GREEN}✅✅✅ SUCCÈS COMPLET !${NC}"
    echo -e "  Statut paiement: ${GREEN}$PAYMENT_STATUS${NC}"
    echo -e "  Transaction ID : ${GREEN}$TRANSACTION_ID_SAVED${NC}"
  else
    echo -e "${RED}⚠️ La commande n'a pas été mise à jour${NC}"
    echo -e "  Statut actuel: $PAYMENT_STATUS"
    echo -e "  Vérifiez les logs du backend Render"
  fi
else
  echo -e "${RED}❌ Erreur lors de l'envoi du callback${NC}"
  echo -e "  Code HTTP: $HTTP_CODE"
  echo -e "  Vérifiez que le backend est bien démarré"
fi

echo ""
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
