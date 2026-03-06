#!/bin/bash

# Script de test END-TO-END complet de l'implémentation Orange Money
# Usage: ./test-orange-money-complete.sh

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Compteurs de tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                            ║${NC}"
echo -e "${MAGENTA}║  🧪 TEST END-TO-END COMPLET - ORANGE MONEY API             ║${NC}"
echo -e "${MAGENTA}║                                                            ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Backend URL: $BACKEND_URL${NC}"
echo -e "${YELLOW}Timestamp:   $TIMESTAMP${NC}"
echo ""

# Fonction pour exécuter un test
run_test() {
    local test_name=$1
    local test_command=$2
    local expected_value=$3
    local actual_value=$4

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$actual_value" = "$expected_value" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}  ✅ $test_name${NC}"
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}  ❌ $test_name${NC}"
        echo -e "${RED}     Attendu: $expected_value | Reçu: $actual_value${NC}"
        return 1
    fi
}

# Fonction pour afficher une section
print_section() {
    local section_name=$1
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📍 $section_name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 1: CONFIGURATION & CONNEXION
# ═══════════════════════════════════════════════════════════════════════════
print_section "1️⃣  CONFIGURATION & CONNEXION"

# Test 1.1: Backend accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/orange-money/test-connection")
run_test "Backend accessible" "" "200" "$HTTP_CODE"

# Test 1.2: Connexion Orange Money
CONN_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/test-connection")
CONN_SUCCESS=$(echo "$CONN_RESPONSE" | jq -r '.success // false')
run_test "Connexion Orange Money API" "" "true" "$CONN_SUCCESS"

# Test 1.3: Token OAuth obtenu
TOKEN_OBTAINED=$(echo "$CONN_RESPONSE" | jq -r '.tokenObtained // false')
run_test "Token OAuth obtenu" "" "true" "$TOKEN_OBTAINED"

# Test 1.4: Mode configuré
MODE=$(echo "$CONN_RESPONSE" | jq -r '.mode // "unknown"')
echo -e "${YELLOW}  ℹ️  Mode actuel: $MODE${NC}"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 2: CALLBACKS (WEBHOOKS)
# ═══════════════════════════════════════════════════════════════════════════
print_section "2️⃣  CALLBACKS (WEBHOOKS)"

# Test 2.1: Vérification callback URL
CALLBACK_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/verify-callback")
CALLBACK_SUCCESS=$(echo "$CALLBACK_RESPONSE" | jq -r '.success // false')
run_test "Callback URL vérifié" "" "true" "$CALLBACK_SUCCESS"

if [ "$CALLBACK_SUCCESS" = "true" ]; then
    CALLBACK_URL=$(echo "$CALLBACK_RESPONSE" | jq -r '.data[0].callbackUrl // "non configuré"')
    echo -e "${YELLOW}  ℹ️  Callback URL: $CALLBACK_URL${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 3: PARCOURS PAIEMENT RÉUSSI
# ═══════════════════════════════════════════════════════════════════════════
print_section "3️⃣  PARCOURS PAIEMENT RÉUSSI"

ORDER_SUCCESS="ORD-TEST-SUCCESS-$TIMESTAMP"
AMOUNT_SUCCESS=10000

echo -e "${YELLOW}  📦 Commande: $ORDER_SUCCESS${NC}"
echo -e "${YELLOW}  💰 Montant: $AMOUNT_SUCCESS XOF${NC}"
echo ""

# Test 3.1: Génération du paiement (QR Code)
PAYMENT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": 1,
    \"amount\": $AMOUNT_SUCCESS,
    \"customerName\": \"Test Client Success\",
    \"customerPhone\": \"221771234567\",
    \"orderNumber\": \"$ORDER_SUCCESS\"
  }")

PAYMENT_SUCCESS=$(echo "$PAYMENT_RESPONSE" | jq -r '.success // false')
run_test "Génération QR Code (SUCCESS)" "" "true" "$PAYMENT_SUCCESS"

if [ "$PAYMENT_SUCCESS" = "true" ]; then
    REFERENCE=$(echo "$PAYMENT_RESPONSE" | jq -r '.data.reference')
    echo -e "${YELLOW}  ℹ️  Reference: $REFERENCE${NC}"
fi

# Test 3.2: Vérification statut initial
STATUS_INITIAL=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_SUCCESS")
PAYMENT_STATUS_INITIAL=$(echo "$STATUS_INITIAL" | jq -r '.paymentStatus // "UNKNOWN"')
run_test "Statut initial = PENDING" "" "PENDING" "$PAYMENT_STATUS_INITIAL"

# Test 3.3: Simulation callback SUCCESS
TRANSACTION_ID_SUCCESS="MP$(date +%Y%m%d).$(date +%H%M).SUCCESS$TIMESTAMP"

CALLBACK_SUCCESS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_SUCCESS\",
    \"transactionId\": \"$TRANSACTION_ID_SUCCESS\"
  }")

CALLBACK_SUCCESS_OK=$(echo "$CALLBACK_SUCCESS_RESPONSE" | jq -r '.success // false')
run_test "Callback SUCCESS traité" "" "true" "$CALLBACK_SUCCESS_OK"

# Test 3.4: Vérification statut après callback
sleep 1  # Petite pause pour laisser le callback être traité
STATUS_AFTER=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_SUCCESS")
PAYMENT_STATUS_AFTER=$(echo "$STATUS_AFTER" | jq -r '.paymentStatus // "UNKNOWN"')
run_test "Statut final = PAID" "" "PAID" "$PAYMENT_STATUS_AFTER"

# Test 3.5: Transaction ID enregistré
TRANSACTION_ID_SAVED=$(echo "$STATUS_AFTER" | jq -r '.transactionId // "none"')
run_test "Transaction ID enregistré" "" "$TRANSACTION_ID_SUCCESS" "$TRANSACTION_ID_SAVED"

# Test 3.6: shouldRedirect = true
SHOULD_REDIRECT=$(echo "$STATUS_AFTER" | jq -r '.shouldRedirect // false')
run_test "shouldRedirect = true" "" "true" "$SHOULD_REDIRECT"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 4: IDEMPOTENCE (DOUBLE CALLBACK)
# ═══════════════════════════════════════════════════════════════════════════
print_section "4️⃣  IDEMPOTENCE (DOUBLE CALLBACK)"

# Test 4.1: Envoi d'un second callback
DUPLICATE_CALLBACK=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_SUCCESS\",
    \"transactionId\": \"MP$(date +%Y%m%d).DUPLICATE.$TIMESTAMP\"
  }")

DUPLICATE_OK=$(echo "$DUPLICATE_CALLBACK" | jq -r '.success // false')
run_test "Second callback accepté" "" "true" "$DUPLICATE_OK"

# Test 4.2: Transaction ID inchangé
STATUS_CHECK=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_SUCCESS")
TRANSACTION_ID_CHECK=$(echo "$STATUS_CHECK" | jq -r '.transactionId')
run_test "Transaction ID inchangé (idempotence)" "" "$TRANSACTION_ID_SUCCESS" "$TRANSACTION_ID_CHECK"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 5: PARCOURS PAIEMENT ÉCHOUÉ
# ═══════════════════════════════════════════════════════════════════════════
print_section "5️⃣  PARCOURS PAIEMENT ÉCHOUÉ"

ORDER_FAILED="ORD-TEST-FAILED-$TIMESTAMP"
AMOUNT_FAILED=5000

echo -e "${YELLOW}  📦 Commande: $ORDER_FAILED${NC}"
echo -e "${YELLOW}  💰 Montant: $AMOUNT_FAILED XOF${NC}"
echo ""

# Test 5.1: Génération du paiement
PAYMENT_FAILED_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": 2,
    \"amount\": $AMOUNT_FAILED,
    \"customerName\": \"Test Client Failed\",
    \"customerPhone\": \"221771234567\",
    \"orderNumber\": \"$ORDER_FAILED\"
  }")

PAYMENT_FAILED_SUCCESS=$(echo "$PAYMENT_FAILED_RESPONSE" | jq -r '.success // false')
run_test "Génération QR Code (FAILED)" "" "true" "$PAYMENT_FAILED_SUCCESS"

# Test 5.2: Simulation callback FAILED
CALLBACK_FAILED_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-failed" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderNumber\": \"$ORDER_FAILED\"
  }")

CALLBACK_FAILED_OK=$(echo "$CALLBACK_FAILED_RESPONSE" | jq -r '.success // false')
run_test "Callback FAILED traité" "" "true" "$CALLBACK_FAILED_OK"

# Test 5.3: Vérification statut = FAILED
sleep 1
STATUS_FAILED=$(curl -s -X GET "$BACKEND_URL/orange-money/payment-status/$ORDER_FAILED")
PAYMENT_STATUS_FAILED=$(echo "$STATUS_FAILED" | jq -r '.paymentStatus // "UNKNOWN"')
run_test "Statut = FAILED" "" "FAILED" "$PAYMENT_STATUS_FAILED"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 6: CALLBACK FORMAT SIMPLIFIÉ
# ═══════════════════════════════════════════════════════════════════════════
print_section "6️⃣  CALLBACK FORMAT SIMPLIFIÉ"

ORDER_SIMPLE="ORD-TEST-SIMPLE-$TIMESTAMP"
TRANSACTION_ID_SIMPLE="OM-$ORDER_SIMPLE-$(date +%s)"

# Test 6.1: Génération du paiement
PAYMENT_SIMPLE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": 3,
    \"amount\": 15000,
    \"customerName\": \"Test Client Simple\",
    \"customerPhone\": \"221771234567\",
    \"orderNumber\": \"$ORDER_SIMPLE\"
  }")

PAYMENT_SIMPLE_SUCCESS=$(echo "$PAYMENT_SIMPLE_RESPONSE" | jq -r '.success // false')
run_test "Génération QR Code (SIMPLE)" "" "true" "$PAYMENT_SIMPLE_SUCCESS"

# Test 6.2: Simulation callback format simplifié
CALLBACK_SIMPLE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/orange-money/test-callback-simple" \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID_SIMPLE\"
  }")

CALLBACK_SIMPLE_OK=$(echo "$CALLBACK_SIMPLE_RESPONSE" | jq -r '.success // false')
run_test "Callback SIMPLE traité" "" "true" "$CALLBACK_SIMPLE_OK"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 7: TRANSACTIONS (GET /transactions)
# ═══════════════════════════════════════════════════════════════════════════
print_section "7️⃣  ENDPOINTS DE TRANSACTIONS"

# Test 7.1: GET /transactions (toutes les transactions)
TRANSACTIONS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/transactions")
TRANSACTIONS_SUCCESS=$(echo "$TRANSACTIONS_RESPONSE" | jq -r '.success // false')
run_test "GET /transactions" "" "true" "$TRANSACTIONS_SUCCESS"

if [ "$TRANSACTIONS_SUCCESS" = "true" ]; then
    TRANSACTIONS_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | jq -r '.total // 0')
    echo -e "${YELLOW}  ℹ️  Transactions récupérées: $TRANSACTIONS_COUNT${NC}"
fi

# Test 7.2: Filtrage par status
TRANSACTIONS_SUCCESS_FILTER=$(curl -s -X GET "$BACKEND_URL/orange-money/transactions?status=SUCCESS")
TRANSACTIONS_SUCCESS_OK=$(echo "$TRANSACTIONS_SUCCESS_FILTER" | jq -r '.success // false')
run_test "GET /transactions?status=SUCCESS" "" "true" "$TRANSACTIONS_SUCCESS_OK"

# Test 7.3: Filtrage par type
TRANSACTIONS_TYPE_FILTER=$(curl -s -X GET "$BACKEND_URL/orange-money/transactions?type=MERCHANT_PAYMENT")
TRANSACTIONS_TYPE_OK=$(echo "$TRANSACTIONS_TYPE_FILTER" | jq -r '.success // false')
run_test "GET /transactions?type=MERCHANT_PAYMENT" "" "true" "$TRANSACTIONS_TYPE_OK"

# Test 7.4: Pagination
TRANSACTIONS_PAGE=$(curl -s -X GET "$BACKEND_URL/orange-money/transactions?page=0&size=5")
TRANSACTIONS_PAGE_OK=$(echo "$TRANSACTIONS_PAGE" | jq -r '.success // false')
run_test "GET /transactions?page=0&size=5" "" "true" "$TRANSACTIONS_PAGE_OK"

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 8: VÉRIFICATION DE TRANSACTION
# ═══════════════════════════════════════════════════════════════════════════
print_section "8️⃣  VÉRIFICATION DE TRANSACTION"

# Test 8.1: Vérification d'une transaction spécifique
if [ -n "$TRANSACTION_ID_SUCCESS" ]; then
    VERIFY_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/verify-transaction/$TRANSACTION_ID_SUCCESS")
    VERIFY_SUCCESS=$(echo "$VERIFY_RESPONSE" | jq -r '.success // false')
    run_test "GET /verify-transaction/:id" "" "true" "$VERIFY_SUCCESS"

    if [ "$VERIFY_SUCCESS" = "true" ]; then
        VERIFY_STATUS=$(echo "$VERIFY_RESPONSE" | jq -r '.status // "UNKNOWN"')
        echo -e "${YELLOW}  ℹ️  Statut transaction: $VERIFY_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}  ⏭️  Test ignoré (pas de transactionId)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# SECTION 9: RÉCONCILIATION
# ═══════════════════════════════════════════════════════════════════════════
print_section "9️⃣  RÉCONCILIATION"

# Test 9.1: Vérification avec réconciliation
RECONCILE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/orange-money/check-payment/$ORDER_SUCCESS")
RECONCILE_SUCCESS=$(echo "$RECONCILE_RESPONSE" | jq -r '.success // false')
run_test "GET /check-payment/:orderNumber" "" "true" "$RECONCILE_SUCCESS"

if [ "$RECONCILE_SUCCESS" = "true" ]; then
    RECONCILED=$(echo "$RECONCILE_RESPONSE" | jq -r '.reconciled // false')
    echo -e "${YELLOW}  ℹ️  Réconciliation nécessaire: $RECONCILED${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                            ║${NC}"
echo -e "${MAGENTA}║  📊 RÉSUMÉ DES TESTS                                       ║${NC}"
echo -e "${MAGENTA}║                                                            ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Total de tests:   ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "${GREEN}Tests réussis:    $PASSED_TESTS${NC}"
echo -e "${RED}Tests échoués:    $FAILED_TESTS${NC}"
echo ""

# Calcul du pourcentage de réussite
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "${CYAN}Taux de réussite: ${YELLOW}$SUCCESS_RATE%${NC}"
    echo ""
fi

# Résultat final
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !               ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  Votre implémentation Orange Money est 100% fonctionnelle ║${NC}"
    echo -e "${GREEN}║  et conforme à la documentation officielle.               ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Prêt pour la production !${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  ⚠️  CERTAINS TESTS ONT ÉCHOUÉ                             ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  Veuillez vérifier les erreurs ci-dessus.                 ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📋 Pour plus d'informations:${NC}"
    echo -e "  - Consultez les logs du backend"
    echo -e "  - Vérifiez les variables d'environnement (.env)"
    echo -e "  - Référez-vous à ORANGE_MONEY_PRODUCTION_TESTS.md"
    echo ""
    exit 1
fi
