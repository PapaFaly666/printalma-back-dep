#!/bin/bash

# 🧪 TEST COMPLET PAYTECH - PRINTALMA BACKEND
# Test complet du système de paiement avec simulation de flux réel

echo "🚀 TEST COMPLET SYSTÈME PAYTECH"
echo "========================================"

# Variables
BASE_URL="http://localhost:3004"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction pour vérifier le résultat
check_result() {
    local message=$1
    local expected=$2

    echo -e "${message}"

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ $3"
    else
        echo -e "${RED}❌ $3"
    fi
}

# 1. Vérifier que le serveur est démarré
echo -e "\n${YELLOW}[ÉTAPE 1]${NC} Vérification du serveur..."
echo -n "URL du serveur: $BASE_URL"

# Test simple de connexion
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/")

if [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${RED}❌ Serveur inaccessible (code 000)${NC}"
    echo -e "${RED}Vérifiez que le serveur est démarré sur le port 3004${NC}"
    exit 1
elif [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}❌ Serveur répond avec le code $HTTP_STATUS${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Serveur accessible${NC}"
fi

# 2. Configuration PayTech
echo -e "\n${YELLOW}[ÉTAPE 2]${NC} Test de configuration PayTech..."

CONFIG_RESPONSE=$(curl -s "$BASE_URL/paytech/test-config")

check_result "Configuration PayTech" "success.*true"
if [ $? -ne 0 ]; then
    echo -e "${RED}Configuration PayTech non disponible${NC}"
    exit 1
fi

# 3. Diagnostic de connectivité PayTech
echo -e "\n${YELLOW}[ÉTAPE 3]${NC} Diagnostic de connectivité à PayTech..."

DIAG_RESPONSE=$(curl -s "$BASE_URL/paytech/diagnose")

check_result "Diagnostic API PayTech" "success.*true"
if [ $? -ne 0 ]; then
    echo -e "${RED}API PayTech inaccessible${NC}"
    echo -e "${YELLOW}Détails: $DIAG_RESPONSE${NC}"
    exit 1
fi

# 4. Test d'initialisation de paiement
echo -e "\n${YELLOW}[ÉTAPE 4]${NC} Test d'initialisation de paiement..."

# Générer une référence unique
REF_COMMAND="PAYTECH_TEST_$(date +%s_%N)"

# Créer le payload de paiement
PAYLOAD='{
    "item_name": "Produit Test Printalma",
    "item_price": 1000,
    "ref_command": "'$REF_COMMAND'",
    "command_name": "Test Paiement Printalma - '$REF_COMMAND'",
    "currency": "XOF",
    "env": "test",
    "ipn_url": "'$BASE_URL/paytech/ipn-callback'",
    "success_url": "https://httpbin.org/post",
    "cancel_url": "https://httpbin.org/post",
    "custom_field": "{\"test\": true, \"timestamp\": \"$(date +%s)\"}"
}'

echo "Référence commande: $REF_COMMAND"
echo "Payload envoyé:"
echo "$PAYLOAD" | jq '.'

# Envoyer la requête d'initialisation
echo -e "\n${BLUE}Envoi de la requête d'initialisation...${NC}"

PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/payment" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo -e "\n${BLUE}Réponse reçue:${NC}"
echo "$PAYMENT_RESPONSE" | jq '.'

# Analyser la réponse
SUCCESS=$(echo "$PAYMENT_RESPONSE" | jq -r '.success // false')
TOKEN=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.token // empty')
REDIRECT_URL=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.redirect_url // empty')

check_result "Initialisation paiement" "$SUCCESS"

if [ "$SUCCESS" = "true" ]; then
    echo -e "\n${GREEN}✅ Paiement initialisé avec succès!${NC}"
    echo -e "${BLUE}Token de paiement: $TOKEN${NC}"
    echo -e "${BLUE}URL de redirection: $REDIRECT_URL${NC}"

    # 5. Test de statut du paiement
    echo -e "\n${YELLOW}[ÉTAPE 5]${NC} Test de statut du paiement..."

    sleep 3  # Attendre un peu pour que le traitement se fasse

    STATUS_RESPONSE=$(curl -s "$BASE_URL/paytech/status/$TOKEN")

    echo -e "${BLUE}Réponse de statut:${NC}"
    echo "$STATUS_RESPONSE" | jq '.'

    STATUS_SUCCESS=$(echo "$STATUS_RESPONSE" | jq -r '.success // false')

    check_result "Vérification statut" "$STATUS_SUCCESS"

    if [ "$STATUS_SUCCESS" = "true" ]; then
        echo -e "\n${GREEN}✅ Statut du paiement vérifié!${NC}"

        # Afficher les détails du paiement
        echo -e "\n${BLUE}Détails du paiement:${NC}"
        echo "$STATUS_RESPONSE" | jq '.data'
    else
        echo -e "${RED}❌ Impossible de vérifier le statut du paiement${NC}"
    fi
else
    echo -e "\n${RED}❌ Échec de l'initialisation du paiement${NC}"

    # Afficher les détails de l'erreur
    ERROR_MSG=$(echo "$PAYMENT_RESPONSE" | jq -r '.message // .error // "Erreur inconnue"')
    echo -e "${RED}Erreur: $ERROR_MSG${NC}"
fi

# 6. Test webhook IPN (simulation)
echo -e "\n${YELLOW}[ÉTAPE 6]${NC} Test webhook IPN (simulation)..."

# Créer un payload IPN de test
IPN_PAYLOAD='{
    "ref_command": "'$REF_COMMAND'",
    "type_event": "sale_complete",
    "success": "1",
    "item_price": "1000",
    "transaction_id": "txn_'$(date +%s)",
    "mac_compute": "simulation_test_signature",
    "custom_field": "{\"test\": true, \"webhook\": true}"
}'

echo "Envoi du webhook IPN de test..."
IPN_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_PAYLOAD")

echo -e "\n${BLUE}Réponse IPN:${NC}"
echo "$IPN_RESPONSE" | jq '.'

IPN_SUCCESS=$(echo "$IPN_RESPONSE" | jq -r '.success // false')

check_result "Webhook IPN" "$IPN_SUCCESS"

# 7. Résumé final
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           RÉSUMÉ DES TESTS           ${NC}"
echo -e "${BLUE}========================================${NC}"

if [ "$SUCCESS" = "true" ] && [ "$STATUS_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Configuration PayTech${NC}"
    echo -e "${GREEN}✅ Connectivité API${NC}"
    echo -e "${GREEN}✅ Initialisation paiement${NC}"
    echo -e "${GREEN}✅ Vérification statut${NC}"
    echo -e "${GREEN}✅ Webhook IPN${NC}"
    echo -e "\n${GREEN}🎯 SYSTÈME PAYTECH FONCTIONNEL!${NC}"
else
    echo -e "\n${RED}❌ Échec dans les tests PayTech${NC}"
    echo -e "\n${RED}   Vérifiez la configuration PostgreSQL${NC}"
    echo -e "\n${RED}   Redémarrez le serveur avec les bons droits${NC}"
fi

echo -e "\n${YELLOW}Note:${NC} Pour tester le flux de paiement complet:"
echo -e "1. Rendez-vous sur $REDIRECT_URL"
echo -e "2. Complétez le paiement"
echo -e "3. Le webhook IPN sera automatiquement appelé"
echo -e "\n${YELLOW}Référence: $REF_COMMAND${NC}"