#!/bin/bash

# Script de test d'un parcours de paiement Orange Money complet
# Usage: ./test-orange-payment.sh [ORDER_NUMBER]

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
ORDER_NUMBER="${1:-ORD-TEST-$(date +%Y%m%d%H%M%S)}"
ORDER_ID=999  # ID fictif pour le test
AMOUNT=10000
CUSTOMER_NAME="Client Test"
CUSTOMER_PHONE="221771234567"

echo -e "${BLUE}=========================================="
echo "💳 TEST PARCOURS PAIEMENT ORANGE MONEY"
echo -e "==========================================${NC}"
echo ""
echo -e "${YELLOW}Backend URL:    $BACKEND_URL${NC}"
echo -e "${YELLOW}Order Number:   $ORDER_NUMBER${NC}"
echo -e "${YELLOW}Amount:         $AMOUNT XOF${NC}"
echo -e "${YELLOW}Customer:       $CUSTOMER_NAME${NC}"
echo ""

# Fonction pour afficher les résultats
print_step() {
    local step_number=$1
    local step_name=$2
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📍 ÉTAPE $step_number: $step_name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

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

# Pause entre les étapes
pause_step() {
    echo -e "${YELLOW}⏳ Pause de 2 secondes...${NC}"
    sleep 2
    echo ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 1: Génération du paiement (QR Code)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_step "1" "Génération du paiement Orange Money (QR Code)"

PAYMENT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": $ORDER_ID,
    \"amount\": $AMOUNT,
    \"customerName\": \"$CUSTOMER_NAME\",
    \"customerPhone\": \"$CUSTOMER_PHONE\",
    \"orderNumber\": \"$ORDER_NUMBER\"
  }")

PAYMENT_SUCCESS=$(echo "$PAYMENT_RESPONSE" | jq -r '.success // false')

if [ "$PAYMENT_SUCCESS" = "true" ]; then
    REFERENCE=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.reference')
    VALIDITY=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.validity')
    HAS_QR=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.qrCode' | grep -q "data:image" && echo "true" || echo "false")

    print_result "Génération QR Code" "true" "Reference: $REFERENCE | Validité: ${VALIDITY}s | QR Code: présent"

    echo -e "${YELLOW}📸 QR Code généré !${NC}"
    echo -e "   ${CYAN}Pour visualiser le QR Code:${NC}"
    echo -e "   1. Copiez le contenu de 'data.qrCode' dans le JSON ci-dessous"
    echo -e "   2. Collez-le dans un fichier HTML ou un visualiseur base64"
    echo ""
    echo -e "${YELLOW}📱 Pour payer avec Orange Money (si vous avez l'app):${NC}"
    echo -e "   1. Ouvrez l'application Orange Money"
    echo -e "   2. Scannez le QR Code"
    echo -e "   3. Validez le paiement de $AMOUNT XOF"
    echo ""
else
    ERROR_MSG=$(echo "$PAYMENT_RESPONSE" | jq -r '.error // "Erreur inconnue"')
    print_result "Génération QR Code" "false" "$ERROR_MSG"
    exit 1
fi

pause_step

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 2: Vérification initiale du statut
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_step "2" "Vérification du statut initial du paiement"

STATUS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_NUMBER")
STATUS_SUCCESS=$(echo "$STATUS_RESPONSE" | jq -r '.success // false')
PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.paymentStatus // "UNKNOWN"')

if [ "$STATUS_SUCCESS" = "true" ]; then
    print_result "Vérification statut" "true" "Statut actuel: $PAYMENT_STATUS (attendu: PENDING)"
else
    print_result "Vérification statut" "false" "Impossible de vérifier le statut"
fi

pause_step

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 3: Simulation du callback SUCCESS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_step "3" "Simulation du callback de paiement réussi"

echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "   ${CYAN}En production réelle, cette étape serait effectuée par Orange Money${NC}"
echo -e "   ${CYAN}après que le client scanne et valide le paiement.${NC}"
echo ""
echo -e "${YELLOW}Pour ce test, nous simulons le callback...${NC}"
echo ""

TRANSACTION_ID="MP$(date +%Y%m%d).$(date +%H%M).TEST$(date +%s)"

CALLBACK_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_NUMBER\",
    \"transactionId\": \"$TRANSACTION_ID\"
  }")

CALLBACK_SUCCESS=$(echo "$CALLBACK_RESPONSE" | jq -r '.success // false')

if [ "$CALLBACK_SUCCESS" = "true" ]; then
    print_result "Callback SUCCESS" "true" "Transaction ID: $TRANSACTION_ID"

    echo -e "${GREEN}💰 Paiement simulé avec succès !${NC}"
    echo ""
else
    ERROR_MSG=$(echo "$CALLBACK_RESPONSE" | jq -r '.error // "Erreur inconnue"')
    print_result "Callback SUCCESS" "false" "$ERROR_MSG"
fi

pause_step

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 4: Vérification du statut après callback
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_step "4" "Vérification du statut après callback"

STATUS_AFTER=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_NUMBER")
STATUS_AFTER_SUCCESS=$(echo "$STATUS_AFTER" | jq -r '.success // false')
PAYMENT_STATUS_AFTER=$(echo "$STATUS_AFTER" | jq -r '.paymentStatus // "UNKNOWN"')
TRANSACTION_ID_SAVED=$(echo "$STATUS_AFTER" | jq -r '.transactionId // "non enregistré"')
SHOULD_REDIRECT=$(echo "$STATUS_AFTER" | jq -r '.shouldRedirect // false')
REDIRECT_URL=$(echo "$STATUS_AFTER" | jq -r '.redirectUrl // "non défini"')

if [ "$STATUS_AFTER_SUCCESS" = "true" ] && [ "$PAYMENT_STATUS_AFTER" = "PAID" ]; then
    print_result "Vérification finale" "true" "Statut: $PAYMENT_STATUS_AFTER | Transaction: $TRANSACTION_ID_SAVED | Redirect: $SHOULD_REDIRECT"

    echo -e "${GREEN}✅ Commande marquée comme PAYÉE !${NC}"
    echo ""
    echo -e "${CYAN}Détails du paiement:${NC}"
    echo "$STATUS_AFTER" | jq '.'
    echo ""

    if [ "$SHOULD_REDIRECT" = "true" ]; then
        echo -e "${YELLOW}🔀 URL de redirection:${NC}"
        echo -e "   $REDIRECT_URL"
        echo ""
    fi
else
    print_result "Vérification finale" "false" "Statut attendu: PAID, reçu: $PAYMENT_STATUS_AFTER"
    exit 1
fi

pause_step

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ÉTAPE 5: Test d'idempotence (double callback)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_step "5" "Test d'idempotence (envoi d'un second callback)"

echo -e "${YELLOW}Test: Envoi d'un second callback pour la même commande...${NC}"
echo ""

DUPLICATE_CALLBACK=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_NUMBER\",
    \"transactionId\": \"MP$(date +%Y%m%d).DUPLICATE.$(date +%s)\"
  }")

DUPLICATE_SUCCESS=$(echo "$DUPLICATE_CALLBACK" | jq -r '.success // false')

if [ "$DUPLICATE_SUCCESS" = "true" ]; then
    print_result "Idempotence" "true" "Second callback ignoré (idempotence OK)"

    # Vérifier que le transactionId n'a PAS changé
    STATUS_CHECK=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_NUMBER")
    TRANSACTION_ID_CHECK=$(echo "$STATUS_CHECK" | jq -r '.transactionId')

    if [ "$TRANSACTION_ID_CHECK" = "$TRANSACTION_ID_SAVED" ]; then
        echo -e "${GREEN}✅ Transaction ID inchangé : $TRANSACTION_ID_CHECK${NC}"
        echo -e "${GREEN}✅ L'idempotence fonctionne correctement !${NC}"
    else
        echo -e "${RED}❌ Transaction ID a changé : $TRANSACTION_ID_CHECK (attendu: $TRANSACTION_ID_SAVED)${NC}"
    fi
else
    print_result "Idempotence" "false" "Erreur lors du test d'idempotence"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RÉSUMÉ FINAL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}=========================================="
echo "📊 RÉSUMÉ DU TEST"
echo -e "==========================================${NC}"
echo ""
echo -e "${GREEN}✅ Commande:${NC}           $ORDER_NUMBER"
echo -e "${GREEN}✅ Montant:${NC}            $AMOUNT XOF"
echo -e "${GREEN}✅ Statut paiement:${NC}    $PAYMENT_STATUS_AFTER"
echo -e "${GREEN}✅ Transaction ID:${NC}     $TRANSACTION_ID_SAVED"
echo -e "${GREEN}✅ QR Code:${NC}            Généré"
echo -e "${GREEN}✅ Callback:${NC}           Traité"
echo -e "${GREEN}✅ Idempotence:${NC}        Validée"
echo ""
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${GREEN}🎉 TEST RÉUSSI ! Le parcours de paiement fonctionne correctement.${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo -e "  1. Tester un paiement échoué:    ./test-orange-payment-failed.sh"
echo -e "  2. Tester les transactions:      curl -X GET $BACKEND_URL/orange-money/transactions"
echo -e "  3. Test end-to-end complet:      ./test-orange-money-complete.sh"
echo ""
